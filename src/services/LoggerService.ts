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

  public debug(message: string): void {
    this.write(LogLevel.DEBUG, message);
  }

  public info(message: string): void {
    this.write(LogLevel.INFO, message);
  }

  public warn(message: string): void {
    this.write(LogLevel.WARN, message);
  }

  public error(message: string, error?: unknown): void {
    const details = LoggerService.describeError(error);

    this.write(
      LogLevel.ERROR,
      details ? `${message} ${details}` : message,
    );
  }

  private static describeError(error: unknown): string | undefined {
    if (error === undefined || error === null) {
      return undefined;
    }

    if (error instanceof Error) {
      return error.stack ?? `${error.name}: ${error.message}`;
    }

    return String(error);
  }

  private write(level: LogLevel, message: string): void {
    const timestamp = currentTimestamp();
    const line = `[${timestamp}] [${level}] [${this.serviceName}] ${message}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(line);
        break;
      case LogLevel.WARN:
        console.warn(line);
        break;
      default:
        console.log(line);
    }
  }
}
