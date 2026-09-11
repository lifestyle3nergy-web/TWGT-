import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isSupportedNodeVersion,
  parseNodeVersion,
} from '../../scripts/check-node-version.mjs';

test('node gate accepts runtimes inside >=24.0.0 <25.0.0', () => {
  for (const version of ['24.0.0', '24.19.0', '24.99.99', 'v24.19.0', '24.19.0-nightly.20260101']) {
    assert.equal(isSupportedNodeVersion(version), true, version);
  }
});

test('node gate rejects runtimes outside >=24.0.0 <25.0.0', () => {
  for (const version of [
    '23.11.0',
    '22.22.3',
    '25.0.0',
    // Strict semver would place a next-major pre-release inside `<25.0.0`;
    // the gate rejects it deliberately so no future-major runtime can
    // produce a passing verification result.
    '25.0.0-nightly.1',
    '26.4.0',
  ]) {
    assert.equal(isSupportedNodeVersion(version), false, version);
  }
});

test('node gate fails closed on malformed versions', () => {
  for (const version of ['', 'not-a-version', '24', '24.19', 'x.y.z', null, undefined, 24]) {
    assert.equal(isSupportedNodeVersion(version), false, String(version));
  }
});

test('parser exposes the numeric components it admitted', () => {
  assert.deepEqual(parseNodeVersion('v24.19.0-nightly.1'), {
    major: 24,
    minor: 19,
    patch: 0,
  });
  assert.equal(parseNodeVersion('garbage'), null);
  assert.equal(parseNodeVersion(undefined), null);
});

test('the running verification runtime satisfies the declared contract', () => {
  // The pretest lifecycle gate already refused to start this suite under an
  // unsupported runtime; this asserts the same predicate for the live value.
  assert.equal(isSupportedNodeVersion(process.versions.node), true);
});
