import type { ChangeCategory } from '../contracts/ExecutionEnvelope';

const RULES: ReadonlyArray<{ category: ChangeCategory; patterns: RegExp[] }> = [
  { category: 'ci-cd', patterns: [/^\.github\/workflows\//, /(^|\/)Dockerfile$/, /(^|\/)scripts\//, /(^|\/)(compose\.ya?ml|docker-compose\.ya?ml)$/i, /(^|\/)(infra|infrastructure|deploy|deployment|terraform|k8s|kubernetes)\//i] },
  { category: 'security', patterns: [/^\.github\/dependabot\.ya?ml$/, /(^|\/)(auth|security|policies)\//, /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock)$/, /(^|\/)\.env(?:\.[^/]+)?(?:\.example|\.sample|\.template)?$/] },
  { category: 'release', patterns: [/^\.changeset\//, /(^|\/)release/i, /^CHANGELOG\.md$/] },
  { category: 'routing', patterns: [/(^|\/)(plugins?|models?|routing)\//, /gateway/i] },
  { category: 'observability', patterns: [/(^|\/)(telemetry|observability|logging|metrics)\//, /opentelemetry/i] },
  { category: 'repository-structure', patterns: [/^(package|tsconfig|vitest)\..+$/, /workspace/i, /turbo\.json$/] },
  { category: 'runtime', patterns: [/^src\//, /^prisma\//, /(^|\/)migrations?\//, /(^|\/)(compose\.ya?ml|docker-compose\.ya?ml)$/i, /(^|\/)(infra|infrastructure|deploy|deployment|terraform|k8s|kubernetes)\//i] },
  { category: 'documentation', patterns: [/^docs\//, /\.md$/] },
];

export class ChangeClassifierService {
  classify(paths: readonly string[]): ChangeCategory[] {
    const matches = new Set<ChangeCategory>();
    for (const path of paths) {
      for (const rule of RULES) {
        if (rule.patterns.some((pattern) => pattern.test(path))) matches.add(rule.category);
      }
    }
    return [...matches].sort();
  }
}
