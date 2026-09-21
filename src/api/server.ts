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
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  public stop(): Promise<void> {
    if (this.state === 'stopped') {
      return Promise.resolve();
    }

    if (this.state === 'starting') {
      return Promise.reject(
        new Error('Cannot stop server while startup is in progress.'),
      );
    }

    if (this.state === 'stopping') {
      return Promise.reject(new Error('Server shutdown is already in progress.'));
    }

    this.state = 'stopping';

    return new Promise((resolve, reject) => {
      this.server.close((error?: Error) => {
        this.state = 'stopped';

        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}
