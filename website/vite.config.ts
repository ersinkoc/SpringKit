import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@oxog/springkit/dom': path.resolve(__dirname, './public/springkit/dom.mjs'),
      '@oxog/springkit/react': path.resolve(__dirname, './public/springkit/react.mjs'),
      '@oxog/springkit': path.resolve(__dirname, './public/springkit/springkit.mjs'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
