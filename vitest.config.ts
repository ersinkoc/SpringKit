import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Exclude React adapter tests due to Vite import resolution issues
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/unit/react/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'website/',
        'tests/fixtures/',
        'tests/unit/react/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/adapters/react/**',
        'vitest.config.ts',
        'tsup.config.ts',
        'vite.config.ts',
        'src/types.ts',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@oxog/springkit': resolve(__dirname, './src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  css: {
    modules: {
      classNameStrategy: 'non-scoped',
    },
  },
})
