# ADR-0009: Single Runtime and Explicit TypeScript Build Boundary

- **Status:** Accepted
- **Date:** 2026-09-20
- **Decision owners:** TWGT maintainers
- **Scope:** PR #90

## Context

PR #90 establishes a single application startup path and makes the production TypeScript build boundary explicit. The repository contract treats runtime composition roots, TypeScript configuration, and CI workflow changes as protected structural surfaces and requires a numbered ADR for those changes.

## Decision

1. Use `src/index.ts -> Bootstrap -> app.bootstrap -> Fastify` as the authoritative application startup path.
2. Remove the legacy raw `node:http` server from runtime composition.
3. Preserve the existing dependency-injection lifecycle and graceful shutdown responsibilities for Fastify, Redis, Prisma, and Application.
4. Define and validate the authoritative production TypeScript source boundary separately from tests, tooling, and `twgt-dashboard/**`.
5. Run source-boundary validation as part of CI.

## Consequences

- There is one documented production runtime entry path.
- Build inclusion is explicit and mechanically validated.
- Runtime and build-boundary changes remain auditable through the repository ADR process.
- JWT, authentication/API coverage, database coverage, CI workflow consolidation, CodeQL language expansion, and dashboard modernization remain outside PR #90.

## Validation

The change is admitted only when the repository contract, YAML validation, diff formatting, and the normal project CI checks pass on the PR merge ref.
