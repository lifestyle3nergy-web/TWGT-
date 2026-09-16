# Merge Gate Validation Checklist

Before activation on `main`:

- [ ] `Merge Gates / Continuous Integration` succeeds on the exact PR head.
- [ ] `Merge Gates / Repository Governance` succeeds on the exact PR head.
- [ ] `Merge Gates / SBOM Vulnerability Scan` succeeds on the exact PR head.
- [ ] `Merge Gates / Secret Scan` succeeds on the exact PR head.
- [ ] `Merge Gates / All Gates` succeeds on the exact PR head.
- [ ] Existing CodeQL succeeds on the exact head.
- [ ] Existing Dependency Review succeeds on the exact head.
- [ ] CodeQL and Dependency Review are verified for `merge_group` before merge-queue evidence is required.
- [ ] Exact emitted check-context names are copied into the ruleset; no names are guessed.
- [ ] CODEOWNERS permits an independent reviewer.
- [ ] Independent approval is attached to the exact accepted head.
- [ ] No bypass actors are introduced.

Any failed, cancelled, skipped, missing, stale, or unverified required item remains a blocker.
