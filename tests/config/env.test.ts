import { describe, expect, it } from 'vitest';

const requiredEnv = {
  DATABASE_URL: 'postgresql://localhost:5432/twgt_dev',
  NEO4J_PASSWORD: 'neo4j-test-password',
  JWT_SECRET: 'j'.repeat(32),
  REFRESH_SECRET: 'r'.repeat(32),
};

// env.ts validates process.env at module load, so provide only the required
// baseline values before importing the parser under test.
Object.assign(process.env, requiredEnv);
const { parseEnv } = await import('../../src/config/env.js');

describe('parseEnv', () => {
  it('applies Zod 4-compatible defaults and transforms', () => {
    const env = parseEnv(requiredEnv);

    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_POOL_MIN).toBe(2);
    expect(env.DATABASE_POOL_MAX).toBe(10);
    expect(env.REDIS_TTL).toBe(300);
    expect(env.RATE_LIMIT_WINDOW).toBe(60000);
    expect(env.RATE_LIMIT_MAX).toBe(100);
    expect(env.ENABLE_TELEMETRY).toBe(true);
    expect(env.ENABLE_MONITORING).toBe(true);
    expect(env.CORS_CREDENTIALS).toBe(true);
  });

  it('parses numeric and boolean environment strings', () => {
    const env = parseEnv({
      ...requiredEnv,
      PORT: '8080',
      DATABASE_POOL_MIN: '1',
      DATABASE_POOL_MAX: '20',
      REDIS_TTL: '900',
      RATE_LIMIT_WINDOW: '120000',
      RATE_LIMIT_MAX: '250',
      ENABLE_TELEMETRY: 'false',
      ENABLE_MONITORING: 'false',
      CORS_CREDENTIALS: 'false',
    });

    expect(env.PORT).toBe(8080);
    expect(env.DATABASE_POOL_MIN).toBe(1);
    expect(env.DATABASE_POOL_MAX).toBe(20);
    expect(env.REDIS_TTL).toBe(900);
    expect(env.RATE_LIMIT_WINDOW).toBe(120000);
    expect(env.RATE_LIMIT_MAX).toBe(250);
    expect(env.ENABLE_TELEMETRY).toBe(false);
    expect(env.ENABLE_MONITORING).toBe(false);
    expect(env.CORS_CREDENTIALS).toBe(false);
  });

  it('preserves rejection of invalid numeric input', () => {
    expect(() =>
      parseEnv({
        ...requiredEnv,
        PORT: 'not-a-number',
      }),
    ).toThrow();
  });

  it('preserves required credential validation', () => {
    expect(() =>
      parseEnv({
        DATABASE_URL: '',
        NEO4J_PASSWORD: '',
        JWT_SECRET: 'short',
        REFRESH_SECRET: 'short',
      }),
    ).toThrow();
  });
});
