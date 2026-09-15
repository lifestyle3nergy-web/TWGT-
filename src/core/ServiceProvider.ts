import { Container } from '@core/Container';
import type { Constructor } from '@/types/Constructor';

export class ServiceProvider {
  constructor(private readonly container: Container) {}

  /**
   * Resolve a registered service.
   */
  public get<T>(token: Constructor<T>): T {
    return this.container.resolve(token);
  }

  /**
   * Check whether a service exists.
   */
  public has<T>(token: Constructor<T>): boolean {
    return this.container.has(token);
  }
}
