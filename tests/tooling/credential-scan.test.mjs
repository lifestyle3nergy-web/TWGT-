import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const scanner = new URL('../../scripts/scan-credential-signatures.sh', import.meta.url);

function run(cwd, command, args = []) {
  return spawnSync(command, args, { cwd, encoding: 'utf8' });
}

test('credential scan detects tracked signatures and excludes synthetic fixtures', async () => {
  const root = await mkdtemp(join(tmpdir(), 'twgt-credential-scan-'));
  await mkdir(join(root, 'scripts'), { recursive: true });
  await mkdir(join(root, 'tests/fixtures'), { recursive: true });
  await cp(scanner, join(root, 'scripts/scan-credential-signatures.sh'));
  await writeFile(join(root, 'safe.txt'), 'no credentials here\n');
  await writeFile(join(root, 'tests/fixtures/synthetic.txt'), `ghp_${'A'.repeat(30)}\n`);
  assert.equal(run(root, 'git', ['init', '-q']).status, 0);
  assert.equal(run(root, 'git', ['add', '.']).status, 0);
  assert.equal(run(root, 'bash', ['scripts/scan-credential-signatures.sh']).status, 0);

  await writeFile(join(root, 'leaked.txt'), `api_key=ghp_${'B'.repeat(30)}\n`);
  assert.equal(run(root, 'git', ['add', 'leaked.txt']).status, 0);
  const detected = run(root, 'bash', ['scripts/scan-credential-signatures.sh']);
  assert.equal(detected.status, 1);
  assert.match(`${detected.stdout}${detected.stderr}`, /Credential signature detected/);
});
