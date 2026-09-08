import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = process.cwd();
const verifier = join(repoRoot, 'activation/scripts/verify-bootstrap-evidence.mjs');
const artifactContent = 'catalog: test\n';
const artifactDigest = createHash('sha256').update(artifactContent).digest('hex');

function runVerifier(evidence, key = 'REPLACE_WITH_TEAM_ISSUED_BOOTSTRAP_VERIFIER_PUBLIC_KEY') {
  const root = mkdtempSync(join(tmpdir(), 'twgt-bootstrap-test-'));
  const activation = join(root, 'activation');
  mkdirSync(join(activation, 'evidence'), { recursive: true });
  mkdirSync(join(activation, 'keys'), { recursive: true });
  mkdirSync(join(activation, 'schemas'), { recursive: true });
  writeFileSync(join(activation, 'schemas/bootstrap.schema.json'), JSON.stringify({
    type: 'object',
    required: ['commit', 'rollbackPin', 'repository', 'digests', 'signature'],
    properties: { commit: {}, rollbackPin: {}, repository: {}, digests: {}, signature: {} },
    additionalProperties: false,
  }));
  writeFileSync(join(activation, 'evidence/bootstrap.json'), JSON.stringify(evidence));
  writeFileSync(join(activation, 'keys/bootstrap-verifier.pub'), key);
  writeFileSync(join(root, 'catalog.yaml'), artifactContent);
  return spawnSync(process.execPath, [verifier], {
    cwd: repoRoot,
    env: {
      ...process.env,
      TWGT_BOOTSTRAP_EVIDENCE: join(activation, 'evidence/bootstrap.json'),
      TWGT_BOOTSTRAP_VERIFIER_KEY: join(activation, 'keys/bootstrap-verifier.pub'),
      TWGT_BOOTSTRAP_REPOSITORY_ROOT: root,
      TWGT_REPOSITORY: 'lifestyle3nergy-web/TWGT-',
    },
    encoding: 'utf8',
  });
}

const base = {
  commit: '0123456789abcdef0123456789abcdef01234567',
  rollbackPin: '89abcdef0123456789abcdef0123456789abcdef',
  repository: 'lifestyle3nergy-web/TWGT-',
  digests: {},
  signature: { algorithm: 'TEAM_DEFINED', value: 'signature' },
};

test('rejects placeholder commit', () => {
  const result = runVerifier({ ...base, commit: 'REPLACE_WITH_40_CHARACTER_NUCLEUS_COMMIT_SHA' });
  assert.notEqual(result.status, 0);
});

test('rejects placeholder rollback pin', () => {
  const result = runVerifier({ ...base, rollbackPin: 'REPLACE_WITH_40_CHARACTER_ROLLBACK_SHA' });
  assert.notEqual(result.status, 0);
});

test('rejects empty digest set', () => {
  const result = runVerifier(base);
  assert.notEqual(result.status, 0);
});

test('rejects invalid digest format', () => {
  const result = runVerifier({ ...base, digests: { 'catalog.yaml': 'REPLACE_WITH_SHA256' } });
  assert.notEqual(result.status, 0);
});

test('rejects placeholder verifier key', () => {
  const result = runVerifier({ ...base, digests: { 'catalog.yaml': artifactDigest } });
  assert.notEqual(result.status, 0);
});

test('rejects digest mismatch', () => {
  const result = runVerifier({ ...base, digests: { 'catalog.yaml': '0'.repeat(64) } });
  assert.notEqual(result.status, 0);
});

test('rejects undefined signature scheme after valid key and digest checks', () => {
  const { publicKey } = generateKeyPairSync('ed25519');
  const result = runVerifier({
    ...base,
    digests: { 'catalog.yaml': artifactDigest },
    signature: { algorithm: 'ED25519', value: 'ZmFrZQ==' },
  }, publicKey.export({ type: 'spki', format: 'pem' }));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unsupported signature algorithm/);
});
