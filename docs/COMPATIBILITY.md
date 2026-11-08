# Compatibility and validation

- Published runtime: Node 18+ for import/SSR/numerical work; DOM APIs require a browser.
- Development tools: Node 22.12+; use current Node 22/24 releases or Node 26 locally.
- React: optional peer, React 18 and 19. The core and DOM entry import without React installed.
- TypeScript consumers: NodeNext and bundler resolution, with ESM/CJS declaration files.
- Browser target: ES2021. Native animation, geometry and observers use feature-specific checks/fallbacks; consult the API support table for limitations.

`npm run test:consumers` packs the actual build and installs it into independent temporary projects outside the repository. It checks core-without-React, ESM/CJS constructor identity within each format, SSR, SVG refs and live-style types on React 18/19. CI also runs consumers on Node 18/20/22/24.

`npm run test:consumers:web` adds Vite 8 production bundling and a Next 16 App Router production build with a server/core component and client/React boundary. This extended check uses the development Node version; it is not part of the Node 18 runtime check. Fixture tool versions are explicit so upgrades are reviewable.

`npm run test:browser` runs real Chromium, Firefox and WebKit engines using the project's Vitest runner. Install browsers with `npx playwright install chromium firefox webkit`; Linux CI additionally uses `--with-deps`. These are browser-engine tests, not an assertion that every shipping Safari, mobile device or assistive technology behaves identically.

`npm run test:coverage` and `npm run test:react:coverage` have separate source scopes and thresholds. Standard node tests only select `tests/**/*.test.*`; scratch evidence and browser fixtures are separate. React fixtures deliberately preserve file isolation.

The CI workflow defines the platform matrix; a local run does not mean hosted CI has run. Device performance, real mobile input and screen-reader behavior still require representative device checks before making product-wide guarantees.
