import type { EvidenceReference } from '../contracts/ExecutionEnvelope';

const SECRET_PATTERN = /(authorization|api[-_]?key|password|secret|token)\s*[:=]\s*([^\s,;]+)/gi;

export interface RawEvidence {
  id: string;
  kind: EvidenceReference['kind'];
  source?: string;
  observedAt?: string;
  status?: EvidenceReference['status'];
}

export class EvidenceCollectorService {
  collect(items: readonly RawEvidence[], requiredKinds: readonly EvidenceReference['kind'][]): EvidenceReference[] {
    const collected = items.map((item) => ({
      id: item.id,
      kind: item.kind,
      source: this.redact(item.source ?? 'missing'),
      observedAt: item.observedAt ?? 'missing',
      status: item.status ?? 'missing',
    }));

    for (const kind of requiredKinds) {
      if (!collected.some((item) => item.kind === kind)) {
        collected.push({ id: `missing-${kind}`, kind, source: 'missing', observedAt: 'missing', status: 'missing' });
      }
    }
    return collected;
  }

  private redact(value: string): string {
    return value.replace(SECRET_PATTERN, '$1=[REDACTED]');
  }
}
