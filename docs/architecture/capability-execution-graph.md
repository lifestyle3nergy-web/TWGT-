# TWGT Capability Execution Architecture

## Execution graph

```text
OBSERVE
  -> NORMALIZE TASK
  -> POLICY
  -> INTELLIGENCE ROUTER
  -> CAPABILITY RESOLUTION
       -> MODEL REGISTRY
       -> TOOL REGISTRY
       -> SKILL REGISTRY
  -> EXECUTION PLAN
  -> TWGT RUNTIME
  -> SASA EXECUTION ENVELOPE
  -> EXECUTOR
       -> Android Edge
       -> Cloud Worker
       -> GitHub Action
       -> External API
  -> VALIDATE
  -> VSCAN / SECURITY
  -> TELEMETRY
  -> GITHUB EVIDENCE
  -> LEARN -> ROUTER
```

Every new component MUST attach to a named node or edge in this graph.

## Admission order

Prefer, in order:

1. Reuse an existing registered capability.
2. Configure an existing component.
3. Compose existing capabilities into a skill.
4. Extend an existing tool or adapter.
5. Isolate execution in a worker when required.
6. Create a new component only when isolation, ownership, security, lifecycle, scaling, or runtime constraints require it.

## Allowed component classes

- model: intelligence inference
- tool: atomic external capability
- skill: reusable multi-step workflow
- worker: execution capacity
- adapter: protocol/provider translation
- sensor: state or telemetry observation

Runtime, Router, Policy and Registries are platform primitives rather than plugins.

## Component admission gate

A component is rejected unless it declares:

1. Unique capability gap.
2. Graph position and dependencies.
3. Registry identity.
4. Input/output, timeout and failure contract.
5. Permissions, privacy and approval boundary.
6. CPU, memory, battery, bandwidth, latency and monetary resource profile where applicable.
7. Telemetry contract.
8. Lifecycle owner.
9. Fallback behaviour.
10. Replacement/removal contract.

## Android edge rule

Android remains a thin control and edge-state layer. Local execution is admitted only when offline operation, privacy, latency or device-local state materially benefits the task. Heavy builds, large models, large vector stores, PostgreSQL/Redis services, Kubernetes/Docker clusters and continuous browser automation remain remote.

## Stable runtime surface

Target API:

```text
GET  /health
GET  /models
GET  /tools
GET  /skills
GET  /components
GET  /capabilities
GET  /components/:id
GET  /components/:id/health
GET  /components/:id/telemetry
GET  /runs/:id
GET  /telemetry
GET  /network
POST /resolve
POST /task
```

The phone-facing invariant is that Android submits a normalized task and does not need to know which model, tool, worker, GitHub Action or external provider fulfills it.

## First executable slice

```text
Android -> POST /task -> Runtime -> Router -> SQLite/GitHub/one model -> Validate -> Telemetry -> Result
```

Do not add multiple model providers until this vertical slice is deterministic, observable and policy-controlled.
