# ADR-0004: Align setup-node v7 with the Node 24 Release Baseline

- **Status:** Accepted
- **Date:** 2026-09-14
- **Decision owners:** TWGT maintainers
- **Scope:** PR #69

## Context

TWGT uses Node 24.19.0 as its governed runtime baseline. The active continuous-integration and release workflows both use `actions/setup-node` to provision that exact runtime and restore the npm cache.

Version 7 of `actions/setup-node` updates the action runtime and dependencies without changing TWGT's selected Node version. Because workflow files are protected structural surfaces, the action update must be recorded and validated as an architecture decision.

## Decision

1. Update `actions/setup-node` from v6 to v7 in the active continuous-integration and release workflows.
2. Preserve the pinned Node `24.19.0` runtime and the package engine range `>=24.0.0 <25.0.0`.
3. Do not add, restore, remove, or rename workflows as part of this update.
4. Preserve existing triggers, permissions, npm cache configuration, `npm ci`, lint, typecheck, tests, build, compiled-entrypoint checks, and release behavior.
5. Require fresh current-head repository governance, Continuous Integration, Dependency Review, CodeQL, and Predictive Risk Validation before merge.

## Security and permissions

The change does not expand workflow permissions, introduce secrets, or add deployment behavior. The release workflow retains `contents: write` only for its existing responsibility of creating a GitHub Release from an authorized tag or manual dispatch.

## Rollback

Revert both setup action references to v6 while retaining Node 24.19.0 and all existing workflow triggers, permissions, and validation steps.

## Acceptance criteria

- Repository governance passes.
- Active workflow YAML and diff formatting are valid.
- `npm ci`, lint, typecheck, tests, build, and compiled-entrypoint checks pass on Node 24.19.0.
- Dependency Review, CodeQL, and Predictive Risk Validation pass on the final PR head.
- No workflow-permission, trigger, deployment, or release-behavior expansion is present.
