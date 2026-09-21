import type { FastifyInstance } from 'fastify';
import { Application } from '@core/Application';
import { Container } from '@core/Container';
import { ServiceCollection } from '@core/ServiceCollection';
import { ServiceProvider } from '@core/ServiceProvider';
import { bootstrap as createFastifyApp } from '@core/app.bootstrap';
import { env, logger } from '@config';
import { prisma, redis } from '@database';
import { LoggerService } from '@services/LoggerService';
import {
  CognitiveCycleService,
  EchoInterpreter,
  NoopResponder,
  PassthroughObserver,
} from '@services/cognitive';

export class Bootstrap {
  private readonly provider: ServiceProvider;
  private readonly application: Application;
  private app: FastifyInstance | undefined;

  constructor() {
    const container = new Container();
    const services = new ServiceCollection(container);
    const cognitiveLogger = new LoggerService('CognitiveCycle');

    services
      .addSingleton(Application, new Application())
      .addSingleton(
        CognitiveCycleService,
        new CognitiveCycleService({
          observer: new PassthroughObserver(),
          interpreter: new EchoInterpreter(),
          responder: new NoopResponder(),
          logger: cognitiveLogger,
        }),
      );

    this.provider = new ServiceProvider(services.build());
    this.application = this.provider.get(Application);
  }

  public async start(): Promise<void> {
    await this.application.initialize();

    await prisma.$connect();
    this.app = await createFastifyApp();

    await this.application.start();
    await this.app.listen({ port: env.PORT, host: env.HOST });

    logger.info(`TWGT platform listening at http://${env.HOST}:${env.PORT}`);
  }

  public async stop(): Promise<void> {
    await this.app?.close();
    this.app = undefined;

    await redis.quit();
    await prisma.$disconnect();

    await this.application.stop();
  }
}
