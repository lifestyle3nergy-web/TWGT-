# ADR-0002: Runtime Freeze & Meta-Repository Transition Policy

- **Status:** Proposed
- **Date:** 2026-09-07
- **Decision owners:** TWGT maintainers

## Context

PR #57 establishes the governance foundation for TWGT, including `REPO-CONTRACT.md`, repository-boundary validation, governance documentation, ADR structure, activation-boundary policy, and governance CI.

The repository currently contains an established Node.js/TypeScript application baseline together with CLI/dashboard material, documentation, repository tooling, CI, security automation, and runtime integrations. That baseline is authoritative because it exists on the main base branch; this ADR does not redefine it by static reconstruction.

The long-term direction may be a runtime-independent engineering-governance meta-repository. That direction must not be implemented implicitly through governance hardening, deletion of existing runtime material, or an unreviewed repository split.

## Decision

### 1. Runtime boundary

TWGT remains a Node.js/TypeScript runtime repository for the current lifecycle.

The existing runtime architecture is frozen as an **architectural boundary**, not frozen against maintenance or internal evolution. The runtime directories and files named in repository documentation are representative examples of the current baseline, not an exhaustive allowlist. The authoritative baseline is the complete verified main-branch tree and the components that constitute its existing runtime architecture.

The following remain inside the current architectural boundary unless a later ADR changes that decision:

- existing Node.js/TypeScript runtime components;
- existing runtime directories and application surfaces;
- the existing package-management and lockfile contract;
- the existing build and validation system;
- the established application entrypoint and runtime integrations; and
- existing tests, tooling, and configuration that support that runtime.

A runtime freeze means that **material architectural expansion** requires explicit review. It does not prohibit routine maintenance, internal implementation changes, or security remediation within the established boundary.

### 2. Changes allowed within the frozen boundary

The following are normally permitted without a new architectural ADR when they remain within the established repository and runtime boundaries:

- bug fixes;
- internal refactoring;
- dependency upgrades and security remediation;
- test additions and test improvements;
- documentation changes;
- internal implementation changes in TypeScript/JavaScript;
- UI/UX changes within existing application surfaces;
- performance, reliability, and observability improvements;
- configuration changes that do not establish a new architectural boundary; and
- routine CI maintenance that does not change runtime ownership, architecture, or protected repository boundaries.

All such changes remain subject to `REPO-CONTRACT.md`, review, and CI validation.

### 3. Architectural changes requiring an ADR

A subsequent ADR is required before implementation of a materially new architectural boundary, including:

- a new top-level runtime/application boundary;
- a new independently deployable service or application;
- a new runtime language or runtime ecosystem;
- replacement of the package manager or package-management ecosystem;
- a materially different build system;
- a new runtime entrypoint that changes application ownership or execution architecture;
- a new runtime ownership boundary;
- transfer of runtime or capability ownership to another repository;
- extraction, relocation, replacement, or removal of an existing architectural component;
- migration into a materially different repository architecture; or
- creation of a separately owned governance/meta-repository architecture.

The requirement is based on the **architectural meaning of the change**, not merely on modification of a sensitive filename. For example, changing `package.json` to update a dependency version is routine maintenance; replacing the package-management ecosystem is an architectural change. Updating a workflow for routine maintenance is not by itself an architectural change; moving CI ownership or changing the repository's architectural control boundary is.

An ADR documents and authorizes the architectural decision. It does not replace implementation validation, security checks, application tests, or review.

### 4. Policy versus current automated enforcement

This ADR defines the intended governance policy. The repository-contract validator is the current automated enforcement mechanism and must be understood as an implementation of that policy, not as a complete substitute for architectural review.

The validator derives its comparison baseline from the authoritative Git base branch, evaluates the pull-request delta, and applies deterministic repository-boundary rules. Its current checks may use conservative structural triggers for files or paths associated with architectural changes. Those automated triggers are enforcement mechanisms, not a claim that every matching file modification is itself an architectural change.

Where the validator is broader than the semantic policy, maintainers should classify the change according to the architectural rule and improve the validator deliberately rather than weakening governance through exceptions. Where the policy describes a future check that is not yet implemented, that requirement remains a review/governance obligation and is not represented as an already-enforced CI predicate.

Validator evolution must preserve deterministic behavior and avoid heuristic false positives that would make routine maintenance indistinguishable from architectural expansion.

### 5. Activation boundary

The activation hierarchy introduced by PR #57 is separate from runtime architecture.

Activation artifacts are non-runtime material isolated under `activation/` and governed by the repository contract. They are not historical runtime baseline material and must not silently become executable application code.

Promotion of activation material into the existing runtime, creation of a separately deployable activation service, or creation of a new runtime/ownership boundary requires the applicable ADR before implementation.

