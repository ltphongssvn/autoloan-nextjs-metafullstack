// autoloan-nextjs-metafullstack/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        // SSR plumbing — style flush logic requires real SSR runtime, not testable in happy-dom
        'src/theme/EmotionCache.tsx',
        // Barrel re-exports — no logic to test
        'src/theme/index.ts',
        'src/services/index.ts',
        'src/components/index.ts',
        // Pure type definitions — no runtime code
        'src/types/index.ts',
        // Prisma client singleton — runtime DB connector, not unit-testable
        'src/lib/prisma.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
        perFile: true,
      },
    },
  },
});
