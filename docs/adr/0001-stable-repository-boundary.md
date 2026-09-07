# ADR-0001: Stable Repository Boundary

- **Status:** Accepted
- **Date:** 2026-09-07
- **Decision owners:** TWGT maintainers

## Context

TWGT currently contains a working Node.js/TypeScript foundation, CLI material, dashboard material, documentation, CI, security automation, and repository tooling. The repository therefore cannot safely be converted into a runtime-free meta-repository by deletion without an explicit migration plan.

The stability objective is to prevent uncontrolled expansion while preserving the verified baseline. Structural changes need an auditable decision trail, and existing runtime material must not silently expand into additional application surfaces.

## Decision

1. Treat the current repository tree as the **frozen baseline boundary**.
2. Require an ADR for any new top-level directory, runtime language, runtime surface, or architectural boundary.
3. Existing Node.js/TypeScript runtime material is grandfathered as part of the current baseline until a separate migration ADR removes or relocates it.
4. No new runtime language, package manager, build system, or top-level application surface may be introduced without an ADR.
5. Governance, architecture, and repository-contract documents belong under `docs/`.
6. Activation-kit material belongs under `activation/` and must not become an implicit runtime surface.
7. CI must validate the repository contract and fail closed when a protected boundary is violated.

## Consequences

### Positive

- Prevents accidental architectural drift.
- Preserves the known-good runtime baseline while governance is strengthened.
- Makes structural decisions reviewable and reversible.
- Gives CI an explicit policy to enforce.

### Negative

- Some changes that would previously have been trivial now require an ADR.
- The repository retains its existing runtime surface until a deliberate migration is approved.

### Operational

A future migration to a pure meta-repository is a separate change and must preserve traceability, tests, and cross-repository integration contracts.

## Alternatives considered

### Delete the existing runtime immediately

Rejected because it would turn a governance change into an application migration and could destroy the currently verified baseline.

### Continue with convention-only governance

Rejected because conventions without automated checks are vulnerable to drift.

### Freeze everything permanently

Rejected because TWGT requires controlled evolution; the objective is governed change, not immobility.

## Validation

- Repository contract validation passes.
- JSON/YAML validation passes.
- ADR compliance validation passes for structural changes.
- Existing CI, tests, lint/typecheck, and build checks remain green.

## Reversal / migration

Any change to this boundary must introduce a new ADR describing the migration, compatibility period, evidence requirements, and rollback path.
