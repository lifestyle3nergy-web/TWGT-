# ADR 0035 — P03 Node 22 Hotfix

## Status

Accepted

## Context

The shadow workflow was initially configured to use Node 20, but `commander@15` (used by `twgt-schema-gate`) requires Node 22.12+. This mismatch could cause CI failures when the gate is invoked.

## Decision

Update the shadow workflow to use Node 22.

## Consequences

Ensures the gate runs on a supported runtime and prevents engine mismatch errors.
