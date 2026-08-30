import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '@config';

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (error) {
    logger.warn({ error }, 'Auth guard failed');
    reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      timestamp: new Date().toISOString(),
    });
    return reply;
  }
}

export async function optionalAuthGuard(request: FastifyRequest) {
  try {
    await request.jwtVerify();
  } catch {
    // Optional auth - continue even if token is invalid
  }
}
