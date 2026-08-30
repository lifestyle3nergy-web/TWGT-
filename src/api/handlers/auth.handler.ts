import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '@auth/auth.service';
import { z } from 'zod';
import { logger } from '@config';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthHandler {
  constructor(private authService: AuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = registerSchema.parse(request.body);
      const result = await this.authService.register(body);
      reply.status(201).send({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error }, 'Registration error');
      reply.status(400).send({
        success: false,
        error: error instanceof z.ZodError ? 'Invalid registration input' : 'Registration failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = loginSchema.parse(request.body);
      const result = await this.authService.login(body);
      reply.status(200).send({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error }, 'Login error');
      reply.status(401).send({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      reply.status(200).send({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error }, 'Me endpoint error');
      reply.status(400).send({
        success: false,
        error: 'Failed to get user',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
