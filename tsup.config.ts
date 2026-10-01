import { defineConfig } from 'tsup'

// NOTE: Keep this config free of top-level function options (outExtension,
// esbuildOptions, etc.). tsup posts the resolved options to a worker thread
// for the DTS build and functions cannot be structured-cloned, which kills
// the build silently (DataCloneError). ESM output uses ".js" (the package is
// "type": "module"), CJS uses ".cjs" by default.

const base = {
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  minify: true,
  target: 'es2021',
  treeshake: true,
} as const

export default defineConfig([
  // Main package
  {
    ...base,
    entry: ['src/index.ts'],
    clean: true,
    outDir: 'dist',
  },
  // React adapter
  {
    ...base,
    entry: { index: 'src/adapters/react/index.ts' },
    clean: false,
    external: ['react', 'react-dom'],
    noExternal: [/^\.\.\/\.\.\//, /^@oxog/],
    outDir: 'dist/react',
  },
])
