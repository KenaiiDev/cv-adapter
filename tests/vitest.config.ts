import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
    snapshotFormat: {
      printBasicPrototype: false,
    },
  },
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, '../src/domain'),
      '@application': path.resolve(__dirname, '../src/application'),
      '@interfaces': path.resolve(__dirname, '../src/interfaces'),
      '@infrastructure': path.resolve(__dirname, '../src/infrastructure'),
    },
  },
});