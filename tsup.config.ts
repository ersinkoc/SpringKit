import { defineConfig, type Options } from 'tsup'

// NOTE: Keep this config free of top-level function options (outExtension,
// esbuildOptions, etc.). tsup posts the resolved options to a worker thread
// for the DTS build and functions cannot be structured-cloned, which kills
// the build silently (DataCloneError). ESM output uses ".js" (the package is
// "type": "module"), CJS uses ".cjs" by default.
//
// Output is intentionally neither minified nor source-mapped: consumers'
// bundlers minify anyway, readable output gives better stack traces, and it
// keeps the published tarball small.
//
// `npm run build` goes through scripts/build.mjs, which builds one target at a
// time via SPRINGKIT_BUILD. Running both configs in parallel spins up two DTS
// workers at once and intermittently crashes Node on Windows with
// STATUS_HEAP_CORRUPTION (0xC0000374), leaving an incomplete dist/.

const base = {
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: false,
  minify: false,
  target: 'es2021',
  treeshake: true,
  clean: false, // dist/ is wiped by the "clean" script before building
} as const satisfies Options

const targets = {
  // Main package + the standalone testing helpers (no shared code)
  core: {
    ...base,
    entry: { index: 'src/index.ts', 'testing/index': 'src/testing/index.ts' },
    outDir: 'dist',
  },
  // React adapter. Core is imported via the package's own name and kept
  // external, so `@oxog/springkit` and `@oxog/springkit/react` share a single
  // copy of the core (one global animation loop, one MotionValue class).
  react: {
    ...base,
    entry: { index: 'src/adapters/react/index.ts' },
    external: ['react', 'react-dom', '@oxog/springkit'],
    banner: { js: '"use client";' },
    // tsup's rollup tree-shaking pass strips module directives like
    // "use client"; esbuild still tree-shakes the bundle on its own.
    treeshake: false,
    outDir: 'dist/react',
  },
} satisfies Record<string, Options>

const only = process.env.SPRINGKIT_BUILD as keyof typeof targets | undefined

export default defineConfig(only ? [targets[only]] : Object.values(targets))
