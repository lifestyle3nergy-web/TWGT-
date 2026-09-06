# Change Control

TWGT uses a small-change, verify-first workflow.

## Required sequence

1. Inspect the current repository boundary.
2. Classify the proposed change.
3. Add or update an ADR when a protected boundary changes.
4. Make the smallest viable change.
5. Run repository and application validation.
6. Review the resulting diff for unintended scope.
7. Merge only when required checks are green.

## Protected changes

The following require an ADR:

- new top-level directories;
- runtime language changes;
- runtime/build/package-boundary changes;
- capability ownership changes;
- activation-boundary changes;
- repository-contract changes.

## Separation principle

Governance changes should remain separate from application changes wherever practical. This prevents governance failures from being hidden inside unrelated code changes.
