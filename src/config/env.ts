import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_TTL: z.coerce.number().default(300),

  // Neo4j
  NEO4J_URL: z.string().default('bolt://localhost:7687'),
  NEO4J_USER: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string().min(1),

  // Vector DB
  VECTOR_DB_URL: z.string().default('http://localhost:6333'),
  VECTOR_DB_API_KEY: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),

  // DeepSeek
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('1h'),
  REFRESH_SECRET: z.string().min(32),
  REFRESH_EXPIRY: z.string().default('7d'),

  // Features
  ENABLE_TELEMETRY: z.preprocess((value) => value === 'true', z.boolean()).default(true),
  ENABLE_MONITORING: z.preprocess((value) => value === 'true', z.boolean()).default(true),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('pretty'),

  // Rate Limiting
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // CORS
  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z.preprocess((value) => value === 'true', z.boolean()).default(true),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function parseEnv(input: NodeJS.ProcessEnv): EnvConfig {
  return envSchema.parse(input);
}

export function validateEnv(): EnvConfig {
  try {
    const env = parseEnv(process.env);
    console.log('Environment variables validated');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.issues.forEach((issue) => {
        console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();
