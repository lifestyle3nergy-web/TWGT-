import fastifyJwt from '@fastify/jwt';
import Fastify from 'fastify';
import { nanoid } from 'nanoid';
import postcss, { type Plugin } from 'postcss';
import { afterEach, describe, expect, it } from 'vitest';

const apps: Array<ReturnType<typeof Fastify>> = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map(app => app.close()));
});

describe('runtime dependency security regressions', () => {
  it('preserves authenticated access and rejects missing credentials', async () => {
    const app = Fastify();
    apps.push(app);

    await app.register(fastifyJwt, {
      secret: 'test-only-jwt-secret-with-at-least-32-characters',
    });
    app.get('/auth/me', {
      preHandler: async request => request.jwtVerify(),
      handler: async request => ({ user: request.user }),
    });

    const unauthorized = await app.inject({ method: 'GET', url: '/auth/me' });
    expect(unauthorized.statusCode).toBe(401);

    const token = app.jwt.sign({ sub: 'security-regression-user' });
    const authorized = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(authorized.statusCode).toBe(200);
    expect(authorized.json()).toMatchObject({
      user: { sub: 'security-regression-user' },
    });
  });

  it('keeps static and parameterized Fastify routes distinct', async () => {
    const app = Fastify();
    apps.push(app);

    app.get('/projects/new', async () => ({ route: 'new' }));
    app.get<{ Params: { projectId: string } }>('/projects/:projectId', async request => ({
      projectId: request.params.projectId,
      route: 'project',
    }));

    const staticRoute = await app.inject({ method: 'GET', url: '/projects/new' });
    const parameterRoute = await app.inject({ method: 'GET', url: '/projects/project-123' });

    expect(staticRoute.statusCode).toBe(200);
    expect(staticRoute.json()).toEqual({ route: 'new' });
    expect(parameterRoute.statusCode).toBe(200);
    expect(parameterRoute.json()).toEqual({
      projectId: 'project-123',
      route: 'project',
    });
  });

  it('generates Nano IDs with the expected format and collision resistance', () => {
    const ids = Array.from({ length: 256 }, () => nanoid());

    expect(new Set(ids)).toHaveLength(ids.length);
    for (const id of ids) {
      expect(id).toHaveLength(21);
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it('runs PostCSS transformations without corrupting declarations', async () => {
    const prefixDisplay: Plugin = {
      postcssPlugin: 'security-regression-prefix-display',
      Declaration(declaration) {
        if (declaration.prop === 'display') {
          declaration.cloneBefore({ prop: '-webkit-display' });
        }
      },
    };

    const result = await postcss([prefixDisplay]).process('.card { display: grid; color: red; }', {
      from: undefined,
    });

    expect(result.css).toContain('-webkit-display: grid');
    expect(result.css).toContain('display: grid');
    expect(result.css).toContain('color: red');
    expect(result.warnings()).toEqual([]);
  });
});
