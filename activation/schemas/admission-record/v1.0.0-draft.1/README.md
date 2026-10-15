# Admission record schema — v1.0.0-draft.1

This is the governance record for candidate identity, policy binding, evidence, independent human review, authorization, environment, derived decision, supply-chain provenance, and audit lineage. It contains no raw cryptographic signature. Signature and trust material belong to the bootstrap envelope and referenced policy artifact.

The JSON Schema checks record shape only. The admission validator must recompute identity digests, verify signatures and source digests, check expiry and mandatory gates, verify review independence, resolve break-glass references, evaluate environment state, derive decision.state, and enforce terminal rejection. A structurally valid record is not an admission decision.

Consumer: the TWGT admission validator (implementation pending). Every invariant in invariants.md requires negative tests asserting both exit code and reason code.
