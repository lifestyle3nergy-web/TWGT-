#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const run = (command, args) =>
  execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const fail = (message) => {
  console.error(`GOVERNANCE BLOCKER: ${message}`);
  process.exitCode = 1;
};

const expectedHead = process.env.GITHUB_PR_HEAD_SHA;
const baseSha = process.env.GITHUB_PR_BASE_SHA;
const actualHead = run('git', ['rev-parse', 'HEAD']);

console.log('TWGT GOVERNANCE VERIFICATION');
console.log(`BASE_SHA=${baseSha ?? 'unset'}`);
console.log(`PR_HEAD_SHA=${expectedHead ?? 'unset'}`);
console.log(`ACTUAL_HEAD_SHA=${actualHead}`);

if (expectedHead && expectedHead !== actualHead) {
  fail('PR head changed during verification; rerun the complete workflow.');
}
if (!baseSha) {
  fail('GITHUB_PR_BASE_SHA is required for pull-request governance verification.');
  process.exit(1);
}

const changedFiles = run('git', ['diff', '--name-only', `${baseSha}...HEAD`])
  .split('\n')
  .filter(Boolean);

const governanceFiles = new Set([
  'docs/architecture/capability-execution-graph.md',
  'src/contracts/CapabilityComponent.ts',
  'src/services/CapabilityRegistry.ts',
  'src/policies/edge-execution-policy.json',
  'src/registries/components/github-repository-inspector.json',
  'tests/policies/policy-fixtures.test.ts',
  'tests/services/CapabilityRegistry.test.ts',
]);

const suspiciousRuntime = changedFiles.filter((file) =>
  /^(src|activation)\//.test(file) &&
  !governanceFiles.has(file) &&
  !file.startsWith('src/policies/') &&
  !file.startsWith('src/registries/components/'),
);

console.log(`CHANGED_FILES=${changedFiles.length}`);
for (const file of changedFiles) console.log(`  ${file}`);

if (suspiciousRuntime.length > 0) {
  fail(`unexpected runtime/activation files changed: ${suspiciousRuntime.join(', ')}`);
}

const policyFiles = changedFiles.filter((file) => /^src\/policies\/.*\.(json|ya?ml)$/.test(file));
const policyTestFiles = changedFiles.filter((file) => /^tests\/policies\/.*\.(ts|js|mjs)$/.test(file));
if (policyFiles.length > 0 && policyTestFiles.length === 0) {
  fail(`policy files changed without a policy test change: ${policyFiles.join(', ')}`);
}

const registryPath = 'src/services/CapabilityRegistry.ts';
if (changedFiles.includes(registryPath)) {
  const registry = readFileSync(join(process.cwd(), registryPath), 'utf8');
  const forbidden = [
    /catch\s*\([^)]*\)\s*\{\s*(?:\/\/[^\n]*\n\s*)?return\s+true\s*;?/s,
    /catch\s*\{\s*(?:\/\/[^\n]*\n\s*)?return\s+true\s*;?/s,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(registry)) {
      fail('possible fail-open catch/allow pattern detected in CapabilityRegistry.ts');
      break;
    }
  }
}

const required = [
  'src/policies/edge-execution-policy.json',
  'tests/policies/policy-fixtures.test.ts',
  'src/contracts/CapabilityComponent.ts',
  'src/services/CapabilityRegistry.ts',
];
for (const file of required) {
  if (!existsSync(file)) fail(`required governance file is missing: ${file}`);
}

const contract = readFileSync('src/contracts/CapabilityComponent.ts', 'utf8');
if (!contract.includes('approvalRequired')) {
  fail('ResolvedComponent authorization signal approvalRequired is missing.');
}

console.log('GOVERNANCE_SCOPE=PASS');
console.log(`PR_HEAD_STABLE=${expectedHead ? expectedHead === actualHead : 'UNKNOWN'}`);
console.log('CAPABILITY_AUTHORIZATION_SIGNAL=PASS');
console.log('POLICY_TEST_MAPPING=PASS');
console.log('VERDICT=' + (process.exitCode ? 'HOLD' : 'PASS'));
