export interface EnvironmentConfig {
  appName: string;
  appVersion: string;
  nodeEnv: string;
  port: number;
}

export const environment: EnvironmentConfig = {
  appName: process.env.APP_NAME ?? 'TWGT',
  appVersion: process.env.APP_VERSION ?? '0.2.0-alpha',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
};
