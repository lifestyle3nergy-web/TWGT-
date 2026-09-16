# ADR-0006: Bounded Runtime Shutdown and Redis Resilience

- **Status:** Proposed
- **Date:** 2026-09-16
- **Decision owners:** TWGT maintainers
- **Scope:** `repair/runtime-lifecycle`
- **Repository:** `lifestyle3nergy-web/TWGT-`

## Context

TWGT currently performs graceful shutdown from `src/index.ts` by closing the Fastify application, quitting Redis, and disconnecting Prisma.

The shutdown sequence is ordered and isolates failures so that an error closing one resource does not prevent later cleanup. However, the sequence has no upper time bound.

If `app.close()` or another shutdown operation does not settle, TWGT can remain alive indefinitely. This makes container termination, service restart, rollback, and deployment health recovery nondeterministic.

TWGT also configures ioredis with a connection-level `retryStrategy` that continues reconnecting indefinitely with a capped delay. Command-level retry behavior is governed separately by ioredis. The current configuration does not explicitly reconcile those two policies.

This creates two runtime lifecycle questions that must be resolved together:

1. How long may TWGT attempt graceful shutdown before failing closed?
2. Should Redis commands fail after a bounded retry period even while the Redis connection continues attempting recovery?

## Decision

TWGT will use a bounded graceful-shutdown policy.

Receipt of `SIGTERM` or `SIGINT` will initiate orderly shutdown:

1. stop accepting work and close the Fastify application;
2. close the Redis connection;
3. disconnect Prisma;
4. terminate successfully when cleanup completes within the shutdown deadline.

A shutdown deadline will be established before asynchronous cleanup begins.

If graceful shutdown does not complete within that deadline, TWGT will log the timeout and terminate with a non-zero exit status rather than remain indefinitely in a partially shutting-down state.

Cleanup operations will remain independently guarded so failure of one resource does not prevent cleanup of subsequent resources where execution can continue.

## Redis retry policy

TWGT will explicitly configure `maxRetriesPerRequest` rather than relying on the ioredis default.

Connection recovery and command recovery are separate concerns.

The connection may continue using bounded-backoff reconnection attempts, while individual commands must have an explicit, finite failure policy so callers are not left waiting indefinitely during a Redis outage.

The selected value must be documented in code and covered by regression tests.

This ADR does not authorize setting `maxRetriesPerRequest: null` merely to make command retries match indefinite connection retries. Indefinite command waiting would transfer the availability failure into request latency and shutdown behavior.

## Implementation scope

The Batch 2 repair is intentionally narrow.

Expected production changes:

- `src/index.ts`
  - establish a shutdown deadline;
  - preserve orderly Fastify → Redis → Prisma cleanup;
  - clear the deadline when shutdown completes;
  - use non-zero termination when the hard deadline is exceeded;
  - retain logging for individual cleanup failures.
- `src/database/redis.ts`
  - make `maxRetriesPerRequest` explicit;
  - retain bounded reconnect backoff;
  - document the distinction between connection recovery and command failure.
- tests
  - graceful shutdown completes normally;
  - Fastify shutdown failure does not prevent later cleanup;
  - Redis cleanup failure does not prevent Prisma cleanup;
  - a hung shutdown reaches the hard deadline;
  - the timeout path terminates unsuccessfully;
  - Redis retry configuration matches the policy defined here.

No deployment provider, container image, Prisma `binaryTargets`, schema migration, Redis-client replacement, or unrelated dependency migration belongs in this batch.

## Fail-closed requirements

Because this change modifies `src/index.ts`, it crosses the repository's structural-change boundary and must include this numbered ADR in the same change set.

Before publication, the exact rebased tree must pass:

```text
git fetch origin
git rebase origin/main

npm ci
npm run lint
npm run build
npm test
npm run format:check
node scripts/validate-repository-contract.mjs
git diff --check
npm audit --audit-level=high
```

Execution stops on the first non-zero result.

A tree that has not completed every local gate successfully must not be pushed as the Batch 2 acceptance candidate.

## Remote acceptance requirements

After publication, the pushed commit SHA becomes the acceptance boundary.

That exact head requires fresh:

- Continuous Integration;
- Repository Governance;
- Dependency Review;
- CodeQL;
- secret scanning and SBOM/vulnerability scanning where required by the repository's merge gates;
- independent human approval of the exact head.

Any subsequent push, rebase, or repair creates a new acceptance boundary and invalidates approval/evidence tied to the previous head.

No governance check may be bypassed or weakened to admit this change.

## CODEOWNERS dependency

At the time this ADR was drafted, repository CODEOWNERS assigned the repository-wide ownership boundary only to `@lifestyle3nergy-web`.

Batch 2 must not be considered merge-eligible until repository governance permits the required independent exact-head review to be supplied by an eligible reviewer or team.

Resolving that governance condition is separate from the runtime implementation and must not be accomplished by weakening the independent-review requirement.

## Consequences

### Positive

- shutdown has deterministic upper bounds;
- deployments and rollbacks cannot wait indefinitely for application cleanup;
- Redis outage behavior becomes explicit rather than dependent on library defaults;
- connection recovery remains possible without forcing application commands to wait forever;
- lifecycle behavior becomes regression-testable.

### Trade-offs

A hard shutdown deadline can terminate the process before every resource has completed graceful cleanup.

That is intentional. Once the configured deadline is exceeded, deterministic termination is preferred to an indefinitely hung process.

A finite Redis command retry policy means commands can fail while the Redis client continues attempting to reconnect. Callers therefore remain responsible for handling Redis unavailability correctly.

## Alternatives considered

### Unbounded graceful shutdown

Rejected because a hung Fastify close, Redis operation, or other resource can prevent restart or rollback indefinitely.

### Indefinite Redis command retries

Rejected as the default policy because it can convert a Redis outage into unbounded request latency and interfere with deterministic shutdown.

### Immediate forced termination

Rejected because TWGT already has resources that should be closed cleanly when possible, including Fastify, Redis, and Prisma.

### Combine lifecycle work with deployment configuration

Rejected. Deployment architecture and Prisma runtime targets remain separate decisions. This ADR establishes application lifecycle semantics independent of the eventual hosting provider.

## Validation evidence

This section remains `NOT_RUN` while the ADR is Proposed.

It must be populated only from the exact Batch 2 acceptance head.

Required evidence:

- acceptance commit SHA;
- base `main` SHA;
- local gate results;
- shutdown regression-test results;
- Redis resilience regression-test results;
- Continuous Integration run;
- Repository Governance run;
- Dependency Review run;
- CodeQL run;
- Merge Gates result;
- independent exact-head approval.

Missing evidence must be recorded as `NOT_RUN` or `UNVERIFIED`, never inferred.

## Status transition

Change this ADR from Proposed to Accepted only when the implementation represented by the exact acceptance SHA has satisfied the repository's required technical and human-review gates.

If Batch 2 is abandoned or superseded, mark the ADR accordingly rather than representing an unimplemented decision as accepted.
