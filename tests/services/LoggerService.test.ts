import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoggerService, LogLevel } from '@services/LoggerService';

describe('LoggerService', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('routes INFO and DEBUG to console.log', () => {
    const logger = new LoggerService();

    logger.debug('debug message');
    logger.info('info message');

    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('routes WARN to console.warn', () => {
    new LoggerService().warn('warn message');

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(\`[\${LogLevel.WARN}]\`),
    );
    expect(console.log).not.toHaveBeenCalled();
  });

  it('routes ERROR to console.error', () => {
    new LoggerService().error('error message');

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(\`[\${LogLevel.ERROR}]\`),
    );
    expect(console.log).not.toHaveBeenCalled();
  });

  it('preserves Error stack information', () => {
    const error = new Error('boom');
    new LoggerService().error('failure', error);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(error.stack ?? 'Error: boom'),
    );
  });

  it('represents non-Error thrown values', () => {
    new LoggerService().error('failure', { code: 'E_TEST' });

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[object Object]'),
    );
  });

  it('includes the service name and timestamp', () => {
    new LoggerService('Custom').info('hello');

    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] \[Custom\] hello$/,
      ),
    );
  });
});
