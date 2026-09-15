import { currentTimestamp } from '@utils/time';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class LoggerService {
  private readonly serviceName: string;

  constructor(serviceName = 'TWGT') {
    this.serviceName = serviceName;
  }

  /**
   * Log debug information.
   */
  public debug(message: string): void {
    this.write(LogLevel.DEBUG, message);
  }

  /**
   * Log informational messages.
   */
  public info(message: string): void {
    this.write(LogLevel.INFO, message);
  }

  /**
   * Log warnings.
   */
  public warn(message: string): void {
    this.write(LogLevel.WARN, message);
  }

  /**
   * Log errors.
   */
  public error(message: string, error?: unknown): void {
    this.write(LogLevel.ERROR, error ? `${message} ${String(error)}` : message);
  }

  /**
   * Internal log formatter.
   */
  private write(level: LogLevel, message: string): void {
    const timestamp = currentTimestamp();

    console.log(`[${timestamp}] [${level}] [${this.serviceName}] ${message}`);
  }
}
