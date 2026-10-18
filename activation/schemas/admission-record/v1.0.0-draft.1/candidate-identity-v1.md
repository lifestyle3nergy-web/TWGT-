# Candidate identity specification v1

Status: frozen draft contract. Specification identifier: twgt-candidate-identity-v1.

The identity digest is SHA-256 over the RFC 8785 JSON Canonicalization Scheme serialization of exactly the tuple below. The digest representation is the lowercase hexadecimal SHA-256 prefixed with sha256:.

The tuple contains exactly these fields:

- spec: literal twgt-candidate-identity-v1
- repository: GitHub owner/name
- pull_request: positive integer PR number
- base_sha: lowercase 40-hex Git commit SHA
- head_sha: lowercase 40-hex candidate commit SHA
- lockfile_digest: sha256-prefixed 64-hex digest
- artifact_digest: sha256-prefixed 64-hex digest
- deploy_config_digest: sha256-prefixed 64-hex digest
- contract_version: non-empty contract version string
- contract_digest: sha256-prefixed 64-hex digest

Normative computation: identity_digest = SHA256(RFC8785(JCS(tuple))). The tuple has no optional fields. Implementations must reject missing, extra, or incorrectly typed fields before canonicalization. RFC 8785 canonicalization is the byte serialization; do not add a second serialization or normalization layer.

Any field addition, removal, semantic change, or canonicalization change requires a new specification identifier and a new version (v2). Do not silently extend v1. The identity digest binds authorization to the exact candidate, lockfile, artifact, deployment configuration, and contract version/digest. A change to any bound value invalidates the previous authorization.

No digest is considered admission evidence until the implementation is independently tested against fixed canonicalization and digest vectors.
