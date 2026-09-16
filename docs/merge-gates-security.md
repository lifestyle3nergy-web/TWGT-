# Merge Gate Security Scope

The workflow blocks on `npm audit --audit-level=high`, an Anchore SBOM scan with a high severity cutoff, and Gitleaks using its default rules with no repository-wide allowlist.

These checks complement, rather than replace, the repository's existing CodeQL and Dependency Review workflows. Exact merge-tree security claims require those workflows to be verified on `merge_group` events as well.
