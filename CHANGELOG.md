# Changelog

Each `## vX.Y.Z` section becomes the body of the GitHub Release created when the
matching tag is pushed (see `.github/workflows/release.yml`).

## v1.4.0

First release of the Vexta fork, distributed from GitHub tags.

- Package renamed to `@vexta-systems/express-status-monitor`
- Socket.io handshake authorization: `socketAuth` hands the page a credential and
  `authorize` checks it before the client joins (rejected clients never receive metrics)
- `instanceLabel` identifies the process in cluster mode
- `assetsPath` / `pagePath` decouple manifest, icons and PWA `start_url` from `path`
- Installable PWA dashboard and mobile layout
- `pidusage` 4.0.1: metrics work again on Windows without `wmic`
- Requires Node.js 18 or newer
- Package ships only runtime files; CI runs lint, tests on Node 18/22/24 and an
  install smoke test with npm and pnpm
