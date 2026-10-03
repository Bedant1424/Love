import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-plugin';
import path from 'path';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: './wrangler.jsonc',
      },
    }),
  ],
  test: {
    globals: true,
    fileParallelism: false,
    testTimeout: 30000,
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
