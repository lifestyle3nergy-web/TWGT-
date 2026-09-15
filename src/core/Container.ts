import type { Constructor } from '@/types/Constructor';
import { ServiceMap } from '@utils/ServiceMap';

export class Container {
  private readonly services = new ServiceMap();

  /**
   * Register a singleton service.
   */
  public register<T>(token: Constructor<T>, instance: T): void {
    this.services.register(token, instance);
  }

  /**
   * Resolve a registered service.
   */
  public resolve<T>(token: Constructor<T>): T {
    return this.services.resolve(token);
  }

  /**
   * Check if a service is registered.
   */
  public has<T>(token: Constructor<T>): boolean {
    return this.services.has(token);
  }

  /**
   * Remove a service.
   */
  public unregister<T>(token: Constructor<T>): boolean {
    return this.services.unregister(token);
  }

  /**
   * Remove all registered services.
   */
  public clear(): void {
    this.services.clear();
  }
}
