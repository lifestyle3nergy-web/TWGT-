# ADR-0002: Dependency Governance Boundary

## Status

Proposed

## Context

The repository contract previously treated every `package.json` change as a structural architecture change. This caused dependency-only pull requests, including automated Dependabot updates, to fail the ADR gate before normal CI could execute.

That behavior conflated two different concerns:

- dependency graph maintenance, which belongs to dependency/security/runtime validation; and
- package-level structural changes, which can alter repository architecture, execution, build, release, or governance behavior.

The result was a false-positive governance boundary that blocked dependency PRs without adding useful architectural evidence.

## Decision

`package.json` is no longer an unconditional structural trigger.

The repository validator compares the base and candidate `package.json` documents and classifies changed top-level fields.

Dependency-only changes are fields limited to:

- `dependencies`
- `devDependencies`
- `optionalDependencies`
- `peerDependencies`
- `peerDependenciesMeta`
- `bundledDependencies`
- `bundleDependencies`

Changes limited to those fields do not require an ADR. They continue through normal CI, Dependency Review, CodeQL, tests, build validation, and human review as applicable.

Any changed `package.json` field outside that allowlist remains structural and requires a numbered ADR. Examples include scripts, package type, exports, engines, workspaces, entrypoints, package manager configuration, and other execution/build metadata.

If the validator cannot reliably compare the base and candidate `package.json`, it fails closed rather than silently classifying the change as dependency-only.

## Consequences

Dependabot and manually authored dependency-only PRs can reach the validation pipeline without manufacturing architecture documentation.

Structural package changes remain protected by the ADR gate.

This ADR does not make dependency upgrades automatically mergeable. Major production dependency changes still require appropriate compatibility evidence and human review under the repository's existing release and security controls.

## Scope

This decision changes only repository-governance classification. It does not change runtime architecture, dependencies, deployment permissions, merge settings, or production mutation authority.
