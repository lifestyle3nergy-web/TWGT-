# ADR-0008 — Static Outcome Library Activation Boundary

- **Status:** Proposed
- **Date:** 2026-09-21
- **Decision:** Permit the TWGT Static Outcome Library to extend the existing `activation/` boundary as runtime-free governed artefacts.
- **Related PR:** #93 — feat: add static outcome delivery library
- **Repository contract:** `REPO-CONTRACT.md` v1.0.0
- **Contract validator:** `scripts/validate-repository-contract.mjs`

## Context

PR #93 introduces a static outcome-delivery capability under the already approved `activation/` boundary.

The capability contains declarative configuration, schemas, prompts, protocols and evidence documentation. It does not introduce a new runtime, package manager, top-level application directory, production state path, or executable service.

The repository contract treats `activation/` as a protected structural surface. Therefore the change requires an explicit numbered ADR before it can pass repository governance validation.

## Decision

Approve the following bounded structural change on the PR #93 branch:

- retain all new artefacts beneath `activation/`;
- retain the existing activation subdirectory contract;
- permit the Static Outcome Library artefacts:
  - `activation/config/`
  - `activation/schemas/`
  - `activation/prompts/`
  - `activation/protocols/`
  - `activation/evidence/`;
- keep the capability runtime-free;
- keep dynamic execution outside the static library in an approved runtime boundary;
- require human authorisation for production or customer-impacting actions.

This ADR does **not** approve a new runtime, dependency, package-manager change, top-level directory, or production state surface.

## Boundary and governance

The authoritative boundary remains:

`activation/` → `config | schemas | prompts | protocols | scripts | state | evidence | README.md`

The PR remains subject to the repository contract validator and all downstream CI gates.

This ADR is the numbered governance declaration required by the current contract for the protected structural change.

## Consequences

### Positive

- PR #93 has an explicit architectural record.
- The Static Outcome Library remains isolated from the runtime baseline.
- Repository governance can distinguish an authorised structural extension from undocumented drift.
- The capability can evolve through later ADRs if its boundary or execution model changes.

### Constraints

- No secrets or production state may be introduced into `activation/`.
- No runtime dependency or executable service is authorised by this ADR.
- Any future protected structural change requires its own contract-compliant governance record.

## Verification

The PR must pass:

1. `node scripts/validate-repository-contract.mjs`
2. YAML/JSON validation
3. diff formatting
4. repository validation
5. all required CI/security gates on the resulting exact head SHA.

## References

- PR #93: https://github.com/lifestyle3nergy-web/TWGT-/pull/93
- Repository contract: `REPO-CONTRACT.md`
- Contract validator: `scripts/validate-repository-contract.mjs`
- Existing activation boundary documentation: `activation/README.md`
