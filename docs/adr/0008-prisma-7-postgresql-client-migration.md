# ADR-0008: Prisma 7 PostgreSQL Client Migration

- Status: Proposed
- Date: 2026-09-16

## Context

TWGT is migrating its Prisma ORM toolchain from Prisma 5 to Prisma 7. Prisma 7 changes the PostgreSQL connection boundary: the generated client uses the `prisma-client` generator with an explicit output path, and PostgreSQL connections use the `@prisma/adapter-pg` driver adapter with `pg`.

The repository also needs a Prisma Config file so CLI datasource configuration is separated from the Prisma schema.

## Decision

- Pin `prisma` and `@prisma/client` to `7.10.0`.
- Use `@prisma/adapter-pg@7.10.0` with `pg` for PostgreSQL connectivity.
- Add `@types/pg` for TypeScript support and `dotenv` for Prisma Config environment loading.
- Use the Prisma 7 `prisma-client` generator with an explicit generated-client output under `src/generated/prisma`.
- Import `PrismaClient` only from the generated client path.
- Configure Prisma CLI through root `prisma.config.ts` and keep the schema datasource provider declarative.
- Generate the dependency lockfile with `npm install`; do not hand-edit dependency resolution data.
- Pin the transitive `mysql2` resolution to a patched 3.24.x release and scope the Prisma `deepmerge-ts` override to the affected `@prisma/config` dependency.
- Maintain a committed initial migration and validate it against an isolated PostgreSQL database before merge.
- Do not run migrations against production as part of CI validation.

## Security validation

Prisma 7.10.0's `@prisma/config` package metadata declares `deepmerge-ts@7.1.5`. The repository override resolves the installed dependency tree to `deepmerge-ts@8.x`; clean `npm ci` and `npm audit --audit-level=high` are required to verify that resolution. Dependency Review has a narrowly scoped GHSA exception because it evaluates the upstream declaration rather than the overridden installed tree.

Prisma 7 also introduces a transitive `mysql2` dependency. The lockfile is regenerated with npm after pinning that dependency to a current patched 3.24.x release so the clean-install and audit gates validate the actual resolved tree.

## Consequences

The application gains a supported Prisma 7 PostgreSQL adapter boundary and explicit generated-client ownership. The migration introduces a first-class migration history and requires the adapter, generated client, and lockfile to remain aligned with the Prisma major version.

CI must validate schema/configuration, client generation, TypeScript, lint, build, tests, audit, and migration application against an isolated PostgreSQL service.

## Rollback

If the Prisma 7 migration fails validation, revert this migration and the associated Prisma 7 dependency/client changes as one boundary, then restore the prior Prisma 5 client configuration and lockfile from the last validated main commit. No production schema changes are authorized by this ADR.
