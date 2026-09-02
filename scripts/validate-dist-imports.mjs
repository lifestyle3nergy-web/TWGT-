import fs from 'node:fs';
import path from 'node:path';
import { createRequire, isBuiltin } from 'node:module';
import ts from 'typescript';

let checked = 0;
function checkFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const ast = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const require = createRequire(filePath);
  function visit(node) {
    const literal = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      ? node.moduleSpecifier
      : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
        ? node.arguments[0] : undefined;
    if (literal && ts.isStringLiteral(literal)) {
      const specifier = literal.text;
      if (specifier.startsWith('.')) {
        const target = path.resolve(path.dirname(filePath), specifier);
        if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
          throw new Error(`Unresolved relative import ${specifier} in ${filePath}`);
        }
      } else if (!isBuiltin(specifier)) {
        require.resolve(specifier);
      }
      checked += 1;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filePath);
    else if (entry.isFile() && filePath.endsWith('.js')) checkFile(filePath);
  }
}
walk(path.resolve('dist'));
console.log(`Validated ${checked} static and literal dynamic build imports (no service startup).`);
