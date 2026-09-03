export const EXECUTION_ENVELOPE_VERSION = '1.0.0' as const;

export type Decision = 'PASS' | 'HOLD' | 'REJECT';
export type ChangeCategory =
  | 'repository-structure'
  | 'ci-cd'
  | 'security'
  | 'release'
  | 'routing'
  | 'observability'
  | 'runtime'
  | 'documentation';

export interface EvidenceReference {
  id: string;
  kind: 'commit' | 'check' | 'log' | 'scan' | 'test' | 'artifact';
  source: string;
  observedAt: string;
  status: 'pass' | 'fail' | 'missing';
}

export interface ExecutionEnvelope {
  version: typeof EXECUTION_ENVELOPE_VERSION;
  repository: string;
  headSha: string;
  categories: ChangeCategory[];
  evidence: EvidenceReference[];
  risk: { score: number; reasons: string[]; uncertainty: string[] };
  decision: Decision;
  requiresHumanApproval: true;
}

export function validateExecutionEnvelope(value: ExecutionEnvelope): string[] {
  const errors: string[] = [];
  if (value.version !== EXECUTION_ENVELOPE_VERSION) errors.push('unsupported envelope version');
  if (!/^[\w.-]+\/[\w.-]+$/.test(value.repository)) errors.push('repository must be owner/name');
  if (!/^[a-f0-9]{40}$/.test(value.headSha)) errors.push('headSha must be a full lowercase SHA-1');
  if (value.categories.length === 0) errors.push('at least one change category is required');
  if (value.evidence.length === 0) errors.push('evidence is required');
  if (value.evidence.some((item) => item.status === 'missing') && value.decision === 'PASS') {
    errors.push('missing evidence cannot produce PASS');
  }
  if (value.risk.score < 0 || value.risk.score > 100) errors.push('risk score must be between 0 and 100');
  if (value.requiresHumanApproval !== true) errors.push('human approval is mandatory');
  return errors;
}
