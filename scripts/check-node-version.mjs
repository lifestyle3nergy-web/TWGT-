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

// The declared range spans exactly one major version: for release builds
// `major === 24` is precisely the intersection of `>=24.0.0` and `<25.0.0`.
// Pre-releases of the next major (e.g. `25.0.0-nightly`) are rejected
// deliberately: strict semver would admit them into `<25.0.0`, but a
// future-major runtime must never be able to produce a passing verification
// result. Malformed or missing versions fail closed.
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
