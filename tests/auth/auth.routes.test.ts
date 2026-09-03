import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters';

vi.mock('@database', () => ({
  prisma: {},
}));

vi.mock('@config', () => ({
  env: {
    JWT_SECRET,
    REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-characters',
    JWT_EXPIRY: '1h',
    REFRESH_EXPIRY: '7d',
  },
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('authentication routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    app = Fastify();
    await app.register(fastifyJwt, { secret: JWT_SECRET });

    const { authRoutes } = await import('@api/routes/auth.routes');
    await authRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  it('rejects /auth/me without a bearer token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      success: false,
      error: 'Unauthorized',
    });
  });

  it('rejects /auth/me with an invalid bearer token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      success: false,
      error: 'Unauthorized',
    });
  });

  it('returns the verified JWT identity from /auth/me', async () => {
    const identity = {
      userId: 'user-123',
      email: 'kaitiaki@example.test',
      role: 'user',
    };
    const token = app.jwt.sign(identity);

    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      success: true,
      data: identity,
    });
  });
});
