# Adaptive Metric Selection

## Purpose

TWGT selects operational control signals from observed workload behaviour instead of assuming that one metric represents every service.

## Workload classes

- HTTP/request-response: CPU, request rate, latency percentiles, error rate, saturation.
- Asynchronous workers: queue depth, queue age, throughput, worker utilisation.
- Batch workloads: job age, completion rate, resource utilisation, backlog.
- JVM services: heap pressure, garbage-collection activity, CPU, latency and error rate.

## Policy

Candidate metrics are observed and correlated with demand, saturation and user-visible impact. A metric may be used for recommendation or control only after its suitability has been validated by telemetry.

## Guardrails

Metric selection must respect capability, privacy, cost, latency, battery/edge, security and human-authorisation boundaries. Selection is deterministic and auditable.

## Control loop

Observe -> Classify -> Correlate -> Select -> Act -> Measure -> Re-evaluate

This capability complements existing heuristics such as Fibonacci; it does not replace them. Heuristics generate candidates, while measured system behaviour provides evidence for operational control.
