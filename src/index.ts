import type { FastifyInstance } from 'fastify';
import { bootstrap } from '@core/app.bootstrap';
import { env, logger } from '@config';
import { prisma, redis } from '@database';

let app: FastifyInstance | undefined;

async function main() {
  try {
    logger.info('🚀 Starting TWGT Platform');

    logger.info('📦 Connecting to database...');
    await prisma.$connect();
    logger.info('✅ Database connected');

    const server = await bootstrap();
    app = server;

    await server.listen({ port: env.PORT, host: env.HOST });
    logger.info(`✅ Server listening at http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    logger.error({ error }, '❌ Application startup failed');
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    await app?.close();
  } catch (error) {
    logger.error({ error }, 'Failed to close application server');
  }

  try {
    await redis.quit();
  } catch (error) {
    logger.error({ error }, 'Failed to close Redis connection');
  }

  try {
    await prisma.$disconnect();
  } catch (error) {
    logger.error({ error }, 'Failed to disconnect database');
  }

  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

main().catch((error) => {
  logger.error({ error }, 'Fatal application error');
  process.exit(1);
});
