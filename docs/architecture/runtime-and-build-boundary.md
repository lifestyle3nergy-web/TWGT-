# Runtime and Build Boundary

## Purpose

This document defines the authoritative runtime and TypeScript build boundary for TWGT.

## Runtime authority

The production application has one runtime entrypoint:

`src/index.ts` → `src/core/Bootstrap.ts` → `src/core/app.bootstrap.ts` → Fastify

The legacy raw `node:http` server path has been removed from the runtime composition root. Fastify is the authoritative HTTP runtime and owns the application routes, JWT plugin, CORS configuration, and HTTP lifecycle.

The DI container remains responsible for application services such as `Application` and `CognitiveCycleService`. It is initialized by the same `Bootstrap` that owns the HTTP runtime so the repository no longer has two competing startup paths.

## Build authority

The production TypeScript compiler boundary is intentionally:

- **Application:** `src/**/*.ts` and `src/**/*.tsx`
- **Tests:** `tests/**/*.ts` are validated by Vitest but are not production build inputs.
- **Tooling configuration:** `vitest.config.ts` and `prisma.config.ts` are tooling, not production application modules.
- **Prototype surface:** `twgt-dashboard/**` is not part of the production build or release artifact.

An executable TypeScript/TSX surface may only exist outside `src/` when it is explicitly classified as tooling, test, or prototype code and has a documented validation boundary.

### Current non-production surfaces

| Surface | Classification | Production build | Validation boundary |
|---|---|---:|---|
| `src/**` | Application | Included | TypeScript + ESLint + tests |
| `tests/**` | Tests | Excluded | Vitest |
| `vitest.config.ts` | Test tooling | Excluded | Loaded by Vitest |
| `prisma.config.ts` | Database tooling | Excluded | Prisma CLI |
| `twgt-dashboard/**` | Prototype | Excluded | Prototype-only; not a production release surface |

## Acceptance rule for future code

A new executable `.ts`/ `.tsx` surface must be one of:

1. included in the authoritative application build/test/lint boundary;
2. explicitly classified as tooling/test/example/prototype with its own validation boundary; or
3. removed.

No executable source should silently sit outside the repository's declared validation boundaries.
