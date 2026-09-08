# ADR-0002: Fail-Closed Bootstrap Verification Boundary

- **Status:** Proposed
- **Date:** 2026-09-08
- **Decision owners:** TWGT maintainers

## Context

The supplied TWGT governance bootstrap package defines bootstrap evidence, artifact digests, a verifier key, rollback metadata, and a signature field. Its templates intentionally leave team-issued trust material and the signature scheme undefined.

The repository needs a verifier that enforces the available integrity contract without inventing the missing authentication contract.

## Decision

1. Bootstrap verification is a governance boundary and remains isolated below `activation/`.
2. Evidence commit and rollback pins must be real 40-character hexadecimal Git SHAs; placeholders are rejected.
3. Evidence digest values must be 64-character hexadecimal SHA-256 values and are verified against the exact bytes of repository-relative artifacts.
4. Digest paths must remain inside the repository root and referenced artifacts must exist.
5. The verifier public key must parse as a public key and placeholder key material is rejected.
6. Signature verification is pluggable but fail-closed. No signature algorithm, signature encoding, or canonical signed payload is inferred by the repository.
7. Until maintainers define and register the authoritative signature contract, verification fails rather than accepting an unsupported scheme.
8. Bootstrap evidence, signing keys, rollback pins, and repository inventory are external authoritative inputs; the repository does not generate or fabricate them.

## Non-goals

This ADR does not select Ed25519, ECDSA, RSA, or any other signature scheme. It does not establish a repository inventory, nucleus commit, rollback pin, or signing authority.

## Validation

The verifier must reject missing, malformed, placeholder, or unverifiable evidence. Tests exercise negative cases for trust material and digest failures. A positive cryptographic test may only be added after the authoritative signature contract exists; test-only trust material must remain ephemeral.

## Consequences

The bootstrap package can enforce artifact integrity now while preserving the missing authentication decision as a hard blocker. This prevents false-positive activation and makes the eventual signature implementation an explicit, reviewable governance change.
