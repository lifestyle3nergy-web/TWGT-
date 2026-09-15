import assert from 'node:assert/strict';
import test from 'node:test';

test('OpenAI 7 exposes the TWGT SDK surfaces without network access', async () => {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({
    apiKey: 'sk-twgt-offline-contract-test',
    maxRetries: 0,
  });

  assert.equal(typeof client.responses.create, 'function');
  assert.equal(typeof client.chat.completions.create, 'function');
  assert.equal(typeof client.embeddings.create, 'function');
});
