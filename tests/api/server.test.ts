import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import http from 'node:http';
import net from 'node:net';

const isPortAccepting = (port: number): Promise<boolean> =>
  new Promise((resolve, reject) => {
    const socket = net
      .connect({ port, host: '127.0.0.1' })
      .once('connect', () => {
        socket.destroy();
        resolve(true);
      })
      .once('error', (error: NodeJS.ErrnoException) => {
        socket.destroy();
        if (error.code === 'ECONNREFUSED') {
          resolve(false);
        } else {
          reject(error);
        }
      });
  });

const waitFor = async (
  predicate: () => Promise<boolean>,
  { attempts = 50, delayMs = 20 } = {},
): Promise<boolean> => {
  for (let i = 0; i < attempts; i += 1) {
    if (await predicate()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
};

const getJson = (
  port: number,
): Promise<{ status: number; contentType: string | undefined; body: string }> =>
  new Promise((resolve, reject) => {
    http
      .get('http://127.0.0.1:' + port, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            contentType: res.headers['content-type'],
            body: data,
          }),
        );
      })
      .on('error', reject);
  });

describe('Server', () => {
  const originalPort = process.env.PORT;
  const testPort = 34567;

  beforeEach(() => {
    process.env.PORT = String(testPort);
    vi.resetModules();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
    vi.restoreAllMocks();
  });

  it('starts and serves the health endpoint', async () => {
    const { Server } = await import('@api/server');
    const server = new Server();

    await server.start();

    try {
      expect(await waitFor(() => isPortAccepting(testPort))).toBe(true);
      const { status, contentType, body } = await getJson(testPort);

      expect(status).toBe(200);
      expect(contentType).toContain('application/json');
      expect(JSON.parse(body)).toEqual({
        status: 'ok',
        application: 'TWGT',
        version: '0.2.0-alpha',
      });
    } finally {
      await server.stop();
    }
  });

  it('supports stop then start without accumulating error listeners', async () => {
    const { Server } = await import('@api/server');
    const server = new Server();

    const initialErrorListeners = (
      server as unknown as { server: http.Server }
    ).server.listenerCount('error');

    await server.start();
    const runningErrorListeners = (
      server as unknown as { server: http.Server }
    ).server.listenerCount('error');

    await server.stop();
    await server.start();
    const restartedErrorListeners = (
      server as unknown as { server: http.Server }
    ).server.listenerCount('error');

    try {
      expect(runningErrorListeners).toBe(initialErrorListeners);
      expect(restartedErrorListeners).toBe(initialErrorListeners);
    } finally {
      await server.stop();
    }
  });

  it('rejects startup when the port is already occupied and removes the startup listener', async () => {
    const blocker = http.createServer();
    await new Promise<void>((resolve) => blocker.listen(testPort, resolve));

    const { Server } = await import('@api/server');
    const server = new Server();

    const initialListeningListeners = (
      server as unknown as { server: http.Server }
    ).server.listenerCount('listening');
    const initialErrorListeners = (
      server as unknown as { server: http.Server }
    ).server.listenerCount('error');

    try {
      await expect(server.start()).rejects.toMatchObject({ code: 'EADDRINUSE' });

      const nativeServer = (server as unknown as { server: http.Server }).server;
      expect(nativeServer.listenerCount('listening')).toBe(initialListeningListeners);
      expect(nativeServer.listenerCount('error')).toBe(initialErrorListeners);
    } finally {
      await server.stop();
      await new Promise<void>((resolve, reject) =>
        blocker.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it('returns a controlled 500 when the health handler throws', async () => {
    const { Server } = await import('@api/server');
    const server = new Server(() => {
      throw new Error('health failure');
    });
    await server.start();
    expect(await waitFor(() => isPortAccepting(testPort))).toBe(true);

    try {
      const { status, body } = await getJson(testPort);
      expect(status).toBe(500);
      expect(JSON.parse(body)).toEqual({ error: 'Internal Server Error' });
      expect(console.error).toHaveBeenCalled();
    } finally {
      await server.stop();
    }
  });

  it('waits for startup failure before completing stop', async () => {
    const blocker = http.createServer();
    await new Promise<void>((resolve) => blocker.listen(testPort, resolve));

    const { Server } = await import('@api/server');
    const server = new Server();

    try {
      const startPromise = server.start();

      expect((server as unknown as { state: string }).state).toBe('starting');

      await expect(server.stop()).resolves.toBeUndefined();
      await expect(startPromise).rejects.toMatchObject({ code: 'EADDRINUSE' });
      expect((server as unknown as { state: string }).state).toBe('stopped');
    } finally {
      await new Promise<void>((resolve, reject) =>
        blocker.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it('shares concurrent stop calls while shutdown is in progress', async () => {
    const { Server } = await import('@api/server');
    const server = new Server();

    await server.start();

    try {
      const firstStop = server.stop();
      const secondStop = server.stop();

      await expect(Promise.all([firstStop, secondStop])).resolves.toEqual([
        undefined,
        undefined,
      ]);
      expect((server as unknown as { state: string }).state).toBe('stopped');
    } finally {
      await server.stop();
    }
  });

  it('logs runtime server errors but suppresses them during shutdown', async () => {
    const { Server } = await import('@api/server');
    const server = new Server();
    const nativeServer = (
      server as unknown as { server: http.Server }
    ).server;

    await server.start();

    try {
      const runtimeError = new Error('runtime failure');
      nativeServer.emit('error', runtimeError);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] [Server] Server error.'),
      );

      vi.mocked(console.error).mockClear();

      const stopPromise = server.stop();
      await stopPromise;

      nativeServer.emit('error', new Error('shutdown failure'));

      expect(console.error).not.toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] [Server] Server error.'),
      );
    } finally {
      await server.stop();
    }
  });

  it('rejects an invalid lifecycle transition deterministically', async () => {
    const { Server } = await import('@api/server');
    const server = new Server();

    await expect(server.stop()).resolves.toBeUndefined();
    await server.start();

    try {
      await expect(server.start()).rejects.toThrow(
        'Cannot start server while state is "running".',
      );
      await expect(server.stop()).resolves.toBeUndefined();
      await expect(server.stop()).resolves.toBeUndefined();
    } finally {
      await server.stop();
    }
  });
});
