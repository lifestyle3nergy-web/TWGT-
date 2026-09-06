import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const run = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const files = run(['ls-files']).split('\n').filter(Boolean);
const errors = [];

const forbiddenPathPatterns = [
  /(^|\/)node_modules\//,
  /(^|\/)\.env($|\.)/,
  /(^|\/)(id_rsa|id_ed25519)(\.|$)/,
  /\.(pem|key|p12|pfx)$/i,
];

for (const file of files) {
  if (forbiddenPathPatterns.some((pattern) => pattern.test(file))) {
    errors.push(`Forbidden tracked path: ${file}`);
  }
}

for (const file of files.filter((file) => /\.json$/i.test(file))) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`Invalid JSON: ${file} (${error.message})`);
  }
}

const topLevel = new Set(files.map((file) => file.split('/')[0]).filter(Boolean));
const baselineTopLevel = new Set([
  '.github',
  '.gitignore',
  '.gitattributes',
  '.editorconfig',
  '.env.example',
  '.nvmrc',
  '.prettierignore',
  '.prettierrc',
  'ARCHITECTURE.md',
  'CHANGELOG.md',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'README.md',
  'REPO-CONTRACT.md',
  'ROADMAP.md',
  'SECURITY.md',
  'VISION.md',
  'activation',
  'cli',
  'dashboard',
  'docs',
  'package-lock.json',
  'package.json',
  'prisma',
  'scripts',
  'src',
  'tests',
  'tsconfig.json',
]);

for (const entry of topLevel) {
  if (!baselineTopLevel.has(entry)) {
    errors.push(`Unapproved top-level entry: ${entry}`);
  }
}

const baseRef = process.env.GITHUB_BASE_REF;
let changed = [];
if (baseRef) {
  try {
    run(['fetch', '--no-tags', '--depth=1', 'origin', baseRef]);
  } catch {
    // The workflow uses fetch-depth: 0, but keep the validator useful locally.
  }
  try {
    changed = run(['diff', '--name-only', `origin/${baseRef}...HEAD`])
      .split('\n')
      .filter(Boolean);
  } catch {
    errors.push(`Unable to determine PR diff against origin/${baseRef}`);
  }
}

const structuralTriggers = [
  /^REPO-CONTRACT\.md$/,
  /^docs\/adr\//,
  /^docs\/governance\//,
  /^docs\/ecosystem-map\.md$/,
  /^activation\//,
  /^package\.json$/,
  /^tsconfig(?:\..*)?\.json$/,
  /^src\/index\./,
  /^\.github\/workflows\//,
];

if (changed.length > 0) {
  const requiresAdr = changed.some((path) => structuralTriggers.some((pattern) => pattern.test(path)));
  const hasAdr = changed.some((path) => /^docs\/adr\/\d{4}-.+\.md$/.test(path));
  if (requiresAdr && !hasAdr) {
    errors.push('Protected structural change detected without a numbered ADR in docs/adr/.');
  }
}

const activationRoot = 'activation';
if (existsSync(activationRoot)) {
  const allowed = new Set(['config', 'schemas', 'prompts', 'protocols', 'scripts', 'state', 'evidence', 'README.md']);
  for (const entry of readdirSync(activationRoot)) {
    if (!allowed.has(entry)) errors.push(`Activation boundary violation: activation/${entry}`);
  }
}

if (errors.length) {
  console.error('Repository contract validation FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Repository contract validation PASSED');
console.log(`Tracked files inspected: ${files.length}`);
if (changed.length) console.log(`PR files inspected: ${changed.length}`);
