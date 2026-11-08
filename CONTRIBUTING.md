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

The website build emits static entries from the app routes and documentation navigation for GitHub Pages. Run `npm run test:routes --prefix website` after building; adding a route must preserve direct URLs as well as client-side navigation.

Document public changes in CHANGELOG and the API support table. 2.x keeps legacy method names and time units. A removal, renamed unit or changed default needs a major version and a migration guide. Do not publish or deploy as part of a local cleanup without an explicit release request.

After an authorized release, run `npm run test:published`. It installs the exact package version from the public npm registry into independent clean projects and checks core, React 18/19, type resolution, Vite and Next; it does not substitute a local tarball.

To release, first document the changes under `CHANGELOG.md` → `[Unreleased]` and merge them into `main`. In GitHub Actions, select **Start Release**, choose `main` and a `patch`, `minor` or `major` increase, then run the workflow. The equivalent CLI request is:

```sh
gh workflow run prepare-release.yml --ref main -f bump=patch
```

This single request updates the package, lockfile and website metrics versions, moves Unreleased notes into a dated release entry, and atomically pushes a release commit and annotated tag. It then dispatches `release.yml` **on that tag** and waits for the complete pipeline: full CI matrix → npm publication → cryptographic provenance and clean npm consumers → GitHub Release with the verified registry archive and checksums → Pages deployment → live HTTP/content verification. The separate tag dispatch preserves the exact signed tag/commit identity; a `GITHUB_TOKEN` push alone would not trigger another workflow. Website deployment is part of the release pipeline and no longer runs independently on source pushes.

Automatic releases use the npm Trusted Publisher for `ersinkoc/SpringKit`, workflow filename `release.yml`, with direct `npm publish` permission. The workflow does not consume an npm token secret. Only the publication job obtains short-lived OIDC publish credentials. Preparation uses the repository's built-in job token with `contents: write` and `actions: write`; GitHub Release creation uses `contents: write`; Pages deployment uses `pages: write` and `id-token: write`. The `github-pages` environment must allow release tags (`v*`) as well as `main`. Publisher settings require an interactive npm login and 2FA; a granular token that bypasses 2FA cannot administer them.

Retry a failed **Start Release** run instead of starting a new request: the run ID locates the existing release commit/tag and resumes its tagged workflow without increasing the version again. The tagged pipeline reuses matching npm versions and release assets, rejects mismatched source/integrity, and prevents older versions from overwriting the current release. Failed child jobs can also be rerun directly on the same tag; successful jobs remain complete. A genuinely new workflow request is a new release and requires new Unreleased notes. Root preparation and tagged publication use separate concurrency groups so the parent can safely wait for its child.

`npm run test:release` checks version preparation, real Git retries, artifact integrity, GitHub Release retries, provenance gates and live-site verification. After publication, `npm run verify:published` waits for the expected registry version/provenance and npm's abbreviated install index, checks that both representations identify the same artifact, and rejects a mismatched source commit. `npm run test:published:provenance` then uses npm's cryptographic signature verifier and checks the verified statement's repository, workflow, version tag, commit and hosted builder before completing clean consumer tests. Registry consumers request fresh metadata. Post-publication verification runs in a separate read-only job: if it fails after upload, rerun only that failed job instead of republishing the immutable version or moving its tag. Pages publishes `release.json` and verifies the release build's route/asset SHA-256 manifest after deployment; verification results are retained as a workflow artifact.
