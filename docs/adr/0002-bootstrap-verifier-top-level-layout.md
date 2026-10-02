# ADR-0001 · Bootstrap verifier top-level layout

**Status:** Proposed
**Date:** 2026-10-03
**Related:** PR "chore: restore bootstrap verifier for review"

## Context

The repository contract (`scripts/validate-repository-contract.mjs` on
main) rejects any top-level entry not on an approved list. The
bootstrap verifier adds six:


It also places `activation/lib/bootstrap-verifier.mjs`, which the
contract classifies as an activation-boundary violation.

## Decision

Approve the six top-level entries and the `activation/` boundary as
part of the bootstrap verifier.

Rationale:

1. Each top-level entry is load-bearing for the verifier:
   - `bootstrap.sh` — orchestrator entry point
   - `catalog/repositories.yaml` — verifier's repository list
   - `keys/bootstrap-verifier.pub` — public key (no private material)
   - `rollback_pin.txt` — pinned commit for rollback
   - `schema.sql` — persistence schema
   - `writebook.sh` — evidence writer
2. `activation/lib/bootstrap-verifier.mjs` implements the verifier
   itself. Its location under `activation/` is deliberate: the
   activation boundary is the verifier's scope.
3. The alternative — moving these into existing directories — would
   obscure the verifier's boundary in the same way the previous
   revert obscured the reason it was reverted.

## Consequences

- `scripts/validate-repository-contract.mjs` must be updated to
  accept these entries. That update is a separate PR, in the same
  class as this one: it must go through review, not be applied
  silently.
- Future additions to the approved list follow the same pattern:
  one ADR per structural change.
- Reverting this ADR means reverting the verifier again.

## Not decided

- Whether the verifier runs on every PR or only on release tags.
- Whether the public key rotates on a schedule.
