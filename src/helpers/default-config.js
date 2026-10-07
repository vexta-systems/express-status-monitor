module.exports = {
  title: 'Status API',
  theme: 'default.css',
  path: '/status',
  socketPath: '/socket.io',
  spans: [
    {
      interval: 1,
      retention: 120
    },
    {
      interval: 5,
      retention: 120
    },
    {
      interval: 15,
      retention: 120
    }
  ],
  port: null,
  websocket: null,
  iframe: false,
  chartVisibility: {
    cpu: true,
    mem: true,
    load: true,
    heap: true,
    eventLoop: true,
    responseTime: true,
    rps: true,
    statusCodes: true
  },
  ignoreStartsWith: '/admin',
  // Prefix for manifest/icons/favicon; null = `path` (or '/status' when `path` is '')
  assetsPath: null,
  // Dashboard URL used as the PWA start_url; null = `path` (or `assetsPath`)
  pagePath: null,
  // (req) => object sent by the dashboard as socket.io `auth` on connect
  socketAuth: null,
  // (socket) => Promise<boolean>; checked at the socket.io handshake
  authorize: null,
  // Label sent to the dashboard (`esm_instance`) identifying this process
  instanceLabel: null,
  healthChecks: [],
  themeColor: '#1a1a2e',
  backgroundColor: '#12121f'
};
