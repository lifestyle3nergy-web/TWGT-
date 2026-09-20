# ADR: Adaptive Metric Selection and Expert Capability Controls

- Status: Proposed
- Scope: TWGT platform control plane

## Context

Different workload classes expose different operational bottlenecks. A single resource metric can therefore produce poor control decisions. TWGT also needs a consistent boundary for automated capability execution.

## Decision

Introduce a shared policy model for capability admission and adaptive metric selection. Metric candidates are selected by workload class, validated against telemetry, constrained by hard limits, and evaluated deterministically. Capability execution remains bounded by explicit authorisation and audit requirements.

## Consequences

Positive:

- Better alignment between telemetry and actual workload behaviour.
- Reusable controls across HTTP, asynchronous and batch services.
- Clear separation between heuristic candidate generation and measured operational control.
- Auditable automation boundaries.

Trade-offs:

- Requires telemetry quality and correlation data.
- Adds policy/configuration surface that must itself be governed.
- Initial operation should favour recommendation/simulation before autonomous control.

## Rollout

Start in observe/simulate mode, add fixture-based tests and telemetry contracts, then enable controlled execution only where evidence and authorisation are sufficient.
