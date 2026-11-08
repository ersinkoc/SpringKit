# Security reporting and maintenance

Report suspected vulnerabilities through the repository's Security tab when private reporting is available. Otherwise open an issue requesting a private reporting channel without posting credentials, private data or exploitation details.

Keep runtime-package, website and development-tool risks separate. A dependency advisory match is not proof that the vulnerable path is reachable. Before updating, inspect the resolved version and affected feature, then run a clean install, type checks, tests, build and package-consumer validation.

The core has no runtime dependencies; React is an optional peer. Development and website dependencies are reviewed with `npm audit`. Avoid exposing development, test UI or browser automation servers beyond the intended local/CI environment.

Scoped overrides for esbuild and typescript-estree's minimatch select patched versions while preserving the current toolchain. Revalidate their callers when changing these overrides; remove an override when the owning dependency adopts a patched compatible range.
