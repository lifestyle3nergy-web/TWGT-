import type { ChangeCategory, Decision, EvidenceReference } from '../contracts/ExecutionEnvelope';

const WEIGHTS: Readonly<Record<ChangeCategory, number>> = {
  security: 35,
  'ci-cd': 25,
  release: 25,
  routing: 20,
  observability: 15,
  'repository-structure': 15,
  runtime: 10,
  documentation: 0,
};

export interface RiskAssessment {
  score: number;
  reasons: string[];
  uncertainty: string[];
  decision: Decision;
}

export class RiskScoringService {
  assess(categories: readonly ChangeCategory[], evidence: readonly EvidenceReference[]): RiskAssessment {
    const reasons = categories.filter((category) => WEIGHTS[category] > 0).map((category) => `${category}:${WEIGHTS[category]}`);
    const failures = evidence.filter((item) => item.status === 'fail');
    const missing = evidence.filter((item) => item.status === 'missing');
    const score = Math.min(100, categories.reduce((sum, category) => sum + WEIGHTS[category], 0) + failures.length * 30 + missing.length * 15);
    const uncertainty = missing.map((item) => `missing ${item.kind} evidence (${item.id})`);
    const decision: Decision = failures.length > 0 || score >= 80 ? 'REJECT' : missing.length > 0 || score >= 40 ? 'HOLD' : 'PASS';
    if (failures.length > 0) reasons.push(`${failures.length} failing evidence item(s)`);
    return { score, reasons, uncertainty, decision };
  }
}
