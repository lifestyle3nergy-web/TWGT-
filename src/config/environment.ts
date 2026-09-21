export interface EnvironmentConfig {
  appName: string;
  appVersion: string;
  nodeEnv: string;
  port: number;
}

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return 3000;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(
      \`Invalid PORT "\${value}". Expected an integer between 1 and 65535.\`,
    );
  }

  const port = Number(value);

  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      \`Invalid PORT "\${value}". Expected an integer between 1 and 65535.\`,
    );
  }

  return port;
}

export const environment: EnvironmentConfig = {
  appName: process.env.APP_NAME ?? 'TWGT',
  appVersion: process.env.APP_VERSION ?? '0.2.0-alpha',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT),
};
