import { describe, expect, it } from 'vitest';

process.env.DATABASE_URL ??= 'postgresql://postgres:password@localhost:5432/twgt_test';
process.env.NEO4J_PASSWORD ??= 'test-password';
process.env.JWT_SECRET ??= 'test-jwt-secret-with-at-least-32-characters';
process.env.REFRESH_SECRET ??= 'test-refresh-secret-with-at-least-32-characters';

describe('Fastify application', () => {
  it('serves the health endpoint through the authoritative bootstrap', async () => {
    const { bootstrap } = await import('@core/app.bootstrap');
    const app = await bootstrap();

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.json()).toMatchObject({
        status: 'ok',
      });
    } finally {
      await app.close();
    }
  });
});
