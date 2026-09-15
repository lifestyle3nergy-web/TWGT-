import type { Constructor } from '@/types/Constructor';
import { ServiceMap } from '@utils/ServiceMap';

export class ServiceRegistry {
  private readonly services = new ServiceMap();

  /**
   * Register a service.
   */
  public register<T>(token: Constructor<T>, instance: T): void {
    this.services.register(token, instance);
  }

  /**
   * Retrieve a service.
   */
  public get<T>(token: Constructor<T>): T {
    return this.services.resolve(token);
  }

  /**
   * Check service availability.
   */
  public has<T>(token: Constructor<T>): boolean {
    return this.services.has(token);
  }

  /**
   * List registered services.
   */
  public list(): Constructor<unknown>[] {
    return this.services.keys();
  }

  /**
   * Clear registry.
   */
  public clear(): void {
    this.services.clear();
  }
}
