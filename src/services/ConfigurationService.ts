export class ConfigurationService {
  private readonly values: Map<string, string>;

  constructor() {
    this.values = new Map();

    this.loadEnvironment();
  }

  /**
   * Load environment variables.
   */
  private loadEnvironment(): void {
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        this.values.set(key, value);
      }
    }
  }

  /**
   * Retrieve a configuration value.
   */
  public get(key: string): string | undefined {
    return this.values.get(key);
  }

  /**
   * Retrieve a required configuration value.
   */
  public require(key: string): string {
    const value = this.values.get(key);

    if (!value) {
      throw new Error(`Required configuration "${key}" is missing.`);
    }

    return value;
  }

  /**
   * Check configuration availability.
   */
  public has(key: string): boolean {
    return this.values.has(key);
  }

  /**
   * Get all configuration keys.
   */
  public keys(): string[] {
    return Array.from(this.values.keys());
  }
}
