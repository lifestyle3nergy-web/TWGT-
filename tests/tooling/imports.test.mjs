import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../../', import.meta.url));
function fixture(t, source) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'twgt-imports-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'dist/config'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { rootDir: 'src', baseUrl: '.', paths: { '@config': ['src/config'], '@/*': ['src/*'] } },
  }));
  fs.writeFileSync(path.join(directory, 'dist/config/index.js'), 'export const value = 1;');
  fs.writeFileSync(path.join(directory, 'dist/helper.js'), 'export const helper = 2;');
  fs.writeFileSync(path.join(directory, 'dist/index.js'), source);
  return directory;
}
function run(script, cwd) {
  return spawnSync(process.execPath, [path.join(root, 'scripts', script)], { cwd, encoding: 'utf8' });
}

test('resolver preserves scoped packages and handles aliases, reexports and dynamic imports', t => {
  const directory = fixture(t, `import prisma from '@prisma/client';
import cors from '@fastify/cors';
import untouched from '@config-extra/package';
import { value } from '@config';
export { helper } from './helper';
import './config';
const later = import('@/helper');
const example = "from '@prisma/client'";
`);
  const result = run('resolve-dist-imports.mjs', directory);
  assert.equal(result.status, 0, result.stderr);
  const output = fs.readFileSync(path.join(directory, 'dist/index.js'), 'utf8');
  assert.match(output, /from '@prisma\/client'/);
  assert.match(output, /from '@fastify\/cors'/);
  assert.match(output, /from '@config-extra\/package'/);
  assert.match(output, /from "\.\/config\/index.js"/);
  assert.match(output, /from "\.\/helper.js"/);
  assert.match(output, /import "\.\/config\/index.js"/);
  assert.match(output, /import\("\.\/helper.js"\)/);
  assert.match(output, /"from '@prisma\/client'"/);
  assert.equal(run('resolve-dist-imports.mjs', directory).status, 0);
  assert.equal(fs.readFileSync(path.join(directory, 'dist/index.js'), 'utf8'), output);
});

test('resolver fails on a missing internal import', t => {
  const directory = fixture(t, "import './missing';");
  const result = run('resolve-dist-imports.mjs', directory);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unresolved build import/);
});

test('validator rejects extensionless imports even when Node CommonJS resolution would find them', t => {
  const directory = fixture(t, "export { helper } from './helper';");
  assert.notEqual(run('validate-dist-imports.mjs', directory).status, 0);
  assert.equal(run('resolve-dist-imports.mjs', directory).status, 0);
  const result = run('validate-dist-imports.mjs', directory);
  assert.equal(result.status, 0, result.stderr);
});

test('validator rejects unresolved scoped packages', t => {
  const directory = fixture(t, "import value from '@twgt-nonexistent/package.js';");
  assert.notEqual(run('validate-dist-imports.mjs', directory).status, 0);
});
