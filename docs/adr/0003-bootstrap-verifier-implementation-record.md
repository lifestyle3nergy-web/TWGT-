# TWGT Bootstrap Verifier — Implementation Record

**Status:** Implemented — review/validation pending merge
**Date:** 2026-09-08
**PR:** #68 — `governance: implement fail-closed bootstrap verifier`
**Branch:** `governance/bootstrap-verifier`
**Implementation commit:** `30d447144de622068ef8b2ff3b5fdf6bf9503476`
**Base commit:** `886f1ac7d047bb2653ed337c3f591058a16fda51`

## 1. Purpose

This record maps the normative bootstrap-verifier engineering guide to the concrete TWGT implementation delivered in PR #68.

The implementation establishes a fail-closed verification boundary for bootstrap evidence without inventing missing trust contracts or production trust material.

The implementation is a governance-layer change only. No runtime code or activation application surface is changed.

## 2. Implemented Verification Boundary

The verifier is implemented under `activation/` and performs the following checks in fail-closed order:

1. Load bootstrap evidence and the verifier public key from the configured/default activation paths.
2. Validate the bootstrap evidence against the repository schema.
3. Reject undeclared fields and missing required fields.
4. Require real 40-character hexadecimal nucleus and rollback commit identifiers and reject placeholder values.
5. Validate repository identity against the configured/default TWGT repository identity.
6. Require a non-empty digest map.
7. Require each digest to be a 64-character SHA-256 hexadecimal value and reject placeholders.
8. Resolve each referenced artifact without allowing paths to escape the repository root.
9. Hash the exact raw bytes of each referenced artifact and compare them with the supplied SHA-256 digest.
10. Require a verifier key, reject placeholder key material, and parse the key using the Node cryptographic key parser.
11. Require a signature object containing an algorithm and value and reject placeholder values.
12. Resolve the algorithm through an explicit signature-adapter registry.
13. Fail closed when no authoritative signature adapter is registered.

No step treats structural validity as proof of cryptographic authority.

## 3. Concrete Artifacts

### Schema

`activation/schemas/bootstrap.schema.json`

The schema uses JSON Schema draft 2020-12 and defines a closed bootstrap evidence contract containing:

- `schemaVersion`
- `commit`
- `rollbackPin`
- `repository`
- `nucleusId`
- `nucleusTag`
- `nucleusVersion`
- `digests`
- `signature`

Commit and rollback values require 40 hexadecimal characters. Digest values require 64 hexadecimal characters. Undeclared properties are rejected.

### Verifier

`activation/scripts/verify-bootstrap-evidence.mjs`

The verifier uses Node built-in cryptographic and filesystem primitives only. Repository-relative artifact bytes are hashed directly; no text normalization or reconstructed representation is used for digest verification.

### Shell entrypoint

`activation/scripts/verify-bootstrap-evidence.sh`

The shell wrapper delegates directly to the Node verifier and preserves its exit status.

### Evidence boundary documentation

`activation/evidence/README.md`

Documents that bootstrap evidence, repository inventory, nucleus/rollback issuance, signing keys, signatures, and related trust material are authoritative external inputs and must not be fabricated or committed merely to satisfy validation.

### Tests

`tests/tooling/bootstrap-verifier.test.mjs`

Negative tests cover placeholder commit, placeholder rollback, empty digest sets, invalid digests, placeholder keys, digest mismatch, and an undefined signature algorithm. Test-only cryptographic material is ephemeral and is not committed.

## 4. Signature Contract Decision

The authoritative signature algorithm and canonical signed-payload contract were not present in the supplied bootstrap package.

Accordingly, the implementation deliberately contains no default Ed25519, RSA, ECDSA, or other algorithm adapter. The signature adapter registry is empty until the authoritative team-defined contract is supplied and explicitly implemented.

An evidence record with an otherwise valid structure therefore remains blocked with an unsupported/unregistered signature algorithm.

This is intentional fail-closed behavior, not an incomplete workaround.

A positive cryptographic verification test must be added only after the authoritative algorithm, key representation, signed payload/canonicalization rules, and signature encoding are formally defined.

## 5. Trust-Material Boundary

The repository does not manufacture any of the following:

- authoritative repository inventory;
- nucleus commit;
- rollback pin;
- production verifier public key;
- production signature;
- authoritative signature algorithm;
- canonical signed payload;
- production bootstrap evidence digests.

The bootstrap archive explicitly identified several of these values as team-issued or externally supplied. The implementation preserves that boundary.

## 6. Validation Record

PR #68 is open against `main` and has not been merged.

At implementation commit `30d447144de622068ef8b2ff3b5fdf6bf9503476`, the following GitHub Actions workflow runs completed successfully:

| Workflow | Run | Result |
|---|---:|---|
| CodeQL | #265 | success |
| Dependency Review | #132 | success |
| Continuous Integration | #257 | success |

These results establish CI success for the recorded implementation commit. They do not constitute authorization to activate bootstrap trust material.

## 7. Explicit Remaining Blockers

Bootstrap activation remains blocked until the authoritative governance inputs are supplied and governed:

1. authoritative repository inventory;
2. authoritative nucleus commit;
3. authoritative rollback pin;
4. authoritative artifact set and digest contract;
5. team-issued bootstrap verifier public key;
6. authoritative signature algorithm;
7. canonical signed-payload definition;
8. team-issued signed bootstrap evidence.

The verifier must remain fail-closed while any required trust contract is undefined.

## 8. Non-Goals

This implementation does not:

- infer repository inventory from the bootstrap template;
- select a cryptographic signature algorithm;
- establish a signing authority;
- prove that a supplied commit exists in Git history or on a remote without an explicit authority/source contract;
- infer that a nucleus tag identifies a particular commit;
- generate production keys, signatures, rollback pins, or digests;
- bypass governance validation;
- modify the frozen application runtime.

## 9. Merge Decision Boundary

PR #68 may be reviewed as a governance implementation. It must not be interpreted as evidence that bootstrap activation is currently authorized.

The implementation is complete for the currently defined integrity boundary. Activation remains a separate governance decision contingent on the unresolved authoritative trust contracts above.

No merge or activation action is implied by this record.
