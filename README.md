# @vexta-systems/express-status-monitor

[![CI](https://github.com/vexta-systems/express-status-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/vexta-systems/express-status-monitor/actions/workflows/ci.yml)

> Fork of [RafalWilinski/express-status-monitor](https://github.com/RafalWilinski/express-status-monitor)
> maintained by Vexta. It adds socket.io handshake authorization (`socketAuth` /
> `authorize`), `instanceLabel` for cluster mode, `assetsPath` / `pagePath`, an
> installable PWA dashboard and a mobile layout. It is distributed from GitHub
> tags, not from the npm registry.

Simple, self-hosted module based on Socket.io and Chart.js to report realtime server metrics for Express-based node servers.

![Monitoring Page](http://i.imgur.com/AHizEWq.gif "Monitoring Page")

## Demo

[Demo available here](https://hackathon-starter.walcony.com/status)

## Support for other Node.js frameworks

* [koa-monitor](https://github.com/capaj/koa-monitor) for Koa
* [hapijs-status-monitor](https://github.com/ziyasal/hapijs-status-monitor) for hapi.js

## Installation & setup

1. Install from a release tag of this repository (no registry, no token needed):

   ```bash
   # npm
   npm install github:vexta-systems/express-status-monitor#v1.4.0
   # pnpm
   pnpm add github:vexta-systems/express-status-monitor#v1.4.0
   ```

   Both register the dependency as `@vexta-systems/express-status-monitor` and
   pin the exact commit in the lockfile. To upgrade, change the tag.
2. Before any other middleware or router add following line:
`app.use(require('@vexta-systems/express-status-monitor')());`
3. Run server and go to `/status`

Requires Node.js 18 or newer.

### Event loop metrics

The "Spent in Event Loop" chart uses Node's built-in
[`performance.eventLoopUtilization()`](https://nodejs.org/api/perf_hooks.html#performanceeventlooputilizationutilization1-utilization2):
no native addon, no build scripts and no toolchain needed. Each point is the
time (ms) the event loop spent processing during that span's interval.

Since 1.4.1 the native `event-loop-stats` dependency is no longer used; if a
consuming project allowed its build (`onlyBuiltDependencies` / `allowBuilds`),
that entry can be removed.

### CI of the consuming project

Installing a `github:` dependency requires `git` in the build environment.
Minimal images such as `node:*-alpine` do not ship it (`apk add --no-cache git`).

## Run examples

1. Go to `cd examples/`
2. Run `npm i`
3. Run server `npm start`
4. Go to `http://0.0.0.0:3000`

## Options

Monitor can be configured by passing options object into `expressMonitor` constructor.

Default config:
```javascript
title: 'Express Status',  // Default title
theme: 'default.css',     // Default styles
path: '/status',
socketPath: '/socket.io', // In case you use a custom path
websocket: existingSocketIoInstance,
spans: [{
  interval: 1,            // Every second
  retention: 60           // Keep 60 datapoints in memory
}, {
  interval: 5,            // Every 5 seconds
  retention: 60
}, {
  interval: 15,           // Every 15 seconds
  retention: 60
}],
chartVisibility: {
  cpu: true,
  mem: true,
  load: true,
  eventLoop: true,
  heap: true,
  responseTime: true,
  rps: true,
  statusCodes: true
},
healthChecks: [],
ignoreStartsWith: '/admin',  // Requests whose path starts with this are not counted
assetsPath: null,           // Prefix for manifest/icons/favicon (null = path, or '/status' when path is '')
pagePath: null,             // Dashboard URL used as the PWA start_url (null = path, or assetsPath)
socketAuth: null,           // (req) => object sent by the dashboard as socket.io `auth`
authorize: null,            // (socket) => Promise<boolean>, checked at the socket.io handshake
instanceLabel: null         // Text shown next to the title identifying this process

```

The dashboard always connects using the WebSocket transport only, so it works
behind a load balancer or in cluster mode (e.g. PM2 `-i N`) without sticky
sessions. A reverse proxy must forward the WebSocket upgrade on `socketPath`.

## Health Checks

You can add a series of health checks to the configuration that will appear below the other stats. The health check will be considered successful if the endpoint returns a 200 status code.

```javascript
// config
healthChecks: [{
  protocol: 'http',
  host: 'localhost',
  path: '/admin/health/ex1',
  port: '3000'
}, {
  protocol: 'http',
  host: 'localhost',
  path: '/admin/health/ex2',
  port: '3000'
}]
```

![Health Checks](https://i.imgur.com/6tY4OhA.png "Health Checks")

## Securing endpoint

The HTML page handler is exposed as a `pageRoute` property on the main
middleware function.  So the middleware is mounted to intercept all requests
while the HTML page handler will be authenticated.

Example using https://www.npmjs.com/package/connect-ensure-login
```javascript
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn()

const statusMonitor = require('@vexta-systems/express-status-monitor')();
app.use(statusMonitor);
app.get('/status', ensureLoggedIn, statusMonitor.pageRoute)
```

Credits to [@mattiaerre](https://github.com/mattiaerre)

Example using [http-auth](https://www.npmjs.com/package/http-auth)
```javascript
const auth = require('http-auth');
const basic = auth.basic({realm: 'Monitor Area'}, function(user, pass, callback) {
  callback(user === 'username' && pass === 'password');
});

// Set '' to config path to avoid middleware serving the html page (path must be a string not equal to the wanted route)
const statusMonitor = require('@vexta-systems/express-status-monitor')({ path: '' });
app.use(statusMonitor.middleware); // use the "middleware only" property to manage websockets
app.get('/status', basic.check(statusMonitor.pageRoute)); // use the pageRoute property to serve the dashboard html page
```

### Securing the metrics stream

Authenticating the page alone does not protect the metrics, which are sent over
socket.io. Use `socketAuth` to hand the authenticated page a credential (for
example a short-lived signed token) and `authorize` to check it. The check runs
as a socket.io handshake middleware, so a rejected client never joins the server
and never receives any metrics event.

```javascript
const statusMonitor = require('@vexta-systems/express-status-monitor')({
  path: '',
  assetsPath: '/status',
  ignoreStartsWith: '/status',
  socketAuth: req => ({ token: issueToken() }),
  authorize: socket => Promise.resolve(isValidToken(socket.handshake.auth.token)),
  instanceLabel: `pid ${process.pid}`
});
app.use(statusMonitor.middleware);
app.get('/status', basic.check(statusMonitor.pageRoute));
```

In cluster mode each process has its own monitor: the dashboard shows the
process that accepted the WebSocket, identified by `instanceLabel`. The token
must therefore be valid on any process (e.g. signed with a shared secret instead
of kept in memory).

## Using module with socket.io in project

If you're using socket.io in your project, this module could break your project because this module by default will spawn its own socket.io instance. To mitigate that, fill websocket parameter with your main socket.io instance as well as port parameter.

## Tests and coverage

This repository uses pnpm (version pinned in `packageManager`):
```
pnpm install
pnpm run eslint
pnpm run test-ci
node scripts/smoke-package.js   # packs the module and installs it with npm and pnpm
```

## Releasing

1. Bump `version` in `package.json` and add a `## vX.Y.Z` section to `CHANGELOG.md`.
2. Commit, then tag and push the tag:

   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin master vX.Y.Z
   ```

The `Release` workflow lints, tests and smoke-tests the tagged commit, checks that
the tag matches `package.json` and creates the GitHub Release from the
`CHANGELOG.md` section. Tags with a suffix (`v1.5.0-rc.1`) become pre-releases.
For a tag pushed before the workflow existed, run it manually from the Actions tab
(*Release → Run workflow*, input `tag`). Tags are treated as immutable: fix
mistakes with a new version.

## License

[MIT License](https://opensource.org/licenses/MIT) © [Dynobase](https://dynobase.com)
