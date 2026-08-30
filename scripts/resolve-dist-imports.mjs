import fs from 'node:fs';
import path from 'node:path';

const distRoot = path.resolve('dist');

const aliases = [
  ['@core/', 'core/'],
  ['@api/', 'api/'],
  ['@services/', 'services/'],
  ['@agents/', 'agents/'],
  ['@memory/', 'memory/'],
  ['@graph/', 'graph/'],
  ['@workflows/', 'workflows/'],
  ['@auth/', 'auth/'],
  ['@config/', 'config/'],
  ['@database/', 'database/'],
  ['@types/', 'types/'],
  ['@utils/', 'utils/'],
  ['@/', ''],
  ['@config', 'config/index'],
  ['@database', 'database/index'],
];

function resolveAlias(specifier, filePath) {
  const alias = aliases.find(([prefix]) => specifier.startsWith(prefix));
  if (!alias) return specifier;

  const [, targetPrefix] = alias;
  const suffix = specifier.startsWith(alias[0])
    ? specifier.slice(alias[0].length)
    : '';
  const target = path.join(distRoot, targetPrefix, suffix);
  const relative = path.relative(path.dirname(filePath), target).replaceAll(path.sep, '/');

  return relative.startsWith('.') ? relative : `./${relative}`;
}

function rewriteFile(filePath) {
  let source = fs.readFileSync(filePath, 'utf8');
  const original = source;

  source = source.replace(/(from\s*['"]|import\s*\(\s*['"]|export\s+[^;]*?from\s*['"])(@[^'"\s]+)(['"])/g, (_match, open, specifier, close) => {
    const rewritten = resolveAlias(specifier, filePath);
    const withExtension = /\.(?:js|mjs|cjs|json)$/.test(rewritten)
      ? rewritten
      : `${rewritten}.js`;
    return `${open}${withExtension}${close}`;
  });

  if (source !== original) fs.writeFileSync(filePath, source);
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filePath);
    else if (entry.isFile() && filePath.endsWith('.js')) rewriteFile(filePath);
  }
}

if (!fs.existsSync(distRoot)) {
  throw new Error(`Build output directory not found: ${distRoot}`);
}

walk(distRoot);
console.log('Resolved internal TypeScript aliases in dist/.');
