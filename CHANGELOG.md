# Changelog

Each `## vX.Y.Z` section becomes the body of the GitHub Release created when the
matching tag is pushed (see `.github/workflows/release.yml`).

## v1.4.1

- Event loop chart now uses Node's built-in `performance.eventLoopUtilization()`:
  the native optional dependency `event-loop-stats` was removed, so there is no
  build step, no toolchain requirement and no more
  `event-loop-stats not found` warning (the chart used to stay empty whenever the
  addon was not built, e.g. pnpm without allowed builds)
- Each span measures the event loop over its own interval (the previous
  `sense()` was global, so spans split the measurement among themselves)
- Consumers can drop `event-loop-stats` from `onlyBuiltDependencies` /
  `allowBuilds`
- Tests: fake timers no longer leak from the on-headers-listener suite into the
  others; the package smoke test now requires the event loop metric

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
