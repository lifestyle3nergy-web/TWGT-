// Deterministic Node runtime gate for TWGT verification.
//
// TWGT declares `engines.node: ">=24.0.0 <25.0.0"`, but npm does not enforce
// engines by default: it only prints an EBADENGINE warning. A warning is not
// verification. This script is the authoritative runtime boundary:
//
//   - `npm run check:node` runs it directly;
//   - the `prelint` / `pretypecheck` / `pretest` / `prebuild` lifecycle hooks
//     invoke it before every verification command, so an unsupported runtime
//     cannot accidentally produce a passing TWGT verification result;
//   - CI runs it explicitly after setting up Node 24.
//
// Exit codes: 0 = runtime inside the declared range, 1 = outside the range
// (or the declared range has drifted from this script).

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DECLARED_NODE_RANGE = '>=24.0.0 <25.0.0';

// The declared range spans exactly one major version, so the gate is
// major-scoped. Its version contract is explicit:
//
//   Supported: 24.x.y, 24.x.y-<prerelease>   (e.g. 24.19.0-nightly.20260101)
//   Rejected:  25.x.y, 25.x.y-<prerelease>, 23.x.y, malformed or missing
//
// This is deliberately NOT npm's semver range resolution. npm excludes ALL
// prereleases from `>=24.0.0 <25.0.0`, which would reject a 24.x nightly
// that this gate intentionally admits; and semver precedence ordering places
// `25.0.0-nightly` before `25.0.0`, which would admit a future-major
// runtime that this gate intentionally rejects. A future-major runtime must
// never produce a passing verification result; a current-major prerelease
// may. Malformed or missing versions fail closed.
const REQUIRED_NODE_MAJOR = 24;

export function parseNodeVersion(version) {
  if (typeof version !== 'string') return null;
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  if (!match) return null;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  if (
    !Number.isSafeInteger(major) ||
    !Number.isSafeInteger(minor) ||
    !Number.isSafeInteger(patch)
  ) {
    return null;
  }
  return { major, minor, patch };
}

export function isSupportedNodeVersion(version) {
  const parsed = parseNodeVersion(version);
  return parsed !== null && parsed.major === REQUIRED_NODE_MAJOR;
}

const invokedAsScript = (() => {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
  } catch {
    return false;
  }
})();

if (invokedAsScript) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  let declared;
  try {
    declared = JSON.parse(
      readFileSync(path.join(here, '..', 'package.json'), 'utf8'),
    )?.engines?.node;
  } catch {
    declared = undefined;
  }
  if (declared !== DECLARED_NODE_RANGE) {
    console.error(
      `NODE_RUNTIME_GATE_FAILED: package.json engines.node drifted from the enforced range ` +
        `(expected "${DECLARED_NODE_RANGE}", found ${declared ? `"${declared}"` : 'no declaration'}). ` +
        'Update scripts/check-node-version.mjs, package.json and the governing ADR together.',
    );
    process.exit(1);
  }
  if (!isSupportedNodeVersion(process.versions.node)) {
    console.error(
      `NODE_RUNTIME_GATE_FAILED: expected Node ${DECLARED_NODE_RANGE}, found ${process.version}`,
    );
    process.exit(1);
  }
  console.log(`NODE_RUNTIME_GATE_PASSED: ${process.version}`);
}
