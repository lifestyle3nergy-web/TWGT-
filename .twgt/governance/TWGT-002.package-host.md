# ADR TWGT-002 — Package Host for @twgt/relationship-types

Status: Accepted
Date: 2026-10-29
Authorizer: <YOUR NAME>, Owner, lifestyle3nergy-web

## Decision

Option B — a new repo, `twgt-relationship-types`, hosts and publishes
`@twgt/relationship-types`.

## Rationale

- libs is a C/C++ project — rejected.
- TWGT- manifest is twgt-platform@1.0.0, not a types package.
- Dedicated repo gives independent versioning and clean CI.

## Preconditions

- Package identity: @twgt/relationship-types, version 1.0.0
- Immutable version policy: 1.0.0 never overwritten
- Consumer pin policy: exact version, no caret

## Consequences

- P01 target is twgt-relationship-types repo.
- Independent release cadence.

## Signature

Signed: ____________________
Date: ____________________
