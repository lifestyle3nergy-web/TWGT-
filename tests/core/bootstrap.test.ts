import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import http from 'node:http';

describe('Bootstrap', () => {
  const originalPort = process.env.PORT;
  const testPort = 34568;

  beforeEach(() => {
    process.env.PORT = String(testPort);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.resetModules();
  });

  afterEach(() => {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
    vi.restoreAllMocks();
  });

  it('stops the application when server startup fails', async () => {
    const blocker = http.createServer();
    await new Promise<void>((resolve) => blocker.listen(testPort, resolve));

    const { Bootstrap } = await import('@core/Bootstrap');
    const bootstrap = new Bootstrap();

    try {
      await expect(bootstrap.start()).rejects.toMatchObject({ code: 'EADDRINUSE' });

      expect(console.log).toHaveBeenCalledWith('Starting TWGT platform...');
      expect(console.log).toHaveBeenCalledWith('Stopping TWGT platform...');
      expect(console.log).not.toHaveBeenCalledWith('TWGT platform is running.');
    } finally {
      await new Promise<void>((resolve, reject) =>
        blocker.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
