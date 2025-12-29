import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@oxog/springkit/react': path.resolve(__dirname, './public/springkit/react.mjs'),
      '@oxog/springkit': path.resolve(__dirname, './public/springkit/springkit.mjs'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
