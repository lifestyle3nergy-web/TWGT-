#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const excluded = new Set(['.git', 'node_modules', 'dist', 'coverage', 'build']);
const allowed = [
  { prefix: `src${path.sep}`, classification: 'application' },
  { prefix: `tests${path.sep}`, classification: 'tests' },
  { prefix: 'vitest.config.ts', classification: 'tooling' },
  { prefix: 'prisma.config.ts', classification: 'tooling' },
  { prefix: `twgt-dashboard${path.sep}`, classification: 'prototype' },
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (excluded.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(absolute));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(path.relative(root, absolute));
    }
  }

  return files;
}

const executableSources = walk(root);
const unclassified = executableSources.filter((file) => {
  const normalized = file.replaceAll(path.sep, '/');

  return !allowed.some(({ prefix }) => {
    const candidate = prefix.replaceAll(path.sep, '/');
    return normalized === candidate || normalized.startsWith(candidate);
  });
});

if (unclassified.length > 0) {
  console.error('Unclassified TypeScript/TSX surfaces detected:');
  for (const file of unclassified) console.error(` - ${file}`);
  process.exit(1);
}

console.log(
  `Source-boundary validation passed: ${executableSources.length} TypeScript/TSX files classified.`,
);
