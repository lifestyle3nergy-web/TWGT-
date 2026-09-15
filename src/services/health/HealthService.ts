import { currentTimestamp } from '@utils/time';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
}

export class HealthService {
  getHealth(): HealthStatus {
    return {
      status: 'healthy',
      timestamp: currentTimestamp(),
      uptime: process.uptime(),
    };
  }
}
