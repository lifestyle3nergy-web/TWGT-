# ADR-0007: Fail-Closed Merge Gates

- **Status:** Proposed
- **Date:** 2026-09-16
- **Scope:** `main` admission and merge queue

## Context

PR-head checks alone do not prove that the exact tree produced after concurrent changes enter `main` remains valid. Required checks also need machine-enforced failure semantics rather than prose-only merge instructions.

## Decision

Introduce `.github/workflows/merge-gates.yml` for both `pull_request` and `merge_group` events. The workflow runs the repository's install, lint, build, test, formatting, high-severity npm audit, repository-contract and diff checks, plus SBOM vulnerability and secret scanning. A final roll-up succeeds only if every required dependency reports `success`.

Ruleset activation is deliberately separate. Required context names must be observed from real workflow runs before an active `main` ruleset references them. Existing CodeQL and Dependency Review workflows must provide appropriate merge-queue coverage before they are treated as exact merge-tree evidence.

## Consequences

- Any failed, cancelled, skipped, or otherwise non-successful required merge gate blocks the roll-up.
- Merge-queue trees receive the same core validation as PR heads.
- No repository administration setting is weakened or bypassed by this change.
- Ruleset activation requires separate verified administration work after successful workflow evidence exists.
