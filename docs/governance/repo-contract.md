# Repository Contract Governance

The canonical repository contract is [`REPO-CONTRACT.md`](../../REPO-CONTRACT.md).

This document explains how the contract is maintained and enforced.

## Rules

1. The contract is versioned with the repository.
2. Changes to the contract require an ADR because they change the governance boundary.
3. CI validates protected paths and file classes.
4. Existing runtime material is frozen rather than silently expanded.
5. Cross-repository capability ownership is recorded in `docs/ecosystem-map.md`.

## Evidence

Governance checks run as part of pull-request CI. A failing check is evidence of a contract violation, not merely a test failure.
