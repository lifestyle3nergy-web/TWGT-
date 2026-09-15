import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const git = (cwd, args, env = {}) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, ...env } }).trim();

const validator = readFileSync(
  new URL('./validate-repository-contract.mjs', import.meta.url),
  'utf8',
);

test('PR synthetic merge checkout does not require a three-dot merge base', () => {
  const root = mkdtempSync(join(tmpdir(), 'twgt-contract-'));
  const remote = join(root, 'remote.git');
  const work = join(root, 'work');
  const runner = join(root, 'runner');

  try {
    git(root, ['init', '--bare', remote]);
    git(root, ['clone', remote, work]);
    git(work, ['config', 'user.email', 'test@example.invalid']);
    git(work, ['config', 'user.name', 'TWGT test']);

    writeFileSync(join(work, 'package.json'), '{"name":"fixture"}\n');
    writeFileSync(join(work, 'validator.mjs'), validator);
    git(work, ['add', '.']);
    git(work, ['commit', '-m', 'base']);
    git(work, ['branch', '-M', 'main']);
    git(work, ['push', '-u', 'origin', 'main']);

    git(work, ['checkout', '-b', 'feature']);
    writeFileSync(join(work, 'feature.txt'), 'feature\n');
    git(work, ['add', 'feature.txt']);
    git(work, ['commit', '-m', 'feature']);
    const feature = git(work, ['rev-parse', 'HEAD']);

    git(work, ['checkout', 'main']);
    writeFileSync(join(work, 'base.txt'), 'base moved\n');
    git(work, ['add', 'base.txt']);
    git(work, ['commit', '-m', 'base moved']);
    git(work, ['push', 'origin', 'main']);
    const base = git(work, ['rev-parse', 'HEAD']);

    git(work, ['merge', '--no-ff', feature, '-m', 'synthetic merge']);
    const merge = git(work, ['rev-parse', 'HEAD']);
    git(work, ['push', 'origin', `${merge}:refs/pull/1/merge`]);

    git(root, ['clone', '--no-checkout', remote, runner]);
    git(runner, ['fetch', '--depth=1', 'origin', 'refs/pull/1/merge']);
    git(runner, ['checkout', '--detach', 'FETCH_HEAD']);

    // Ensure the merge parent exists as it does with actions/checkout fetch-depth: 0.
    git(runner, ['fetch', 'origin', base]);
    git(runner, ['fetch', 'origin', feature]);

    const output = execFileSync(process.execPath, ['validator.mjs'], {
      cwd: runner,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_BASE_REF: 'main' },
    });

    assert.match(output, /Repository contract validation PASSED/);
    assert.match(output, /PR files inspected:/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
