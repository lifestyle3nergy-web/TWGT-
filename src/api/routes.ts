export interface RouteResponse {
  status: string;
  application: string;
  version: string;
}

import { environment } from '@config/environment';

export function healthRoute(): RouteResponse {
  return {
    status: 'ok',
    application: environment.appName,
    version: environment.appVersion,
  };
}
