# TWGT Ecosystem Federation Map

This map records repository roles and ownership boundaries. It is intentionally conservative: a repository is not considered an owner of a capability merely because it consumes or references it.

| Repository | Role | Boundary | Integration responsibility |
|---|---|---|---|
| `TWGT-` | Engineering foundation and governance baseline | Repository contract, architecture, CI, governance, existing baseline | Defines standards and cross-repository contracts |
| `ui-skills` | UI/skill capability source | UI-oriented reusable skills and patterns | Supplies reusable skill material without taking ownership of TWGT governance |
| `jsoncanvas` | JSON Canvas specification/documentation | JSON Canvas representation and documentation | Provides a format contract for compatible consumers |
| `Replit-Clone` | Application prototype | Application/product runtime | Owns application behavior rather than TWGT governance |
| `codex` | Reference/tooling ecosystem | Codex CLI and associated tooling | Reference/integration source; not a duplicate TWGT runtime |
| `prettier` | Formatting/tooling reference | Formatting ecosystem | Tooling dependency/reference only |

## Integration boundary

Cross-repository integration should identify:

- source repository;
- owning capability;
- consuming repository;
- interface or artifact contract;
- authentication/permission boundary;
- version or compatibility policy;
- failure and fallback behavior.

## Ownership rule

If ownership is ambiguous, do not duplicate the capability. Record the ambiguity and resolve it through an ADR before establishing a new long-lived boundary.

## Maintenance

Update this map when a repository role, capability owner, or integration boundary changes. Such a change requires an ADR when it changes architecture or ownership.
