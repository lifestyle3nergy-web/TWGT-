import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const distRoot = path.resolve('dist');
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const sourceRoot = path.resolve(config.config.compilerOptions.rootDir);
const baseUrl = path.resolve(config.config.compilerOptions.baseUrl || '.');
const aliases = Object.entries(config.config.compilerOptions.paths || {});

function resolveSpecifier(specifier, filePath) {
  let target;
  if (specifier.startsWith('.')) {
    target = path.resolve(path.dirname(filePath), specifier);
  } else {
    for (const [pattern, replacements] of aliases) {
      const wildcard = pattern.endsWith('*');
      const prefix = wildcard ? pattern.slice(0, -1) : pattern;
      if (wildcard ? !specifier.startsWith(prefix) : specifier !== prefix) continue;
      const suffix = wildcard ? specifier.slice(prefix.length) : '';
      const source = path.resolve(baseUrl, replacements[0].replace('*', suffix));
      const relative = path.relative(sourceRoot, source);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Alias outside source root: ${specifier}`);
      }
      target = path.resolve(distRoot, relative);
      break;
    }
    // Scoped npm packages are not TypeScript aliases.
    if (!target) return specifier;
  }
  const candidates = [target, `${target}.js`, path.join(target, 'index.js')];
  const resolved = candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!resolved) throw new Error(`Unresolved build import ${specifier} in ${filePath}`);
  const relative = path.relative(path.dirname(filePath), resolved).split(path.sep).join('/');
  return relative.startsWith('.') ? relative : `./${relative}`;
}

function rewriteFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const ast = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const edits = [];
  function visit(node) {
    const literal = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      ? node.moduleSpecifier
      : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
        ? node.arguments[0] : undefined;
    if (literal && ts.isStringLiteral(literal)) {
      const replacement = resolveSpecifier(literal.text, filePath);
      if (replacement !== literal.text) edits.push([literal.getStart(ast), literal.end, JSON.stringify(replacement)]);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  let result = source;
  for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0])) {
    result = result.slice(0, start) + replacement + result.slice(end);
  }
  if (result !== source) fs.writeFileSync(filePath, result);
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filePath);
    else if (entry.isFile() && filePath.endsWith('.js')) rewriteFile(filePath);
  }
}

walk(distRoot);
console.log('Resolved internal and relative imports in dist/.');
