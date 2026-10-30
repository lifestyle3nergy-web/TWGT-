# ADR 0036 — P03 Strict Pinning and Live OPA

## Status

Accepted

## Context

The shadow workflow was checking out the moving `main` branch of the gate and running with the `--local` flag (which bypasses OPA). This is not reproducible and fails to test the authorization layer.

## Decision

Pin the workflow to the exact immutable commit SHA `2218a654c7e0e46e0ed980434066557ab5aac550`. Remove the `--local` flag so the workflow starts a local OPA server and enforces the Rego policies.

## Consequences

Provides reproducible validation and fully exercises the zero-trust authorization layer in CI.
