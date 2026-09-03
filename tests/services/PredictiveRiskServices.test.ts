import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ChangeClassifierService } from '../../src/services/ChangeClassifierService';
import { EvidenceCollectorService, type RawEvidence } from '../../src/services/EvidenceCollectorService';
import { RiskScoringService } from '../../src/services/RiskScoringService';
import { PolicyEvaluatorService } from '../../src/services/PolicyEvaluatorService';
import { EXECUTION_ENVELOPE_VERSION, validateExecutionEnvelope, type ExecutionEnvelope } from '../../src/contracts/ExecutionEnvelope';

const fixturePath = fileURLToPath(new URL('../fixtures/predictive-risk/security-failure.json', import.meta.url));
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as { repository: string; headSha: string; paths: string[]; evidence: RawEvidence[] };

describe('predictive risk foundation', () => {
  it('classifies security-sensitive changes deterministically', () => {
    expect(new ChangeClassifierService().classify(fixture.paths)).toEqual(['runtime', 'security']);
  });

  it('redacts evidence and rejects a demonstrated scan failure', () => {
    const evidence = new EvidenceCollectorService().collect(fixture.evidence, ['commit', 'check', 'test', 'scan']);
    expect(evidence.find((item) => item.kind === 'scan')?.source).toBe('token=[REDACTED]');
    const risk = new RiskScoringService().assess(['security'], evidence);
    expect(risk.decision).toBe('REJECT');
    expect(new PolicyEvaluatorService().evaluate(risk, evidence)).toBe('REJECT');
    expect(risk.uncertainty).toEqual(expect.arrayContaining([expect.stringContaining('missing check'), expect.stringContaining('missing test')]));
  });

  it('prevents missing evidence from silently passing', () => {
    const evidence = new EvidenceCollectorService().collect([], ['commit']);
    const risk = new RiskScoringService().assess(['documentation'], evidence);
    const envelope: ExecutionEnvelope = { version: EXECUTION_ENVELOPE_VERSION, repository: fixture.repository, headSha: fixture.headSha, categories: ['documentation'], evidence, risk: { score: risk.score, reasons: risk.reasons, uncertainty: risk.uncertainty }, decision: 'PASS', requiresHumanApproval: true };
    expect(validateExecutionEnvelope(envelope)).toContain('missing evidence cannot produce PASS');
  });

  it('classifies deployment, migration, environment template, and lockfile paths', () => {
    const categories = new ChangeClassifierService().classify([
      'compose.yaml',
      'infrastructure/terraform/main.tf',
      'prisma/migrations/001_init/migration.sql',
      '.env.production.template',
      'pnpm-lock.yaml',
      'yarn.lock',
    ]);
    expect(categories).toEqual(['ci-cd', 'runtime', 'security']);
  });

  it.each([
    [39, 'PASS'],
    [40, 'HOLD'],
    [79, 'HOLD'],
    [80, 'REJECT'],
  ] as const)('applies threshold boundary %i as %s', (score, expected) => {
    expect(new PolicyEvaluatorService().evaluate(
      { score, reasons: [], uncertainty: [], decision: 'PASS' },
      [{ id: 'check-1', kind: 'check', source: 'synthetic', observedAt: '2026-09-03T00:00:00Z', status: 'pass' }],
    )).toBe(expected);
  });

  it('adds mixed-category weights deterministically', () => {
    const assessment = new RiskScoringService().assess(['documentation', 'runtime', 'routing'], []);
    expect(assessment.score).toBe(30);
    expect(assessment.reasons).toEqual(['runtime:10', 'routing:20']);
  });

  it('rejects any failed evidence and holds missing evidence', () => {
    const scorer = new RiskScoringService();
    expect(scorer.assess(['documentation'], [{ id: 'test-1', kind: 'test', source: 'synthetic', observedAt: '2026-09-03T00:00:00Z', status: 'fail' }]).decision).toBe('REJECT');
    expect(scorer.assess(['documentation'], [{ id: 'scan-1', kind: 'scan', source: 'missing', observedAt: 'missing', status: 'missing' }]).decision).toBe('HOLD');
  });

  it('rejects policies that relax approval or production boundaries', () => {
    const evaluator = new PolicyEvaluatorService();
    const risk = { score: 0, reasons: [], uncertainty: [], decision: 'PASS' as const };
    const evidence = [{ id: 'check-1', kind: 'check' as const, source: 'synthetic', observedAt: '2026-09-03T00:00:00Z', status: 'pass' as const }];
    expect(evaluator.evaluate(risk, evidence, { thresholds: { hold: 40, reject: 80 }, humanApprovalRequired: false, productionMutationAllowed: false } as never)).toBe('REJECT');
    expect(evaluator.evaluate(risk, evidence, { thresholds: { hold: 40, reject: 80 }, humanApprovalRequired: true, productionMutationAllowed: true } as never)).toBe('REJECT');
  });
});
