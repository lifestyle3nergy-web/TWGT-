import http from 'node:http';
import { healthRoute, type RouteResponse } from './routes';
import { environment } from '@config/environment';
import { LoggerService } from '@services/LoggerService';

const HEALTH_PATHS = new Set(['/', '/health']);

type ServerState = 'stopped' | 'starting' | 'running' | 'stopping';

export class Server {
  private readonly logger = new LoggerService('Server');
  private state: ServerState = 'stopped';
  private startupReject: ((error: Error) => void) | undefined;
  private startupListening: (() => void) | undefined;
  private startupPromise: Promise<void> | undefined;
  private shutdownPromise: Promise<void> | undefined;
  private readonly healthRoute: () => RouteResponse;

  private readonly server = http.createServer((req, res) => {
    const baseHeaders = {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    } as const;

    try {
      const path = (req.url ?? '/').split('?')[0];

      if (req.method !== 'GET') {
        res.writeHead(405, {
          ...baseHeaders,
          Allow: 'GET',
        });

        res.end(
          JSON.stringify({
            error: 'Method Not Allowed',
          }),
        );
        return;
      }

      if (!HEALTH_PATHS.has(path)) {
        res.writeHead(404, baseHeaders);

        res.end(
          JSON.stringify({
            error: 'Not Found',
          }),
        );
        return;
      }

      const body = JSON.stringify(this.healthRoute());

      res.writeHead(200, {
        ...baseHeaders,
        'Content-Length': Buffer.byteLength(body),
      });

      res.end(body);
    } catch (error) {
      this.logger.error('Failed to handle request.', error);

      if (!res.headersSent) {
        const body = JSON.stringify({
          error: 'Internal Server Error',
        });

        res.writeHead(500, {
          ...baseHeaders,
          'Content-Length': Buffer.byteLength(body),
        });

        res.end(body);
      }
    }
  });

  constructor(healthHandler?: () => RouteResponse) {
    this.healthRoute = healthHandler ?? healthRoute;
    this.server.on('error', (error: Error) => {
      if (this.state === 'starting' && this.startupReject) {
        const reject = this.startupReject;
        this.startupReject = undefined;

        if (this.startupListening) {
          this.server.removeListener('listening', this.startupListening);
          this.startupListening = undefined;
        }

        this.state = 'stopped';
        this.startupPromise = undefined;
        reject(error);
        return;
      }

      if (this.state !== 'stopping') {
        this.logger.error('Server error.', error);
      }
    });
  }

  public start(): Promise<void> {
    if (this.state !== 'stopped') {
      return Promise.reject(
        new Error('Cannot start server while state is "' + this.state + '".'),
      );
    }

    this.state = 'starting';

    return new Promise((resolve, reject) => {
      const onListening = (): void => {
        this.server.removeListener('listening', onListening);
        this.startupListening = undefined;
        this.startupReject = undefined;
        this.startupPromise = undefined;
        this.state = 'running';

        console.log(
          environment.appName + ' listening on port ' + environment.port,
        );

        resolve();
      };

      this.startupReject = reject;
      this.startupListening = onListening;
      this.server.once('listening', onListening);

      try {
        this.server.listen(environment.port);
      } catch (error) {
        this.server.removeListener('listening', onListening);
        this.startupListening = undefined;
        this.startupReject = undefined;
        this.state = 'stopped';
        this.startupPromise = undefined;
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  public stop(): Promise<void> {
    if (this.state === 'stopped') {
      return Promise.resolve();
    }

    if (this.state === 'stopping') {
      return this.shutdownPromise ?? Promise.resolve();
    }

    if (this.state === 'starting') {
      const startupPromise = this.startupPromise;

      if (!startupPromise) {
        return Promise.resolve();
      }

      return startupPromise.then(
        () => this.stop(),
        () => this.stop(),
      );
    }

    this.state = 'stopping';

    const shutdownPromise = new Promise<void>((resolve, reject) => {
      try {
        this.server.close((error?: Error) => {
          this.state = 'stopped';

          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      } catch (error) {
        this.state = 'stopped';
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });

    this.shutdownPromise = shutdownPromise;

    return shutdownPromise.finally(() => {
      this.shutdownPromise = undefined;
    });
  }
}
