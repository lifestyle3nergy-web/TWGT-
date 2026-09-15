import http from 'node:http';
import { healthRoute } from './routes';
import { environment } from '@config/environment';

const HEALTH_PATHS = new Set(['/', '/health']);

export class Server {
  private server = http.createServer((req, res) => {
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

      const body = JSON.stringify(healthRoute());

      res.writeHead(200, {
        ...baseHeaders,
        'Content-Length': Buffer.byteLength(body),
      });

      res.end(body);
    } catch (error) {
      console.error('Failed to handle request:', error);

      const body = JSON.stringify({
        error: 'Internal Server Error',
      });

      res.writeHead(500, {
        ...baseHeaders,
        'Content-Length': Buffer.byteLength(body),
      });

      res.end(body);
    }
  });

  public start(): void {
    this.server.listen(environment.port, () => {
      console.log(`${environment.appName} listening on port ${environment.port}`);
    });
  }

  public stop(): void {
    this.server.close();
  }
}
