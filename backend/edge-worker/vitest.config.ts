import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Use node environment since tests don't require Cloudflare Workers bindings
    // They just call app.fetch() directly with mock context
    environment: 'node',
  },
  resolve: {
    alias: {
      '@awhittlewandering/shared': path.resolve(__dirname, '../../shared'),
    },
  },
});