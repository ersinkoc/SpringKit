import { defineConfig } from 'tsup'

export default defineConfig([
  // Main package
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: true,
    target: 'es2020',
    treeshake: true,
    outDir: 'dist',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : '.cjs',
      }
    },
    esbuildOptions(options) {
      options.resolveExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json']
    },
  },
  // React adapter
  {
    entry: { index: 'src/adapters/react/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    minify: true,
    target: 'es2020',
    external: ['react', 'react-dom'],
    noExternal: [/^\.\.\/\.\.\//, /^@oxog/],
    treeshake: true,
    outDir: 'dist/react',
    outExtension({ format }) {
      return {
        js: format === 'esm' ? '.mjs' : '.cjs',
      }
    },
    esbuildOptions(options) {
      options.resolveExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json']
    },
  },
])
