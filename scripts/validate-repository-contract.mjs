/* global fetch, Buffer */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const run = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const files = run(['ls-files']).split('\n').filter(Boolean);
const errors = [];

const allowedEnvironmentFiles = new Set(['.env.example']);
const forbiddenPathPatterns = [
  /(^|\/)node_modules\//,
  /(^|\/)(id_rsa|id_ed25519)(\.|$)/,
  /\.(pem|key|p12|pfx)$/i,
];

for (const file of files) {
  if (/(^|\/)\.env($|\.)/.test(file) && !allowedEnvironmentFiles.has(file)) {
    errors.push(`Forbidden tracked path: ${file}`);
  }

  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) {
    errors.push(`Forbidden tracked path: ${file}`);
  }
}

for (const file of files.filter((file) => /\.json$/i.test(file))) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`Invalid JSON: ${file} (${error.message})`);
  }
}

const baseRef = process.env.GITHUB_BASE_REF;
let changed = [];
let baselineTopLevel;

if (baseRef) {
  try {
    run(['fetch', '--no-tags', 'origin', `+refs/heads/${baseRef}:refs/remotes/origin/${baseRef}`]);
  } catch (error) {
    errors.push(`Unable to fetch PR base origin/${baseRef}: ${error.message}`);
  }

  try {
    const baselineFiles = run(['ls-tree', '-r', '--name-only', `origin/${baseRef}`])
      .split('\n')
      .filter(Boolean);
    baselineTopLevel = new Set(baselineFiles.map((file) => file.split('/')[0]).filter(Boolean));
  } catch (error) {
    errors.push(`Unable to inspect baseline tree origin/${baseRef}: ${error.message}`);
    baselineTopLevel = new Set();
  }

  try {
    // GitHub pull_request workflows normally check out a synthetic merge
    // commit. Its first parent is the base side of that merge. Diffing the
    // first parent to HEAD avoids relying on a three-dot merge-base lookup
    // that can fail when refs were fetched with incomplete ancestry.
    const parents = run(['rev-list', '--parents', '-n', '1', 'HEAD']).split(/\s+/).slice(1);
    const diffBase = parents.length > 1 ? parents[0] : `origin/${baseRef}`;
    changed = run(['diff', '--name-only', diffBase, 'HEAD']).split('\n').filter(Boolean);
  } catch (error) {
    errors.push(`Unable to determine PR diff against origin/${baseRef}: ${error.message}`);
  }
} else {
  // On a non-PR invocation, the checked-out tree is the baseline.
  baselineTopLevel = new Set(files.map((file) => file.split('/')[0]).filter(Boolean));
}

// PR #57 explicitly introduces these boundary surfaces and backs them with
// ADR-0001. They are approved additions to the frozen main baseline, not
// silently converted into the baseline itself.
const approvedTopLevelAdditions = new Set([
  'REPO-CONTRACT.md',
  'activation',
  'prisma.config.ts',
  '.twgt',
  'schemas',
]);

const topLevel = new Set(files.map((file) => file.split('/')[0]).filter(Boolean));
for (const entry of topLevel) {
  if (baselineTopLevel.has(entry) || approvedTopLevelAdditions.has(entry)) continue;
  errors.push(`Unapproved top-level entry: ${entry}`);
}

const structuralTriggers = [
  /^REPO-CONTRACT\.md$/,
  /^docs\/adr\//,
  /^docs\/governance\//,
  /^docs\/ecosystem-map\.md$/,
  /^activation\//,
  /^prisma\.config\.(?:js|ts|mjs|cjs|mts|cts)$/,
  /^tsconfig(?:\..*)?\.json$/,
  /^src\/index\./,
  /^\.github\/workflows\//,
];

const dependencyFields = new Set([
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
  'peerDependenciesMeta',
  'bundledDependencies',
  'bundleDependencies',
]);

