# Architecture Evolution

TWGT evolves through explicit, reviewable boundaries.

## ADR triggers

An ADR is mandatory for:

- new top-level directories;
- new runtime languages;
- new package managers or build systems;
- runtime entrypoint or execution-model changes;
- capability relocation between repositories;
- activation architecture changes;
- changes to the repository contract.

## Stability rule

The absence of an ADR is a governance failure when a protected boundary changes. Passing application tests does not override this rule.

## Evolution model

```text
Inspect → classify → ADR if required → implement → validate → review → merge
```

The objective is controlled evolution, not permanent immobility.
