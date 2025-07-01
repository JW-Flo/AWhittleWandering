/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Use jsdom for React component tests
    setupFiles: ['./tests/api/setup.ts', './packages/frontend/vitest.setup.ts'],
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'clover'],
      include: ['workers/**', 'packages/**'],
      exclude: ['node_modules', 'tests/**']
    },
    // Separate test suites for different execution phases
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
