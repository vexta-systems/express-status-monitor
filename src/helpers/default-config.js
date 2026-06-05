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
  healthChecks: [],
  themeColor: '#1a1a2e',
  backgroundColor: '#12121f'
};
