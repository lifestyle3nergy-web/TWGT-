# Admission Contract Invariants

Schema version: `1.0.0-draft.1`  
Status: draft, non-normative until the `draft` suffix is removed.  
Companion documents: `admission-record.schema.json`, `candidate-identity-v1.md`.

## 0. Purpose and scope

This document defines the invariants that the admission validator MUST enforce. JSON Schema expresses the shape of an admission record; it cannot express cross-field constraints, temporal rules, identity binding, or state derivation. Those rules live here.

Scope: the admission validator (policy layer), the negative-test suite, and any consumer that reads a decision field from an admission record.

Out of scope: bootstrap-envelope cryptographic verification, structural-result shape, and repository-contract governance. The admission contract does not override the repository contract.

## 1. Normative language

`MUST`, `MUST NOT`, `SHOULD`, and `MAY` are used as defined in RFC 2119. Every invariant MUST have at least one negative test asserting both exit code and reason code. A reason code without a test is prose; a test without a reason code is unimplementable.

## 2. Artifact separation (INV-001 … INV-004)

**INV-001.** A structural result is a distinct artifact class from an admission record. The validator MUST refuse a structural result passed as an admission record with `EVIDENCE_INVALID` (exit 21). It MUST NOT silently reinterpret the artifact.

**INV-002.** A structural result MUST carry `authorizing: false`. A consumer MUST reject a structural result whose `authorizing` field is absent or not `false`.

**INV-003.** `STRUCTURE_VALID_ONLY` (exit 10) MUST NOT share an exit code with `FULL_VERIFICATION_PASS` (exit 0). Downstream automation branching on exit 0 MUST NOT treat structural success as verification success.

**INV-004.** A bootstrap envelope MUST NOT contain staging, production, reviewer, or decision fields. An admission record MUST NOT contain cryptographic signature fields beyond references to the policy artifact and its digests.

## 3. Identity (INV-010 … INV-013)

**INV-010.** The candidate identity digest MUST be computed over exactly the field set defined in `candidate-identity-v1.md`, in the specified order, using RFC 8785 JCS canonicalization and SHA-256. Any other serialization MUST produce `CANDIDATE_IDENTITY_MISMATCH` (exit 27).

**INV-011.** If any identity-tuple field changes, including `head_sha`, `base_sha`, lockfile digest, artifact digest, deploy-config digest, contract version, or contract digest, the record MUST be treated as a new candidate identity. Prior candidate-bound authorization MUST NOT carry forward.

**INV-012.** Every evidence record's `candidate_head_sha` MUST equal `candidate.head_sha`. A mismatch MUST produce `CANDIDATE_IDENTITY_MISMATCH` (exit 27).

**INV-013.** Every evidence record's `policy_digest` MUST equal `policy.artifact_digest`. A mismatch MUST produce `POLICY_VERSION_CHANGED` (exit 28) or `CANDIDATE_IDENTITY_MISMATCH` (exit 27). Evidence from a prior policy MUST NOT be grandfathered.

## 4. Evidence (INV-020 … INV-024)

**INV-020.** If any mandatory gate's evidence is missing, the validator MUST return `REQUIRED_EVIDENCE_UNAVAILABLE` (exit 33). The mandatory gate set MUST be defined by signed policy, not by the evidence producer or an unsigned local configuration file.

**INV-021.** If any mandatory gate's evidence has a result other than `PASS`, the validator MUST return `REQUIRED_EVIDENCE_UNAVAILABLE` (exit 33). `SKIPPED`, `UNAVAILABLE`, `FAIL`, and `EXPIRED` MUST NOT be treated as `PASS`.

**INV-022.** Evidence whose `expires_at` is less than or equal to evaluation time MUST be treated as expired. The boundary is inclusive; expiry MUST produce `EVIDENCE_EXPIRED` (exit 22).

**INV-023.** `evidence` MUST contain at least one entry. An empty array MUST produce `REQUIRED_EVIDENCE_UNAVAILABLE` (exit 33), not a schema error.

**INV-024.** A gate whose evidence source is unreachable MUST be `UNAVAILABLE`, not `PASS`. The validator MUST NOT retry indefinitely or substitute a cached value.

## 5. Review independence (INV-030 … INV-032)

**INV-030.** When `review.review_state` is `RECORDED`, `review.approver_id` MUST be a non-empty string and MUST differ from both `review.author_id` and `review.last_committer_id`. A violation MUST produce `REVIEW_INDEPENDENCE_FAILED` (exit 29).

