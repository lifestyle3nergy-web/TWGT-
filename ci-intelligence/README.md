# KAi Predictive CI

KAi-CI is the first bounded predictive-intelligence layer for TWGT CI remediation.

It **adds to** the existing Fibonacci-compatible exploration policy. It does not replace or rewrite that policy.

## Operating model

```
CI evidence
   ↓
KAi classification
   ↓
candidate repairs
   ↓
deterministic repair policy
   ↓
isolated branch
   ↓
independent validation
   ↓
human authorisation
```

The model may propose modifications, but governance remains deterministic.

## First capability

Run:

```bash
npm run kai:ci:diagnose -- --message "Protected structural change detected without a numbered ADR in docs/adr/"
```

Or pipe a workflow log:

```bash
cat failure.log | npm run kai:ci:diagnose
```

The advisor returns:

- failure signature
- confidence
- diagnosis
- up to three bounded repair candidates
- protected paths
- change budgets
- human-approval requirements
- required validation commands

## Safety boundary

KAi-CI does **not**:

- write directly to `main`
- force-push
- access secrets
- rewrite governance policy
- merge pull requests
- autonomously approve protected changes

The next layer can use these proposals to create an isolated remediation branch and apply a candidate patch. The Evaluator remains independent.

## Fibonacci relationship

Fibonacci remains the exploration/control substrate:

```
Fibonacci → how much / how broadly to explore
KAi       → what evidence suggests trying next
Evaluator → whether the experiment actually improved the system
Governance → what may never be changed autonomously
Human     → final authority
```

This separation lets predictive capability become more adaptive without making the admission policy adaptive.
