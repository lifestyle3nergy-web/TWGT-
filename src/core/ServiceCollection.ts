import { Container } from '@core/Container';
import type { Constructor } from '@/types/Constructor';

export class ServiceCollection {
  constructor(private readonly container: Container) {}

  /**
   * Register a singleton instance.
   */
  public addSingleton<T>(token: Constructor<T>, instance: T): ServiceCollection {
    this.container.register(token, instance);
    return this;
  }

  /**
   * Register multiple singleton instances.
   */
  public addSingletons(
    services: Array<{
      token: Constructor<unknown>;
      instance: unknown;
    }>,
  ): ServiceCollection {
    for (const service of services) {
      this.container.register(service.token, service.instance);
    }

    return this;
  }

  /**
   * Build the configured container.
   */
  public build(): Container {
    return this.container;
  }
}
