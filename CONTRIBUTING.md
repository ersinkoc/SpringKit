# Contributing

Use a current Node 22/24 release or Node 26 and npm. The website uses npm and package-lock.json as its single supported lockfile.

```sh
npm ci
npm run typecheck
npm run lint
npm run test:all
npm run build
npm run lint:package
npm run size:check
npm run test:consumers
```

For browser changes, install the browser engines and run `npm run test:browser`. For website changes, run `npm ci --prefix website`, `npm run typecheck --prefix website` and `npm run build --prefix website` after building the library.

Reproduce bugs before editing, retain the unaffected control, and put the strongest behavior test in the normal suite. Use `installTestClock` instead of sleeping for animation progress. Stop animations, detach subscriptions and restore clocks/mocks in teardown.

Keep the core dependency-free. Preserve React 18/19, SSR, StrictMode, HTML/SVG refs and the ESM/CJS exports. Do not bundle relative core imports inside the React adapter. New behaviors need type, lifecycle and error-path coverage.

Run `npm run metrics` to regenerate bundle sizes, the README table and machine-specific benchmark JSON (best and median trial averages). Review any size budget change independently of feature work. Compare benchmarks on equivalent hardware/load. Size budgets, RAF ownership and React commit tests form stable regression gates; wall-clock timings are not universal device budgets.

Website `dev` and `build` always copy the current library build into the tracked public bundles. Build the library first; do not edit generated public bundles. Use `npm run test:consumers:web` after changing exports, client boundaries or bundling.

Document public changes in CHANGELOG and the API support table. 2.x keeps legacy method names and time units. A removal, renamed unit or changed default needs a major version and a migration guide. Do not publish or deploy as part of a local cleanup without an explicit release request.
