import { describe, expect, it } from 'vitest';

process.env.DATABASE_URL ??= 'postgresql://postgres:password@localhost:5432/twgt_test';
process.env.NEO4J_PASSWORD ??= 'test-password';
process.env.JWT_SECRET ??= 'test-jwt-secret-with-at-least-32-characters';
process.env.REFRESH_SECRET ??= 'test-refresh-secret-with-at-least-32-characters';

describe('Bootstrap', () => {
  it('constructs without throwing', async () => {
    const { Bootstrap } = await import('@core/Bootstrap');
    expect(() => new Bootstrap()).not.toThrow();
  });
});
