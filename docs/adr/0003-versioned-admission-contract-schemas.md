# ADR-0003 — Versioned admission-contract schema publication

**Status:** Proposed — requires human review before merge
**Date:** 2026-10-15
**Scope:** TWGT PR #119

## Context

The admission contract needs three independently versioned artifact classes: structural validation result, bootstrap cryptographic envelope, and admission governance record. Their consumers and authorization semantics differ, so they must not be collapsed into one schema. The agreed publication path is top-level schemas/ with immutable versioned directories.

The current repository contract rejects new top-level entries unless explicitly approved. Adding schemas/ therefore requires a numbered ADR and a narrow allowlist update; adding files alone would fail the governance gate.

## Decision proposed

1. Publish the three schema families under schemas/{structural-result,bootstrap-envelope,admission-record}/v1.0.0-draft.1/.
2. Keep structural output explicitly non-authorizing and use exit 10 for structural-only mode; exit 0 is reserved for full verification success.
3. Keep bootstrap envelope signatures and trust-root data separate from admission governance decisions.
4. Freeze candidate identity v1 to the exact tuple and RFC 8785 JCS + SHA-256 computation defined in candidate-identity-v1.md.
5. Add schemas as an approved top-level entry in scripts/validate-repository-contract.mjs only alongside this ADR.
6. Preserve historical schema directories; breaking changes require a new versioned directory and never mutate released records in place.

## Consequences and unresolved dependencies

- This ADR is proposed, not accepted. Human review is required before merge.
- JSON Schema does not implement cryptographic verification, digest recomputation, state derivation, expiry, reviewer independence, environment quarantine, or terminal rejection; the runtime validator and negative tests remain required.
- Signature authority, trust-root owner, repair owners, and append-only evidence store are not assigned by this ADR.
- No signing key, authorization, or admission decision is issued by publication of these draft files.
