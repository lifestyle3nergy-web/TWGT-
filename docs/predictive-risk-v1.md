# Predictive Risk Foundation v1

This bounded foundation classifies repository changes and converts read-only evidence into an explainable `PASS`, `HOLD`, or `REJECT` recommendation. It does not call models, mutate repositories, approve changes, merge, release, or deploy.

## Decision path

1. Validate the versioned execution envelope and immutable commit SHA.
2. Classify changed paths across CI/CD, security, releases, routing, observability, structure, runtime, and documentation.
3. Collect and redact evidence. Required missing evidence is explicit.
4. Apply deterministic weights and thresholds from the versioned policy.
5. Emit one recommendation with reasons and uncertainty for human review.

`PASS` is impossible when required evidence is missing. Any failing evidence signal, a policy that relaxes the mandatory human-approval or no-production-mutation boundary, or a score of 80+ produces `REJECT`; incomplete evidence or a score of 40+ produces `HOLD`.

## Trust boundary

- Inputs are repository metadata and saved synthetic fixtures only.
- Secret-like values are redacted before persistence or routing.
- Scanners provide evidence; they do not make the final decision.
- Every mutation, merge, release, deployment, policy change, or model-routing change requires separate human approval.
- Production credentials and environments are excluded.

## Maintenance

Policy or scoring changes require fixture updates, independent CI, Dependency Review, CodeQL, and human review. False positives and false negatives should be recorded against the policy version before thresholds change.
