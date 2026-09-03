import assert from 'node:assert/strict';
import test from 'node:test';
import postcss from 'postcss';

test('PostCSS parses and transforms representative TWGT styles', async () => {
  const visited = [];

  const result = await postcss([
    {
      postcssPlugin: 'twgt-postcss-regression',
      Once(root) {
        root.walkRules((rule) => {
          visited.push(rule.selector);
          rule.selector = postcss.list.comma(rule.selector).join(', ');
        });
        root.walkDecls('color', (declaration) => {
          declaration.value = declaration.value.toUpperCase();
        });
      },
    },
  ]).process(
    '.kaitiaki,.twgt { color: green; --status: ready; } @media (width > 40rem) { .twgt { display: grid; } }',
    { from: undefined },
  );

  assert.deepEqual(visited, ['.kaitiaki,.twgt', '.twgt']);
  assert.match(result.css, /\.kaitiaki, \.twgt/);
  assert.match(result.css, /color: GREEN/);
  assert.match(result.css, /--status: ready/);
  assert.match(result.css, /@media \(width > 40rem\)/);
});

test('PostCSS list helpers preserve functional values and empty segments', () => {
  assert.deepEqual(postcss.list.comma('alpha, beta, var(--fallback, gamma)'), [
    'alpha',
    'beta',
    'var(--fallback, gamma)',
  ]);
  assert.deepEqual(postcss.list.space('grid  minmax(0, 1fr)'), ['grid', 'minmax(0, 1fr)']);
});
