# TWGT Repository Contract

**Contract version:** 1.0.0  
**Effective:** 2026-09-07  
**Authority:** `docs/adr/0001-stable-repository-boundary.md`

## Mission

TWGT is a controlled engineering foundation for intelligent infrastructure, knowledge, governance, and supporting platform capabilities. Repository evolution must be deliberate, traceable, testable, and reversible.

## Current boundary

The current repository contains a verified Node.js/TypeScript baseline plus documentation, CLI/dashboard material, repository tooling, CI, and security automation. Existing runtime material is part of the frozen baseline.

This contract **does not authorize expansion** of that runtime surface.

## Belongs here

- Architecture and engineering documentation.
- ADRs and governance policy.
- Repository-level CI and security controls.
- Existing TWGT platform baseline and its tests/tooling.
- Activation artifacts that are explicitly scoped under `activation/`.
- Repository validation scripts required to enforce this contract.

## Does not belong here

- Unrelated applications or services.
- Secrets, credentials, private keys, or generated private state.
- Vendored dependency trees or build output.
- New runtime ecosystems introduced without an ADR.
- Duplicate copies of capabilities owned by another TWGT repository.
- Production data or environment-specific state.

## Languages and runtimes

- Existing baseline: TypeScript/JavaScript on Node.js 24.
- Documentation/configuration: Markdown, JSON, YAML, shell where required by existing tooling.
- A new runtime language requires an ADR before introduction.
- A new package manager or build system requires an ADR before introduction.

## Top-level boundary

New top-level directories are prohibited unless an ADR explicitly authorizes them. The existing top-level tree is the baseline allowlist enforced by CI.

## Activation boundary

Activation material must be contained below:

```text
activation/
├── config/
├── schemas/
├── prompts/
├── protocols/
├── scripts/
├── state/
└── evidence/
```

Activation files must remain declarative or operationally scoped unless a separate ADR authorizes a runtime integration.

## Change control

An ADR is required before merging a change that:

- adds a top-level directory;
- adds a new runtime language;
- adds or removes a runtime boundary;
- changes repository ownership of a capability;
- introduces a new build/package ecosystem;
- changes the activation boundary;
- changes the repository contract itself;
- relocates an architectural component across repository boundaries.

Routine documentation, tests, dependency updates, and bug fixes do not require a new ADR unless they alter one of the protected boundaries above.

## CI expectations

Every pull request must pass:

- repository-contract validation;
- JSON/YAML validation;
- ADR compliance validation;
- existing build, test, lint/typecheck, and security checks;
- `git diff --check`.

CI is read-only and must not mutate production systems or repository state.

## Documentation expectations

Structural decisions require an ADR. Significant behavior or boundary changes update the relevant architecture, roadmap, changelog, or governance documentation.

## Failure policy

Boundary violations fail CI. A failing governance check is not waived by application tests passing. The change must either be corrected or explicitly re-authorized through an ADR.
