# Summary

Repository Governance previously depended on a three-dot merge-base diff that failed in a PR Actions checkout. This candidate replaces that dependency with an explicit two-endpoint baseline selected from the synthetic merge first parent or the fetched base branch, adds regression coverage, and preserves fail-closed governance behavior.
