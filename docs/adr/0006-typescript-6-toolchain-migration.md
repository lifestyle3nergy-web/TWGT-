# ADR-0006: TypeScript 6 Toolchain Migration

- **Status:** Proposed
- **Date:** 2026-09-15
- **Decision owners:** TWGT maintainers
- **Scope:** Replacement for PR #60

## Context

TWGT currently runs TypeScript 5.6.3 with `typescript-eslint@8.70.0`.
PR #60 proposed an isolated major-version bump to TypeScript 7.0.2, but
TypeScript 7.x falls outside the peer-dependency range
(`>=4.8.4 <6.1.0`) supported by `typescript-eslint@8.70.0`.

That unsupported combination prevents a clean dependency installation and
therefore prevents lint, typecheck, build, and test validation. A compiler
major-version migration must keep the TypeScript and ESLint toolchain aligned.

## Decision

1. Upgrade TypeScript to `^6.0.0`, which remains within the supported range of
   `typescript-eslint@8.70.0`.
2. Keep `typescript-eslint@^8.70.0`.
3. Keep `ts-node@^10.9.2`.
4. Preserve the Node 24 runtime baseline.
5. Remove the deprecated `baseUrl` compiler option and make every `paths`
   target explicitly relative to `tsconfig.json`.
6. Require fresh validation of dependency installation, repository governance,
   formatting, lint, typecheck, build, tests, Dependency Review, and CodeQL.

## Rationale

TypeScript 6 is the newest compiler major supported by the repository's current
`typescript-eslint` release. TypeScript 7 remains deferred until the lint
toolchain explicitly supports it and a separate compatibility review succeeds.

## Consequences

### Positive

- Restores a supported TypeScript and `typescript-eslint` combination.
- Allows the complete build and validation pipeline to run.
- Records the compiler migration rationale for future dependency updates.

### Negative

- Defers TypeScript 7 adoption.
- May require source or configuration changes if TypeScript 6 exposes breaking
  compiler behavior during validation.

### Operational

Although the package change is dependency-only under ADR-0002, this ADR records
the explicit compiler-major decision. It does not change workflows or runtime
activation policy.

## Validation

- `npm ci`
- `npm run validate:repo`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`
- Dependency Review
- CodeQL
- Independent approval of the exact validated commit

## Rollback

Revert the TypeScript dependency and regenerated lockfile to the current
main-branch baseline (`typescript@^5.6.3`) if migration regressions cannot be
resolved within this isolated change.
