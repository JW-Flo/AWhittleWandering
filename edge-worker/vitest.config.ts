/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import type { UserConfig } from 'vite';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/__tests__/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'clover'],
        }
    }
} as UserConfig);
