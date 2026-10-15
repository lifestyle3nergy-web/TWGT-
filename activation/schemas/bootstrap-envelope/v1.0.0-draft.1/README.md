# Bootstrap envelope schema — v1.0.0-draft.1

This schema describes a signed cryptographic trust envelope. It contains issuer and evidence identity, issuance and expiry times, signing algorithm/key/trust-root identifiers, subject identity, artifact digests, and a detached signature value.

It deliberately contains no staging or production decision and no human reviewer field. The signature must cover the RFC 8785 JCS serialization of the defined unsigned payload; the signature field itself is excluded from the signed payload. The implementation must define this exact byte-level rule before any real envelope is issued.

Schema validation is not cryptographic verification. The consumer must resolve the signing key to a configured trust root, verify the signature, verify the subject and artifact digests, and enforce issued_at < expires_at and current_time < expires_at. Missing trust material or unavailable verification must fail closed.

Consumer: verify-bootstrap-evidence.mjs in cryptographic verification mode. No real signing authority or key is designated by this draft.
