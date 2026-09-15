import type { Constructor } from '@/types/Constructor';

/**
 * Type-safe registry that maps a service constructor to its singleton
 * instance. Shared by the dependency-injection container and the service
 * registry to avoid duplicating the underlying storage and error handling.
 */
export class ServiceMap {
  private readonly services = new Map<Constructor<unknown>, unknown>();

  /**
   * Register a service instance for a token.
   */
  public register<T>(token: Constructor<T>, instance: T): void {
    if (this.services.has(token)) {
      throw new Error(`Service "${token.name}" is already registered.`);
    }

    this.services.set(token, instance);
  }

  /**
   * Resolve a registered service instance.
   */
  public resolve<T>(token: Constructor<T>): T {
    const service = this.services.get(token);

    if (!service) {
      throw new Error(`Service "${token.name}" is not registered.`);
    }

    return service as T;
  }

  /**
   * Check whether a service is registered.
   */
  public has<T>(token: Constructor<T>): boolean {
    return this.services.has(token);
  }

  /**
   * Remove a registered service.
   */
  public unregister<T>(token: Constructor<T>): boolean {
    return this.services.delete(token);
  }

  /**
   * List all registered service tokens.
   */
  public keys(): Constructor<unknown>[] {
    return Array.from(this.services.keys());
  }

  /**
   * Remove all registered services.
   */
  public clear(): void {
    this.services.clear();
  }
}
