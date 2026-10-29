# ADR 0034 — P03 Shadow Gate CI Rollout

## Status

Accepted

## Context

The TWGT architecture requires a schema and authorization gate to validate relationships. We have built the `twgt-gate` CLI (P02), but rolling it out as an authoritative blocker immediately risks breaking all PRs if the gate has bugs or if the OPA server is unconfigured.

## Decision

We will introduce the `twgt-gate` CLI into the `TWGT-` CI pipeline in **Shadow Mode**.

- The workflow will trigger on changes to `.twgt/relationships/**/*.json`.
- It will run the gate in `--local` diagnostic mode.
- The step will use `continue-on-error: true` so it reports findings but does not block the PR.

## Consequences

- We can observe the gate's output on real PRs without risk.
- Once we verify stability, we will remove `continue-on-error: true` and transition to Authoritative Mode in a future phase.
