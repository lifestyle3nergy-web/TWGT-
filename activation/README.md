# Activation Boundary

Activation artifacts are isolated from the existing runtime baseline.

## Static Outcome Library

A reusable decision-and-delivery layer for converting environmental or customer demand into measurable outcomes without introducing a new runtime.

Flow:

`Environment → Demand → Observe → Understand → Outcome → Capability Map → Compose → Verify → Authorise → Publish → Measure → Evolve`

Core artefacts:
- `config/outcome-library.yaml` — library manifest and guardrails
- `config/repo-environment.yaml` — repository activation environment
- `config/capability-registry.yaml` — reusable capability classes and admission fields
- `schemas/outcome-package.yaml` — outcome contract
- `protocols/outcome-delivery.md` — delivery protocol
- `protocols/SOP-static-outcome-delivery.md` — operator SOP
- `prompts/outcome-assessor.md` — reusable assessment skill
- `evidence/` — traceable proof records

## Boundary

Static artefacts describe, assess and coordinate work. Dynamic execution remains outside this library in an approved runtime boundary.

Do not place secrets, production data, dependencies, build output, or general application code here.
