# PR diff baseline repair validation

This repair addresses the Repository Governance failure where `git diff origin/main...HEAD` could not determine a merge base in a GitHub pull-request checkout.

The validator now fetches the complete named base ref and, for a synthetic merge checkout, uses the first parent of `HEAD` as the two-endpoint diff baseline. If the checkout is not a merge commit it falls back to the explicitly fetched base ref. Errors remain fail-closed.

A regression test constructs a synthetic merge fixture and verifies that repository-contract validation completes without relying on a three-dot merge-base calculation.

## Required exact-head gates

- `npm ci`
- `npm run lint`
- `npm run build`
- `npm test`
- `npm run format:check`
- `node scripts/validate-repository-contract.mjs`
- `git diff --check`
- Repository Governance
- Continuous Integration
- Dependency Review
- CodeQL
- Independent human approval

Do not merge this repair until all required gates are green on the exact PR head.
