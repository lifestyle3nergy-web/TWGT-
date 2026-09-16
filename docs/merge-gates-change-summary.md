# Merge Gate Hardening Change

This proposal adds fail-closed PR and merge-group validation without changing repository administration settings.

The implementation adds high-severity npm audit enforcement, repository-contract and whitespace checks, SBOM vulnerability scanning, Gitleaks secret scanning, and a roll-up that accepts only explicit `success` results. It intentionally does not claim SBOM delta or license-delta enforcement until those capabilities are implemented.
