import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/adapters/react/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'es2020',
  external: ['react', 'react-dom'],
  treeshake: true,
  outDir: 'dist',
  esbuildOptions(options) {
    // Resolve .js extensions to .ts files for TypeScript imports
    options.resolveExtensions = ['.ts', '.tsx', '.json', '.js']
  },
})
