import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const runModule = (source) =>
  spawnSync(process.execPath, ['--input-type=module', '--eval', source], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 15_000,
  });

test('Pino 10 emits structured JSON and serializes errors', () => {
  const result = runModule(`
    import pino from 'pino';
    const logger = pino({ level: 'info' });
    logger.error({ err: new Error('boom'), requestId: 'request-1' }, 'failed');
    logger.flush();
  `);

  assert.equal(result.status, 0, result.stderr);
  const record = JSON.parse(result.stdout.trim());
  assert.equal(record.level, 50);
  assert.equal(record.msg, 'failed');
  assert.equal(record.requestId, 'request-1');
  assert.equal(record.err.message, 'boom');
});

test('Pino 10 preserves redaction behavior', () => {
  const result = runModule(`
    import pino from 'pino';
    const logger = pino({ redact: ['token'] });
    logger.info({ token: 'must-not-leak', safe: 'visible' }, 'redaction');
    logger.flush();
  `);

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /must-not-leak/);
  assert.match(result.stdout, /"token":"\[Redacted\]"/);
  assert.match(result.stdout, /"safe":"visible"/);
});

test('Pino 10 transport starts, flushes and exits cleanly', () => {
  const result = runModule(`
    import pino from 'pino';
    const logger = pino({
      transport: {
        target: 'pino-pretty',
        options: { colorize: false, singleLine: true }
      }
    });
    logger.info({ requestId: 'request-2' }, 'transport-ready');
    const transport = logger[pino.symbols.streamSym];
    await new Promise((resolve, reject) => {
      transport.once('error', reject);
      transport.once('close', resolve);
      transport.end();
    });
  `);

  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /transport-ready/);
  assert.match(result.stdout, /request-2/);
});

test('Fastify uses Pino 10 through a request and bounded close', () => {
  const result = runModule(`
    import Fastify from 'fastify';
    const app = Fastify({ logger: { level: 'info' } });
    app.get('/smoke', async () => ({ ok: true }));
    const response = await app.inject({ method: 'GET', url: '/smoke' });
    if (response.statusCode !== 200 || response.json().ok !== true) process.exit(2);
    await app.close();
  `);

  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /request completed/);
});
