# ADR-0004: Align setup-node v7 with the Node 24 Release Baseline

- **Status:** Proposed
- **Date:** 2026-09-10
- **Decision owners:** TWGT maintainers
- **Scope:** PR #19

## Context

The original automated pull request updated both an obsolete Node matrix workflow and the release workflow. Since that branch was created, the repository removed the legacy `.github/workflows/node.js.yml` workflow and established Node 24 as the supported runtime in `package.json` and the active release pipeline.

Reintroducing the deleted workflow or restoring its historical Node matrix would conflict with the current runtime contract.

## Decision

1. Update `actions/setup-node` from v4 to v7 only in the active release workflow.
2. Preserve the pinned Node `24.19.0` release runtime and the package engine range `>=24.0.0 <25.0.0`.
3. Do not restore `.github/workflows/node.js.yml`.
4. Preserve `npm ci`, lint, build, test, and release behavior.
5. Treat the action update as CI/runtime compatibility work requiring fresh CI, Dependency Review, CodeQL, and workflow validation.

## Security and permissions

The change does not expand workflow permissions, introduce secrets, or add deployment behavior. The release workflow retains `contents: write` only because its existing responsibility is creating a GitHub Release from an authorized tag or manual dispatch.

## Rollback

Revert the setup action reference to v4 while retaining Node 24.19.0. Do not restore the removed legacy workflow.

## Acceptance criteria

- Repository governance passes.
- Active workflow YAML is valid.
- `npm ci`, lint, typecheck, tests, build, and compiled-entrypoint checks pass on Node 24.
- Dependency Review and CodeQL pass.
- No workflow-permission or release-trigger expansion is present.
