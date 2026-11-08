import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/react/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    maxWorkers: 1,
    coverage: {
      provider: 'v8',
      include: ['src/adapters/react/**/*.{ts,tsx}'],
      exclude: ['src/adapters/react/index.ts'],
      reportsDirectory: 'coverage/react',
      reporter: ['text', 'json-summary', 'html'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
  resolve: {
    alias: [
      { find: '@oxog/springkit/dom', replacement: resolve(__dirname, 'src/dom/index.ts') },
      { find: '@oxog/springkit/react', replacement: resolve(__dirname, 'src/adapters/react/index.ts') },
      { find: '@oxog/springkit/testing', replacement: resolve(__dirname, 'src/testing/index.ts') },
      { find: '@oxog/springkit', replacement: resolve(__dirname, 'src/index.ts') },
    ],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
})
