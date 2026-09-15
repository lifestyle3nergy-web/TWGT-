import { Application } from '@core/Application';
import { Container } from '@core/Container';
import { ServiceCollection } from '@core/ServiceCollection';
import { ServiceProvider } from '@core/ServiceProvider';
import { Server } from '@api/server';
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
  private readonly server: Server;

  constructor() {
    const container = new Container();

    const services = new ServiceCollection(container);

    const cognitiveLogger = new LoggerService('CognitiveCycle');

    services
      .addSingleton(Application, new Application())
      .addSingleton(Server, new Server())
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
    this.server = this.provider.get(Server);
  }

  public async start(): Promise<void> {
    console.log('Bootstrapping TWGT platform...');

    await this.application.initialize();
    await this.application.start();

    this.server.start();

    console.log('TWGT platform is running.');
  }

  public async stop(): Promise<void> {
    this.server.stop();
    await this.application.stop();
  }
}
