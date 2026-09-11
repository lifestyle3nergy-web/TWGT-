# ADR-0004: Deterministic Node 24 Runtime Gate

- **Status:** Proposed
- **Date:** 2026-09-11
- **Decision owners:** TWGT maintainers

## Context

TWGT declares a single-major Node runtime contract in `package.json`:

```text
"engines": { "node": ">=24.0.0 <25.0.0" }
```

`.nvmrc` pins `24.19.0`, and every workflow that sets up Node (Continuous
Integration, Release, Predictive Risk Validation) pins `node-version: 24.19.0`.

npm does not enforce `engines` by default: under an out-of-range runtime it
prints an `EBADENGINE` warning and proceeds. A warning is not verification.
During PR #56 verification, the full gate was observed to pass under Node 26,
a runtime outside the declared contract. Passing under an unsupported runtime
must never be mistakable for a verified result.

## Decision

Enforce the declared range deterministically in the repository itself:

1. Add `scripts/check-node-version.mjs` as the authoritative runtime gate.
   It exits `0` only when the running Node major version is `24` (exactly the
   intersection of `>=24.0.0` and `<25.0.0` for release builds), exits `1`
   otherwise, and fails closed on malformed versions. Pre-releases of the next
   major (for example `25.0.0-nightly`) are rejected deliberately: strict
   semver would admit them into `<25.0.0`, but a future-major runtime must not
   be able to produce a passing verification result.
2. Expose it as `npm run check:node`.
3. Gate the verification lifecycle through npm `pre*` hooks: `prelint`,
   `pretypecheck`, `pretest`, and `prebuild` each run `check:node` first, so
   `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` refuse
   to proceed under an unsupported runtime.
4. Run `npm run check:node` explicitly in the Continuous Integration workflow
   after Node setup, before installing dependencies. CI continues to select
   Node `24.19.0` explicitly (never `lts/*`, `node`, or an unpinned major).
5. Add `tests/tooling/node-gate.test.mjs`, a pure-function regression test of
   the version predicate (accepts `24.0.0`…`24.99.99`; rejects `23.11.0`,
   `25.0.0`, `26.4.0`, and malformed input) that does not require installing
   multiple Node runtimes.
6. The gate cross-checks that `package.json` `engines.node` still equals the
   enforced range and fails closed if the two drift apart, forcing any range
   change to update the script, the package manifest, and this ADR together.

## Consequences

- An unsupported Node runtime cannot accidentally produce a successful TWGT
  verification result: every lifecycle command refuses before executing.
- `npm ci` itself cannot be gated through package.json lifecycle hooks; the
  boundary for installation is the explicit CI pin plus `check:node` running
  before subsequent commands.
- Verification claims must state the runtime they ran under; results produced
  under Node 25+ are by definition unverified for TWGT.
- The gate adds one lightweight Node-only script; no new dependency is
  introduced (semver is not a direct dependency, and the fixed single-major
  range does not need one).

## Alternatives considered

- Rely on npm `engines` alone: rejected, because npm only warns (`EBADENGINE`)
  and verification under an unsupported runtime remains possible.
- Set `engine-strict=true` in `.npmrc`: rejected as the sole mechanism because
  it only affects installation-time behaviour in npm, not arbitrary script
  execution, and it hides the enforcement outside the reviewed repository
  scripts.
- Add the `semver` package for range evaluation: rejected because the declared
  range is a single major and a dependency would widen the supply-chain surface
  for no semantic gain.

## Validation

- `npm run check:node` prints `NODE_RUNTIME_GATE_PASSED: v24.x.x` and exits `0`
  under Node 24; prints `NODE_RUNTIME_GATE_FAILED: expected Node >=24.0.0 <25.0.0, found v26.x.x`
  and exits `1` under Node 25+/23-.
- `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` each
  abort at their `pre*` gate under an unsupported runtime.
- `node --test tests/tooling/node-gate.test.mjs` covers the accepted/rejected
  version table as a pure predicate.
- CI executes `npm run check:node` on Node `24.19.0`.

## Reversal / migration

To change the supported runtime, update `package.json` `engines.node`,
`scripts/check-node-version.mjs` (`DECLARED_NODE_RANGE` and
`REQUIRED_NODE_MAJOR`), `.nvmrc`, the workflow `node-version` pins, the
regression test's accepted/rejected table, and supersede this ADR with a new
numbered ADR — the gate's drift check forces the script and the manifest to
travel together.
