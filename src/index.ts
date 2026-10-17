import { Bootstrap } from '@core/Bootstrap';
import { logger } from '@config';

const runtime = new Bootstrap();

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    await runtime.stop();
  } catch (error) {
    logger.error({ error }, 'Failed to shut down cleanly');
    process.exit(1);
  }

  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

runtime.start().catch((error) => {
  logger.error({ error }, 'Fatal application startup error');
  process.exit(1);
});