**INV-031.** When `review.review_state` is `PENDING`, `review.approver_id` and `review.rationale` MAY be null. A pending review MUST NOT be treated as authorization.

**INV-032.** `ELIGIBLE_FOR_HUMAN_ADMISSION` or any subsequent state MUST NOT be derivable while `review.review_state` is `PENDING`.

## 6. Authorization lifecycle (INV-040 … INV-044)

**INV-040.** An authorization MUST have `expires_at` strictly greater than `issued_at`. A violation MUST produce `EVIDENCE_INVALID` (exit 21).

**INV-041.** At or after `authorization.expires_at`, authorization MUST be treated as expired. `RELEASE_ADMITTED` with expired authorization MUST produce `AUTHORIZATION_EXPIRED` (exit 30).

**INV-042.** `RELEASE_ADMITTED` MUST require `authorization.stage == "production"`. A staging authorization MUST NOT authorize production release; a violation MUST produce `INVALID_TRANSITION` (exit 34).

**INV-043.** `RELEASE_ADMITTED` MUST require `authorization.authorization_state == "ACTIVE"`. `EXPIRED` or `REVOKED` MUST produce `AUTHORIZATION_EXPIRED` (exit 30).

**INV-044.** Authorization MUST NOT transfer across candidate identities, policy digests, or deploy-config digests. A mismatch MUST produce `CANDIDATE_IDENTITY_MISMATCH` (exit 27).

## 7. Environment (INV-050 … INV-052)

**INV-050.** `ADMITTED_TO_STAGING` MUST require `environment.state == "HEALTHY"`. A quarantined environment MUST produce `ENVIRONMENT_QUARANTINED` (exit 31).

**INV-051.** A candidate already in staging when its environment transitions to `QUARANTINED` MUST move to `HOLD`, not `REJECTED`.

**INV-052.** Candidate state and environment state are independent dimensions. A validator MUST NOT infer one from the other.

## 8. Decision derivation (INV-060 … INV-064)

**INV-060.** `decision.state` is derived, not producer-asserted. If the declared state disagrees with the validator-derived state, return `INVALID_TRANSITION` (exit 34) and do not accept the declared value.

**INV-061.** `HOLD` MUST carry at least one non-empty reason code. An empty array MUST produce `REQUIRED_EVIDENCE_UNAVAILABLE` (exit 33).

**INV-062.** `REJECTED` MUST carry at least one non-empty reason code and MUST be terminal. A transition out of `REJECTED` MUST produce `REJECTED_TERMINAL` (exit 35).

**INV-063.** State MUST NOT reach `ELIGIBLE_FOR_HUMAN_ADMISSION` or a later state based solely on the absence of failures. Positive gate evidence is required.

**INV-064.** A numeric score MUST NOT appear in `decision.state` derivation. Scoring prioritizes candidates that are already eligible; it does not establish eligibility.

## 9. Break-glass (INV-070 … INV-072)

**INV-070.** When `break_glass` is non-null, `approver_a_id` and `approver_b_id` MUST be non-empty and distinct. A violation MUST produce `BREAK_GLASS_INVALID` (exit 36).

**INV-071.** Break-glass authorization MUST carry `expires_at`. At or after expiry, the override MUST be treated as expired.

**INV-072.** Break-glass authorization MUST reference a resolvable `post_incident_review_ref`. An unresolvable reference MUST produce `BREAK_GLASS_INVALID` (exit 36).

## 10. Audit (INV-080 … INV-082)

**INV-080.** If the append-only audit store is unavailable, return `AUDIT_STORE_UNAVAILABLE` (exit 32). The validator MUST NOT proceed on a cached permissive default.

**INV-081.** Authorization MUST NOT be issued without a corresponding audit record. The audit record's `record_digest` MUST match the digest of the record as stored.

**INV-082.** Audit `sequence` MUST be strictly increasing per repository. Duplicate or out-of-order sequence MUST produce `AUDIT_STORE_UNAVAILABLE` (exit 32).

## 11. Policy source (INV-090 … INV-092)

**INV-090.** If policy service, trust root, or required policy artifact is unreachable, return `POLICY_SOURCE_UNAVAILABLE` (exit 25). The validator MUST NOT use a cached permissive default.

**INV-091.** If the policy artifact signature does not verify against the configured trust root, return `POLICY_SIGNATURE_INVALID` (exit 26).

**INV-092.** A producer-supplied `signature_verified: true` MUST NOT be trusted. The receiving validator MUST independently verify the referenced artifact against the configured trust root.

## 12. Fail-closed defaults (INV-100 … INV-102)

