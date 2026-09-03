import type { Decision, EvidenceReference } from '../contracts/ExecutionEnvelope';
import type { RiskAssessment } from './RiskScoringService';

export interface RiskPolicy {
  thresholds: { hold: number; reject: number };
  humanApprovalRequired: true;
  productionMutationAllowed: false;
}

const DEFAULT_POLICY: RiskPolicy = {
  thresholds: { hold: 40, reject: 80 },
  humanApprovalRequired: true,
  productionMutationAllowed: false,
};

export class PolicyEvaluatorService {
  evaluate(
    risk: RiskAssessment,
    evidence: readonly EvidenceReference[],
    policy: RiskPolicy = DEFAULT_POLICY,
  ): Decision {
    if (policy.humanApprovalRequired !== true || policy.productionMutationAllowed !== false) return 'REJECT';
    if (
      !Number.isFinite(policy.thresholds.hold) ||
      !Number.isFinite(policy.thresholds.reject) ||
      policy.thresholds.hold < 0 ||
      policy.thresholds.reject > 100 ||
      policy.thresholds.hold >= policy.thresholds.reject
    ) return 'REJECT';
    const hasFailure = evidence.some((item) => item.status === 'fail');
    const hasMissing = evidence.some((item) => item.status === 'missing');
    if (hasFailure || risk.score >= policy.thresholds.reject) return 'REJECT';
    if (hasMissing || risk.score >= policy.thresholds.hold) return 'HOLD';
    return 'PASS';
  }
}
