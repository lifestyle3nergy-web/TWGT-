# Expert Capability Controls

## Objective

Provide a common admission and decision boundary for TWGT agents, services and automated workflows.

## Control sequence

1. Validate request.
2. Validate candidate capability.
3. Check capability and visibility.
4. Apply privacy admission.
5. Apply edge-execution policy.
6. Apply transport admission.
7. Apply metering admission.
8. Apply battery/resource admission where applicable.
9. Enforce latency and cost hard limits.
10. Score surviving candidates using observable evidence.
11. Apply stable deterministic tie-breaking.
12. Execute within the authorised boundary.
13. Record outcome and evidence.
14. Re-evaluate policy from measured results.

## Human authority

Automation may observe, diagnose, recommend and execute only within explicitly authorised capability boundaries. It must not silently expand its own permissions.

## Operating modes

- observe: telemetry and recommendations only.
- simulate: evaluate proposed actions without production mutation.
- controlled: execute within explicit policy limits.
- human-approved: pause for human authorisation before consequential action.

## Evidence requirements

Every automated decision should be traceable to the request, candidate set, policy version, metrics considered, decision, execution result and outcome where telemetry is available.

## Failure behaviour

When required evidence or policy checks are unavailable, the safe default is to avoid escalation of capability and return a reviewable diagnostic state.
