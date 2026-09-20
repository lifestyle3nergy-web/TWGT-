# ADR 0010: Adaptive Metric Selection and Expert Capability Controls

- Status: Proposed
- Scope: TWGT platform control plane
- Related configuration: `activation/config/capability-controls.yaml`

## Context

Different workload classes expose different operational bottlenecks. A single resource metric can therefore produce poor control decisions. TWGT also needs a consistent boundary for automated capability execution.

The repository contract permits activation configuration below `activation/` while requiring an ADR for protected capability and control-boundary changes.

## Decision

Introduce a shared policy model for capability admission and adaptive metric selection. Metric candidates are selected by workload class, validated against telemetry, constrained by hard limits, and evaluated deterministically.

Capability execution remains bounded by explicit authorisation and audit requirements. The initial configuration is observe-only and recommendation-oriented; consequential automation remains human-authorised.

The policy configuration is stored under the existing `activation/config/` boundary rather than introducing a new top-level directory.

## Consequences

Positive:

- Better alignment between telemetry and actual workload behaviour.
- Reusable controls across HTTP, asynchronous, batch, and JVM services.
- Clear separation between heuristic candidate generation and measured operational control.
- Auditable automation boundaries.
- No expansion of the repository's top-level directory boundary.

Trade-offs:

- Requires telemetry quality and correlation data.
- Adds policy/configuration surface that must itself be governed.
- Initial operation favours recommendation/simulation before autonomous control.

## Rollout

Start in observe/simulate mode, add fixture-based tests and telemetry contracts, then enable controlled execution only where evidence and authorisation are sufficient.

## Safety boundary

This ADR does not grant autonomous merge, force-push, secret access, governance-policy mutation, or consequential production authority. Any future expansion requires explicit review and the applicable repository controls.
