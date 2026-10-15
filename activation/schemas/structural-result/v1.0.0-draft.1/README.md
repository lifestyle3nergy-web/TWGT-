# Structural result schema — v1.0.0-draft.1

This schema validates structural checks only. It is not an admission record and cannot authorize execution, staging, release, or deployment.

The field authorizing is required and must be the literal boolean false. Consumers must reject a missing field, true, a non-boolean value, or this artifact class presented as an admission record.

CLI contract: structural-only validation returns exit code 10 and reason code STRUCTURE_VALID_ONLY. Full verification may return exit code 0 only after every mandatory verification gate passes. Structural-only output must never be interpreted as exit-0 authorization.

Consumer: verify-bootstrap-evidence.mjs in structural mode. Exit 10 is an intentional non-authorizing result, not a shell success. Wrappers must explicitly branch on it and must not collapse it to a successful authorization path.
