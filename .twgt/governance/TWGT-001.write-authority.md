# ADR TWGT-001 — Write Authority for the Graph of Record

Status: Accepted
Date: 2026-10-29
Authorizer: <TradieNate>, Owner, lifestyle3nergy-web

## Decision

Option B — `twgt-persist-service` (new repo) is the sole authorized
writer to the TWGT graph of record.

## Rationale

- twgt-knowledge README states it is not a data store.
- twgt-bridge is read-only by contract.
- twgt-git-hitl is a human review surface, not a writer.
- TWGT-/src/graph/ contains only .gitkeep; adding a write contract couples
  persistence to a repo with an open-PR backlog.
- A dedicated service has a clean trust boundary.

## Consequences

- P04 targets twgt-persist-service.
- twgt-bridge remains read-only.
- ~2 weeks extra vs Option A; clean separation for P10/P12.

## Signature

Signed: ____________________
Date: ____________________
