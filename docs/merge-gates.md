# Fail-Closed Merge Gates

The `Merge Gates` workflow validates pull-request heads and merge-queue merge groups targeting `main`.

## Required local-equivalent gates

The workflow executes these acceptance checks without `continue-on-error`:

1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. `npm test`
5. `npm run format:check`
6. `npm audit --audit-level=high`
7. `node scripts/validate-repository-contract.mjs`
8. `git diff --check`
9. SBOM vulnerability scan at high severity or above
10. Gitleaks secret scan

`All Gates` succeeds only when every required dependency reports `success`. Failed, cancelled, skipped, or otherwise non-successful dependencies block the roll-up.

## Merge queue

The workflow listens to `merge_group: checks_requested` so the same repository gates can execute against GitHub's temporary merge-group tree. Separate required workflows, including CodeQL and Dependency Review, must also support the merge queue before their results can be treated as exact merge-tree evidence.

## Ruleset activation

Do not configure required status-check contexts from documentation or assumed names. First observe the exact check contexts emitted by GitHub for this workflow and the existing security workflows. Then configure the `main` ruleset with those exact contexts, no bypass actors, stale-review dismissal, last-push approval, Code Owner review where CODEOWNERS permits independent review, linear history, deletion/non-fast-forward protection, merge queue, and the repository's required CodeQL code-scanning rule.

Ruleset activation is a separate administration change and should occur only after this workflow has produced successful evidence on its exact head SHA.
