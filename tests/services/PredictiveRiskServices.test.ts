import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ChangeClassifierService } from '../../src/services/ChangeClassifierService';
import { EvidenceCollectorService, type RawEvidence } from '../../src/services/EvidenceCollectorService';
import { RiskScoringService } from '../../src/services/RiskScoringService';
import { EXECUTION_ENVELOPE_VERSION, validateExecutionEnvelope, type ExecutionEnvelope } from '../../src/contracts/ExecutionEnvelope';

const fixturePath = fileURLToPath(new URL('../fixtures/predictive-risk/security-failure.json', import.meta.url));
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as { repository: string; headSha: string; paths: string[]; evidence: RawEvidence[] };

describe('predictive risk foundation', () => {
  it('classifies security-sensitive changes deterministically', () => {
    expect(new ChangeClassifierService().classify(fixture.paths)).toEqual(['security']);
  });

  it('redacts evidence and rejects a demonstrated scan failure', () => {
    const evidence = new EvidenceCollectorService().collect(fixture.evidence, ['commit', 'check', 'test', 'scan']);
    expect(evidence.find((item) => item.kind === 'scan')?.source).toBe('token=[REDACTED]');
    const risk = new RiskScoringService().assess(['security'], evidence);
    expect(risk.decision).toBe('REJECT');
    expect(risk.uncertainty).toEqual(expect.arrayContaining([expect.stringContaining('missing check'), expect.stringContaining('missing test')]));
  });

  it('prevents missing evidence from silently passing', () => {
    const evidence = new EvidenceCollectorService().collect([], ['commit']);
    const risk = new RiskScoringService().assess(['documentation'], evidence);
    const envelope: ExecutionEnvelope = { version: EXECUTION_ENVELOPE_VERSION, repository: fixture.repository, headSha: fixture.headSha, categories: ['documentation'], evidence, risk: { score: risk.score, reasons: risk.reasons, uncertainty: risk.uncertainty }, decision: 'PASS', requiresHumanApproval: true };
    expect(validateExecutionEnvelope(envelope)).toContain('missing evidence cannot produce PASS');
  });
});
