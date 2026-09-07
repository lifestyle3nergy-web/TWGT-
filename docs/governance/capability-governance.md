# Capability Governance

Each capability should have one clear owner and an explicit integration boundary.

## Rules

- Prefer reuse of an existing repository capability over duplication.
- Record cross-repository ownership in `docs/ecosystem-map.md`.
- New adapters must declare source, target, contract, authentication boundary, and failure behavior.
- Activation artifacts do not automatically become runtime capabilities.
- A capability relocation requires an ADR in the affected repository.

## Resilience

Capability governance should reduce single points of failure. A dependency is not considered healthy merely because it works today; ownership, interface stability, observability, fallback behavior, and migration options must also be understood.
