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
    include: ['**/tests/unit/react/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: [
      { find: '@oxog/springkit/react', replacement: resolve(__dirname, 'src/adapters/react/index.ts') },
      { find: '@oxog/springkit', replacement: resolve(__dirname, 'src/index.ts') },
    ],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  esbuild: {
    target: 'esnext',
  },
})