### 6. Meta-repository transition

The long-term direction toward a runtime-independent engineering-governance meta-repository is established as **direction only**.

This ADR performs no migration and authorizes no extraction, relocation, replacement, deletion, or repository split.

A future migration ADR must explicitly define, at minimum:

1. what remains in TWGT;
2. what moves;
3. runtime ownership;
4. governance-contract ownership;
5. activation ownership;
6. schema ownership;
7. CI-policy ownership;
8. provenance and evidence preservation;
9. downstream and cross-repository connections;
10. success criteria;
11. rollback strategy;
12. compatibility requirements;
13. deprecation and transition sequencing; and
14. conditions required before legacy runtime removal.

No repository split, ownership transfer, or runtime removal may be inferred solely from this ADR.

### 7. CI enforcement model

The intended governance model is:

**authoritative base → pull-request delta → deterministic classification → policy check**

Changes should be classified as one of:

- routine internal maintenance;
- security/dependency maintenance;
- documentation/governance maintenance;
- evolution within the existing runtime boundary; or
- architectural expansion requiring an ADR.

The validator should enforce repository-boundary rules that can be expressed deterministically, including relevant checks for:

- baseline tree changes;
- new protected top-level runtime boundaries;
- activation-boundary violations;
- new runtime/package ecosystems;
- new build systems;
- materially new runtime entrypoints; and
- ownership or repository-boundary changes where reliably detectable.

These checks must be introduced deliberately. A broad filename match is not, by itself, evidence that the underlying change is architectural.

### 8. ADR lifecycle

The governed sequence for architectural evolution is:

**architectural change → ADR → implementation → governance validation → application validation → review/approval**

An ADR is a prerequisite for a protected architectural change, not a substitute for the validation required to prove the implementation is safe.

## Consequences

### Positive

- Preserves the verified application baseline while governance matures.
- Reduces silent runtime and repository drift.
- Allows routine maintenance and security work without unnecessary architectural process.
- Makes genuine architectural expansion explicit and reviewable.
- Separates governance/activation concerns from the existing application runtime.
- Provides a controlled path toward a future meta-repository.
- Aligns architectural policy with the authoritative Git baseline and deterministic CI enforcement.

### Negative

- Genuine architectural changes require additional review and an ADR.
- The validator must evolve as governance policy becomes more precise.
- The repository temporarily retains both the established runtime and the governance foundation until any future migration is deliberately approved.
- Some conservative automated checks may identify changes for review even when maintainers ultimately classify them as routine; such cases should drive validator refinement rather than undocumented bypasses.

## Alternatives considered

### No runtime freeze

Rejected because continued uncontrolled expansion would weaken the repository boundary and make future extraction more difficult to reason about.

### Immediate runtime extraction

Rejected because the current governance change does not establish sufficient ownership, provenance, compatibility, rollback, and cross-repository migration contracts.

### Static runtime allowlist as the long-term model

Rejected because a static reconstruction can drift from the authoritative repository baseline and can create false assumptions about what belongs to the runtime.

### Fully heuristic architectural detection

Rejected because heuristic classification can create false positives and false negatives. Governance enforcement should prefer explicit policy and deterministic evidence.

## Relationship to ADR-0001

ADR-0001 establishes the stable repository boundary and the requirement for governed structural evolution.

ADR-0002 extends that policy by distinguishing:

- routine maintenance within the existing runtime boundary;
- architectural expansion requiring an ADR; and
- a future meta-repository migration requiring a separate migration decision.

Neither ADR-0001 nor ADR-0002 authorizes extraction, repository splitting, runtime removal, or ownership transfer.

## Validation

Before acceptance, this ADR must be reviewed against:

- `REPO-CONTRACT.md`;
- `docs/adr/0001-stable-repository-boundary.md`;
- the repository-boundary validator;
- the authoritative main baseline;
- the PR #57 delta; and
- governance and application CI behavior.

The ADR must not contradict the repository contract. Any validator behavior that does not yet fully implement this policy must be treated as an identified governance gap and addressed through a deliberate follow-up rather than by assuming that policy is already automatically enforced.

## Follow-ups

Future ADRs may be required for:

- material runtime architecture changes;
- new repository/runtime boundaries;
- capability ownership changes;
- meta-repository design and migration;
- provenance/evidence contracts across repositories;
- cross-repository governance contracts;
- promotion of activation capabilities into runtime services; and
- retirement or removal of the legacy runtime.

## Status

**Proposed — review required.**

This ADR is intended to be included in PR #57 only as a governance artifact. It does not authorize runtime extraction, repository splitting, runtime removal, or migration. Acceptance should occur only after terminology and enforcement semantics are confirmed against the repository contract and validator.
