# SOP — Static Outcome Delivery

Version: 0.1.0

## 1. Trigger
Use this SOP when a customer, community, engineering or environmental demand requires a defined outcome and a reusable capability response.

## 2. Observe
Capture:
- environment and operating context;
- current workflow;
- people and system boundaries;
- constraints;
- existing evidence;
- current baseline metric.

Output: demand record.

## 3. Understand
Translate observations into:
- problem statement;
- root/system constraints;
- dependencies;
- failure modes;
- measurable outcome.

Do not select technology yet.

## 4. Define the outcome
Write one sentence:
"Improve [measurable condition] from [baseline] toward [target] within [boundary]."

Define acceptance before implementation.

## 5. Discover capabilities
Search existing repositories, tools, libraries, skills, services and data assets.

Record:
- source;
- ownership;
- license;
- version;
- interfaces;
- dependencies;
- evidence;
- security posture;
- maintenance status;
- reuse potential.

## 6. Assess and admit
Classify each candidate. Mark:
- ADMIT when evidence and boundaries are sufficient;
- REVIEW when material evidence is missing;
- REJECT when risk, licensing, ownership or technical constraints fail the requirement.

Never duplicate an existing capability without resolving ownership.

## 7. Compose
Create the smallest composition capable of producing the defined outcome.

Pattern:
Demand → Hub/Ti → capability A + capability B + capability C → controlled execution → evidence → outcome.

Keep repositories independently useful.

## 8. Verify
Run the applicable engineering validation:
1. git fetch origin
2. git rebase origin/main
3. npm ci
4. npm run lint
5. npm run build
6. npm test
7. npm run format:check
8. node scripts/validate-repository-contract.mjs
9. git diff --check

If a command does not exist, record it as NOT APPLICABLE rather than inventing a substitute.

## 9. Authorise
Human reviews:
- outcome;
- evidence;
- risk;
- ownership;
- privacy;
- cost;
- rollback;
- next action.

No autonomous production activation.

## 10. Publish
Publish only the static knowledge required to explain:
- what was demanded;
- what was observed;
- what capability was selected;
- why;
- evidence;
- current decision;
- next action.

Do not publish secrets, private state or customer-sensitive data.

## 11. Measure
Compare result against baseline and acceptance condition.

Record:
- actual result;
- variance;
- failure;
- unexpected behaviour;
- cost/latency where relevant.

## 12. Reflect and evolve
Convert learning into:
- updated skill;
- improved library manifest;
- new evidence;
- ADR when a protected boundary changes;
- reusable customer/service pattern.

## 13. Close condition
A delivery cycle is complete only when:
- outcome is measurable;
- evidence is stored;
- decision is recorded;
- ownership is clear;
- next state is known.

## Ti output
Return only the minimum decision surface:
BLOCK / REVIEW / READY / ACTION / OPPORTUNITY
plus:
- Outcome
- Evidence
- Next action
- Owner
