# ADR-0014: Baseline-Provenance Intake and Human Admission

- **Status:** Proposed
- **Date:** 2026-10-17
- **Decision owners:** TWGT maintainers

## Context

`twgt-bridge` produces baseline-provenance evidence records and
`twgt-schema-gate` validates them. This repository (`TWGT-`) is the
admission consumer in the platform architecture. No declarative contract
currently exists here for accepting bridge output or recording human
admission decisions.

`docs/governance/capability-governance.md` requires new adapters to
declare source, target, contract, authentication boundary, and failure
behavior. `activation/schemas/bootstrap.schema.json` covers the
bootstrap boundary and does not describe bridge intake or admission.

## Decision

1. Declare `TWGT-` as the admission consumer of baseline-provenance
   evidence produced by `twgt-bridge` and validated by
   `twgt-schema-gate`.

2. Add two declarative schemas under the existing activation boundary:

   - `activation/schemas/twgt-intake.schema.json` — contract for
     accepting bridge output. Requires `EVIDENCE_READY` and
     `gateVerdict: PASS` for entry; rejects `HELD`, `FAIL`, and
     `UNKNOWN`.

   - `activation/schemas/admission-record.schema.json` — contract for
     human admission decisions. Requires an operator identity, notes,
     and a candidate SHA; permits `ADMIT`, `HOLD`, or `REJECT` only.

3. Both schemas use JSON Schema draft 2020-12 and the
   `twgt://activation/schemas/` identifier namespace, aligning with
   `bootstrap.schema.json`.

4. No runtime integration lands with this ADR. Runtime code that reads
   intakes, writes admission records, or publishes telemetry requires a
   separate ADR per the change-control separation principle.

5. Human admission authority is preserved. No automated process may
   write an admission record. The schemas permit a human operator field
   only.

6. Authentication boundary: this ADR introduces no cryptographic
   signing. Like the bootstrap boundary, an authoritative signature
   scheme remains undefined and is a hard blocker for signed intake.
   Until then, intake integrity relies on the SHA-256 digests already
   produced by `twgt-bridge` and pinned by `CONTRACT_LOCK.json`.

7. Failure behavior: fail-closed. Missing contract lock, mismatched
   digests, non-PASS gate verdict, or missing operator identity must
   reject intake. No partial acceptance.

## Consequences

- Positive: intake and admission become machine-verifiable and
  auditable against pinned schemas.
- Positive: the activation boundary gains two declarative contracts
  without expanding the runtime surface.
- Negative: two schemas enter maintenance; versioning discipline is
  required per `activation/schemas/README.md`.
- Security: no secrets in schemas; no auto-admission path exists.
- Migration: none; new capability, no existing consumers to update.

## Alternatives considered

- Extend `bootstrap.schema.json` — rejected. The bootstrap boundary
  covers nucleus commits, rollback pins, and signatures; it does not
  describe bridge intake or admission decisions. Merging the concerns
  would obscure both boundaries.
- Place schemas under `activation/protocols/` — rejected. Protocols
  describe procedures; these are data contracts.
- Place schemas under `activation/evidence/` — rejected. That
  directory holds evidence, not contracts.
- Runtime-first implementation — rejected. Violates
  `docs/governance/change-control.md` separation principle and the
  activation boundary rules.
- Defer entirely until schema-gate PR #12 merges — rejected. The
  declarative contract is independent of the upstream merge; the
  runtime integration is not.

## Validation

- `ajv` (or equivalent) validates both schemas against draft 2020-12.
- Negative fixtures must exist before any runtime consumer is
  proposed: missing `schemaVersion`, non-hex digests, `HELD` state,
  `FAIL` verdict, missing operator, invalid decision.
- CI must run schema validation on every pull request that modifies
  `activation/schemas/`.
- Schema must not duplicate any field already defined by
  `bootstrap.schema.json`.

## Reversal / migration

Reverting this ADR means deleting the two schema files and this ADR
record. No runtime consumer exists at reversal time, so no migration
is required. If runtime consumers are later added under a separate
ADR, that ADR must define its own reversal path.