const packageJsonRequiresAdr = () => {
  if (!baseRef || !changed.includes('package.json')) return false;

  try {
    const before = JSON.parse(run(['show', `origin/${baseRef}:package.json`]));
    const after = JSON.parse(readFileSync('package.json', 'utf8'));
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const changedKeys = [...keys].filter(
      (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
    );
    const nonDependencyChanges = changedKeys.filter((key) => !dependencyFields.has(key));

    if (nonDependencyChanges.length === 0) {
      console.log(`Dependency-only package.json change: ${changedKeys.join(', ') || 'none'}`);
      return false;
    }

    console.log(`Structural package.json fields changed: ${nonDependencyChanges.join(', ')}`);
    return true;
  } catch (error) {
    errors.push(`Unable to classify package.json change: ${error.message}`);
    return true;
  }
};

if (changed.length > 0) {
  const requiresAdr =
    changed.some((path) => structuralTriggers.some((pattern) => pattern.test(path))) ||
    packageJsonRequiresAdr();
  const hasAdr = changed.some((path) => /^docs\/adr\/\d{4}-.+\.md$/.test(path));
  if (requiresAdr && !hasAdr) {
    errors.push('Protected structural change detected without a numbered ADR in docs/adr/.');
  }
}

const activationRoot = 'activation';
const activationAllowed = new Set([
  'config',
  'schemas',
  'prompts',
  'protocols',
  'scripts',
  'state',
  'evidence',
  'README.md',
]);

for (const file of files.filter((file) => file.startsWith(`${activationRoot}/`))) {
  const relative = file.slice(`${activationRoot}/`.length);
  const firstSegment = relative.split('/')[0];
  if (!activationAllowed.has(firstSegment)) {
    errors.push(`Activation boundary violation: ${file}`);
  }
}

// --- ADR registry check -----------------------------------------------------
// Fetches the central ADR registry from engineering-intelligence at the SHA
// pinned in .twgt/adr-registry-pin.json, verifies its hash, and checks that
// every docs/adr/NNNN-*.md file in the PR diff matches a registry entry
// whose repo is TWGT-. Fail-closed: any error pushes to errors[].
//
// Logic mirrors twgt-bridge/bin/verify-adr-registry.mjs. If the verifier is
// updated, apply the same fix here, or refactor to import when twgt-bridge
// publishes as an npm package.
if (baseRef && changed.length > 0) {
  try {
    const pinPath = '.twgt/adr-registry-pin.json';
    let pin = null;
    try {
      pin = JSON.parse(readFileSync(pinPath, 'utf8'));
    } catch (e) {
      errors.push(`ADR registry pin missing or malformed: ${pinPath} (${String(e.message || e)})`);
    }
    if (pin) {
      if (!pin.repo || !pin.path || !pin.bridge_sha || !pin.registry_sha256) {
        errors.push(
          `ADR registry pin incomplete: ${pinPath} must contain repo, path, bridge_sha, registry_sha256`,
        );
      } else {
        const url = `https://raw.githubusercontent.com/${pin.repo}/${pin.bridge_sha}/${pin.path}`;
        let registryBytes = null;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            errors.push(`ADR registry fetch failed: ${res.status} ${res.statusText} (${url})`);
          } else {
            registryBytes = Buffer.from(await res.arrayBuffer());
          }
        } catch (e) {
          errors.push(`ADR registry fetch error: ${String(e.message || e)} (${url})`);
        }
        if (registryBytes) {
          const actualHash = createHash('sha256').update(registryBytes).digest('hex');
          if (actualHash !== pin.registry_sha256) {
            errors.push(
              `ADR registry hash mismatch: expected ${pin.registry_sha256}, got ${actualHash}`,
            );
          } else {
            let registry = null;
            try {
              registry = JSON.parse(registryBytes.toString('utf8'));
            } catch (e) {
              errors.push(`ADR registry JSON parse failed: ${String(e.message || e)}`);
            }
            if (registry && Array.isArray(registry.allocated)) {
              const changedAdrs = changed.filter((p) => /^docs\/adr\/\d{4}-.+\.md$/.test(p));
              for (const adrPath of changedAdrs) {
                const m = adrPath.match(/^docs\/adr\/(\d{4})-(.+)\.md$/);
                if (!m) continue;
                const number = m[1];
                const slug = m[2];
                const matches = registry.allocated.filter((e) => e.number === number);
                if (matches.length === 0) {
                  errors.push(`ADR ${adrPath}: number ${number} not in registry`);
                  continue;
                }
                if (matches.length > 1) {
                  errors.push(
                    `ADR ${adrPath}: registry has ${matches.length} entries for number ${number}`,
                  );
                  continue;
                }
                const entry = matches[0];
                if (entry.repo !== 'lifestyle3nergy-web/TWGT-') {
                  errors.push(
                    `ADR ${adrPath}: registry assigns ${number} to ${entry.repo}, not TWGT-`,
                  );
                  continue;
                }
                if (entry.slug !== slug) {
                  errors.push(
                    `ADR ${adrPath}: registry slug for ${number} is "${entry.slug}", file has "${slug}"`,
                  );
                }
              }
            } else if (registry) {
              errors.push('ADR registry missing allocated array');
            }
          }
        }
      }
    }
  } catch (e) {
    errors.push(`ADR registry check error: ${String(e.message || e)}`);
  }
}

if (errors.length) {
  console.error('Repository contract validation FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Repository contract validation PASSED');
console.log(`Tracked files inspected: ${files.length}`);
if (changed.length) console.log(`PR files inspected: ${changed.length}`);
