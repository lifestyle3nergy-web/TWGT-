# ADR-0007: Pull-request governance diff baseline

- **Status:** Proposed
- **Date:** 2026-09-15
- **Scope:** Repository contract validation in pull-request workflows

## Context

Repository Governance previously calculated pull-request changes with a three-dot diff against `origin/${GITHUB_BASE_REF}`. A GitHub Actions pull-request run failed before the Node validation pipeline because the checked-out synthetic merge commit and fetched base ref did not expose a usable merge base.

The validator must fail closed when it cannot establish a trustworthy baseline, while remaining compatible with GitHub's synthetic pull-request merge checkout.

## Decision

For pull-request validation:

1. Fetch the complete named base branch into `refs/remotes/origin/<base>`.
2. Inspect the parents of the checked-out `HEAD`.
3. When `HEAD` is a merge commit, use its first parent as the diff baseline.
4. Otherwise use the explicitly fetched `origin/<base>` ref.
5. Use a two-endpoint diff (`baseline HEAD`) rather than a three-dot merge-base diff.
6. Preserve fail-closed behavior when the base cannot be fetched, inspected, or diffed.

## Consequences

This removes dependence on an independently discoverable merge base for GitHub's synthetic PR merge checkout without weakening structural-change or ADR enforcement. Non-PR invocation behavior is unchanged.

## Validation

Before merge, require fresh execution of:

- `npm ci`
- `npm run lint`
- `npm run build`
- `npm test`
- `npm run format:check`
- `node scripts/validate-repository-contract.mjs`
- `git diff --check`

Also require fresh Repository Governance, Continuous Integration, Dependency Review, CodeQL, and independent human approval on the exact repair head.
