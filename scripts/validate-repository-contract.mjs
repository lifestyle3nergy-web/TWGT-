import { execFileSync } from 'node:child_process';
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
  if (
    /(^|\/)\.env($|\.)/.test(file) &&
    !allowedEnvironmentFiles.has(file)
  ) {
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
    run(['fetch', '--no-tags', '--depth=1', 'origin', baseRef]);
  } catch {
    // The workflow uses fetch-depth: 0, but keep the validator useful locally.
  }

  try {
    const baselineFiles = run(['ls-tree', '-r', '--name-only', `origin/${baseRef}`])
      .split('\n')
      .filter(Boolean);
    baselineTopLevel = new Set(
      baselineFiles.map((file) => file.split('/')[0]).filter(Boolean),
    );
  } catch (error) {
    errors.push(`Unable to inspect baseline tree origin/${baseRef}: ${error.message}`);
    baselineTopLevel = new Set();
  }

  try {
    changed = run(['diff', '--name-only', `origin/${baseRef}...HEAD`])
      .split('\n')
      .filter(Boolean);
  } catch {
    errors.push(`Unable to determine PR diff against origin/${baseRef}`);
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
  /^package\.json$/,
  /^tsconfig(?:\..*)?\.json$/,
  /^src\/index\./,
  /^\.github\/workflows\//,
];

if (changed.length > 0) {
  const requiresAdr = changed.some((path) => structuralTriggers.some((pattern) => pattern.test(path)));
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

if (errors.length) {
  console.error('Repository contract validation FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Repository contract validation PASSED');
console.log(`Tracked files inspected: ${files.length}`);
if (changed.length) console.log(`PR files inspected: ${changed.length}`);
