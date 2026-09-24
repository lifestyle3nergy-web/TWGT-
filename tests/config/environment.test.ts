import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ENV_KEYS = ['APP_NAME', 'APP_VERSION', 'NODE_ENV', 'PORT'] as const;

describe('environment', () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      original[key] = process.env[key];
      delete process.env[key];
    }
    vi.resetModules();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  });

  it('defaults PORT to 3000 when unset', async () => {
    const { environment } = await import('@config/environment');
    expect(environment.port).toBe(3000);
  });

  it.each(['1', '8080', '65535'])('accepts valid PORT=%s', async (value) => {
    process.env.PORT = value;
    const { environment } = await import('@config/environment');
    expect(environment.port).toBe(Number(value));
  });

  it.each(['', ' ', '  ', 'abc', '80.5', '-1', '0', '65536'])(
    'rejects invalid PORT=%j',
    async (value) => {
      process.env.PORT = value;
      await expect(import('@config/environment')).rejects.toThrow(
        'Expected an integer between 1 and 65535',
      );
    },
  );

  it('preserves the other environment defaults and overrides', async () => {
    process.env.APP_NAME = 'CustomApp';
    process.env.APP_VERSION = '9.9.9';
    process.env.NODE_ENV = 'production';
    process.env.PORT = '4321';

    const { environment } = await import('@config/environment');

    expect(environment).toEqual({
      appName: 'CustomApp',
      appVersion: '9.9.9',
      nodeEnv: 'production',
      port: 4321,
    });
  });
});
