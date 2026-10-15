# Admission validator invariants — v1.0.0-draft.1

These invariants are normative and must be enforced by the admission validator in addition to JSON Schema validation. Unknown, unavailable, stale, skipped, or unverified inputs fail closed to HOLD; none may be promoted to PASS.

## Time and freshness

- For every authorization and evidence item, issued_at/observed_at must precede expires_at as applicable, and current time must be strictly earlier than expires_at.
- Every mandatory evidence gate must be present exactly once, have result PASS, and be fresh at evaluation time.
- Duplicate gate IDs, duplicate evidence identities, invalid timestamps, and future observations beyond configured clock skew are rejected.

## Identity and policy binding

- Recompute candidate.identity_digest from the exact tuple in candidate-identity-v1.md; do not trust a producer-supplied digest.
- authorization.candidate_identity_digest must equal candidate.identity_digest.
- Every evidence item candidate_head_sha must equal candidate.head_sha.
- Every evidence item policy_digest must equal policy.artifact_digest and authorization.policy_digest must equal policy.artifact_digest.
- Every evidence source digest, artifact digest, lockfile digest, deploy-config digest, and contract digest must be verified against the bytes or trusted provenance that they identify.
- Candidate changes, deployment configuration changes, contract changes, policy changes, trust-root changes, or revocation invalidate existing authorization and require reevaluation.

## Decision derivation and transitions

- decision.state is computed by the validator from verified inputs, prior lineage, environment state, and explicit human decisions. A producer-declared state that differs from the derived state returns exit 34 with reason INVALID_TRANSITION.
- RELEASE_ADMITTED requires production stage, ACTIVE authorization, fresh mandatory evidence, independent recorded release review, a matching policy digest, and a present verified environment parity report.
- ADMITTED_TO_STAGING requires staging stage, ACTIVE authorization, independent recorded review, all mandatory gates passing, and environment state HEALTHY.
- A staging acceptance result must bind to the exact artifact digest. Environment drift during a staging run yields HOLD.
- Authorization expiry, revocation, or a deployment configuration change moves the candidate to HOLD until re-evaluated.
- REJECTED is terminal for the linked candidate lineage. A subsequent attempt must create a new candidate identity/lineage; reopening the rejected lineage returns exit 35 with reason REJECTED_TERMINAL.

## Human review and break-glass

- When review_state is RECORDED, approver_id must be non-empty and must differ from both author_id and last_committer_id. Otherwise return exit 29 with reason REVIEW_INDEPENDENCE_FAILED.
- Break-glass is null unless explicitly invoked. If present, approver_a_id and approver_b_id must be distinct and independently authorized, scope must be bounded, authorization must be unexpired, and post_incident_review_ref must resolve to an immutable audit item. Failure returns exit 36 with reason BREAK_GLASS_INVALID.
- A machine-generated state never substitutes for the required human admission decision.

## Environment dimension

- Environment state is orthogonal to candidate state: HEALTHY → QUARANTINED → RECOVERY_PENDING → HEALTHY.
- A quarantined environment blocks new ADMITTED_TO_STAGING transitions but does not reject the candidate.
- A candidate already in staging when its environment becomes quarantined moves to HOLD with ENVIRONMENT_QUARANTINED.
- Environment identity and state must be sampled at issuance and rechecked at transition time. Production admission requires a verified parity_report_digest.

## Supply-chain provenance

- Supply-chain materials must include the source tree digest and lockfile digest.
- builder_id must resolve to a configured trust root. For GitHub-hosted builders, capture workflow ref and run ID. For self-hosted builders, capture runner class and image digest.
- Invocation, materials, byproducts, builder identity, and artifact digest must be internally consistent and independently verified. A URI alone is not provenance.

## Error contract

- Structural-only validation returns exit 10 and STRUCTURE_VALID_ONLY; this is explicitly non-authorizing.
- Missing evidence: exit 20 / EVIDENCE_MISSING.
- Invalid JSON/schema: exit 21 / EVIDENCE_INVALID.
- Stale evidence: exit 22 / EVIDENCE_EXPIRED.
- Signature/key trust failure: exit 23 / SIGNATURE_UNVERIFIED.
- Artifact digest mismatch: exit 24 / ARTIFACT_INTEGRITY_FAILED.
- Policy/trust source unavailable: exit 25 / POLICY_SOURCE_UNAVAILABLE.
- Invalid policy signature: exit 26 / POLICY_SIGNATURE_INVALID.
- Candidate identity mismatch: exit 27 / CANDIDATE_IDENTITY_MISMATCH.
- Policy version/digest changed: exit 28 / POLICY_VERSION_CHANGED.
- Reviewer independence failure: exit 29 / REVIEW_INDEPENDENCE_FAILED.
- Authorization expired: exit 30 / AUTHORIZATION_EXPIRED.
- Environment quarantined: exit 31 / ENVIRONMENT_QUARANTINED.
- Audit store unavailable: exit 32 / AUDIT_STORE_UNAVAILABLE.
- Required gate missing/skipped/unavailable: exit 33 / REQUIRED_EVIDENCE_UNAVAILABLE.
- Invalid state transition: exit 34 / INVALID_TRANSITION.
- Rejected lineage reopened: exit 35 / REJECTED_TERMINAL.
- Invalid break-glass record: exit 36 / BREAK_GLASS_INVALID.
- Internal validator error: exit 70 / VALIDATOR_INTERNAL_ERROR.

Each error code/reason pair requires at least one negative test against the production validator. This document defines the contract; it does not claim that the validator or tests are implemented.