**INV-100.** Any unrecognized condition MUST produce `HOLD` with a non-empty reason code. The validator MUST NOT default to `PASS`, `VALIDATED`, or `ELIGIBLE_FOR_HUMAN_ADMISSION`.

**INV-101.** Any unhandled exception MUST produce `VALIDATOR_INTERNAL_ERROR` (exit 70) and `HOLD`. The validator MUST NOT exit 0 on an exception.

**INV-102.** The validator MUST NOT expose a configuration option to bypass a mandatory gate. The mandatory gate set MUST come from independently verified signed policy, not mutable local configuration.

## 13. Exit code vocabulary

| Exit | Name | Meaning |
|---:|---|---|
| 0 | `FULL_VERIFICATION_PASS` | Full verification succeeded. Authorizing only within the separately defined human-admission process. |
| 10 | `STRUCTURE_VALID_ONLY` | Structural validation only. Non-authorizing. |
| 20 | `EVIDENCE_MISSING` | Required evidence file absent. |
| 21 | `EVIDENCE_INVALID` | Malformed JSON, schema violation, or wrong artifact class. |
| 22 | `EVIDENCE_EXPIRED` | Evidence at or beyond `expires_at`. |
| 23 | `SIGNATURE_UNVERIFIED` | Unissued envelope, invalid signature, or untrusted key. |
| 24 | `ARTIFACT_INTEGRITY_FAILED` | Artifact digest mismatch. |
| 25 | `POLICY_SOURCE_UNAVAILABLE` | Policy service, trust root, or artifact unreachable. |
| 26 | `POLICY_SIGNATURE_INVALID` | Policy signature fails trust verification. |
| 27 | `CANDIDATE_IDENTITY_MISMATCH` | Candidate tuple differs from authorization. |
| 28 | `POLICY_VERSION_CHANGED` | Policy digest changed; re-evaluation required. |
| 29 | `REVIEW_INDEPENDENCE_FAILED` | Approver conflicts with author or last committer. |
| 30 | `AUTHORIZATION_EXPIRED` | Authorization at or beyond `expires_at`. |
| 31 | `ENVIRONMENT_QUARANTINED` | Target environment is quarantined. |
| 32 | `AUDIT_STORE_UNAVAILABLE` | Append-only audit store unavailable or inconsistent. |
| 33 | `REQUIRED_EVIDENCE_UNAVAILABLE` | Mandatory gate missing, skipped, or unavailable. |
| 34 | `INVALID_TRANSITION` | State transition not permitted. |
| 35 | `REJECTED_TERMINAL` | Attempt to progress a rejected candidate. |
| 36 | `BREAK_GLASS_INVALID` | Override lacks dual authorization or valid expiry. |
| 70 | `VALIDATOR_INTERNAL_ERROR` | Unhandled exception. |

Exit codes are stable. New codes MAY be added. Existing codes MUST NOT be reassigned. A consumer branching on an exit code MUST treat an unrecognized nonzero code as `HOLD`.

## 14. Reason code vocabulary

Reason codes are the machine-readable form of a failure. They appear in `decision.reason_codes` and validator output. Each failure class has one canonical exit code and one canonical reason code. A validator MAY emit additional diagnostic codes, but the canonical reason code MUST be present.

Reason codes MUST be uppercase snake case, stable, and never repurposed.

## 15. State model

`REQUESTED → CANDIDATE_PINNED → EVIDENCE_READY → VALIDATED → ELIGIBLE_FOR_HUMAN_ADMISSION → ADMITTED_TO_STAGING → STAGING_VALIDATED → ELIGIBLE_FOR_RELEASE_ADMISSION → RELEASE_ADMITTED → DEPLOYED → MEASURED`

`HOLD` is recoverable from any non-terminal state. `REJECTED` is terminal. `EXPIRED` is an authorization property, not a candidate state.

Environment state is independent: `HEALTHY ⇄ QUARANTINED → RECOVERY_PENDING → HEALTHY`.

## 16. Change control

- A change altering required behavior for an existing record class requires a new schema version.
- Adding an invariant requires a new draft iteration and a corresponding negative test.
- Removing an invariant requires an ADR.
- Exit-code and reason-code vocabularies are append-only.
- This document is normative only after the `draft` suffix is removed from the schema directory it lives in.

## 17. Test binding

Every invariant MUST have a corresponding test in `tests/tooling/admission-boundary.test.mjs` or a successor. The test MUST assert the exit code, reason code, and that the result is not `FULL_VERIFICATION_PASS`.

An invariant without a test is not enforced. A test without an invariant is not a contract.
