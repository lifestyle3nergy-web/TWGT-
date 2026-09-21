import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const resolvePath = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@core': resolvePath('./src/core'),
      '@api': resolvePath('./src/api'),
      '@services': resolvePath('./src/services'),
      '@agents': resolvePath('./src/agents'),
      '@memory': resolvePath('./src/memory'),
      '@graph': resolvePath('./src/graph'),
      '@workflows': resolvePath('./src/workflows'),
      '@auth': resolvePath('./src/auth'),
      '@config': resolvePath('./src/config'),
      '@database': resolvePath('./src/database'),
      '@types': resolvePath('./src/types'),
      '@utils': resolvePath('./src/utils'),
      '@': resolvePath('./src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/types/**', 'src/index.ts'],
    },
  },
});
