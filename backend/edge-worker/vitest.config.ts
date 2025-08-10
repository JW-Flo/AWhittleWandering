import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'miniflare',
    environmentOptions: {
      compatibilityDate: '2024-01-01',
      compatibilityFlags: ['nodejs_compat'],
    },
  },
});