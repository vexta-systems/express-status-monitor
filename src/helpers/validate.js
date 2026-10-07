const defaultConfig = require('./default-config');

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

module.exports = inputConfig => {
  // No config: still normalize, so derived options (assetsPath, pagePath) get their defaults.
  const config = inputConfig || {};

  // Works on a copy so that one instance's config does not leak into others.
  const mungeChartVisibility = configChartVisibility => {
    const chartVisibility = Object.assign({}, defaultConfig.chartVisibility);
    Object.keys(chartVisibility).forEach(key => {
      if (configChartVisibility[key] === false) {
        chartVisibility[key] = false;
      }
    });
    return chartVisibility;
  };

  config.title =
    typeof config.title === 'string' ? config.title : defaultConfig.title;
  config.theme =
    typeof config.theme === 'string' ? config.theme : defaultConfig.theme;
  config.path =
    typeof config.path === 'string' ? config.path : defaultConfig.path;
  config.socketPath =
    typeof config.socketPath === 'string' ? config.socketPath : defaultConfig.socketPath;
  config.spans =
    typeof config.spans === 'object' ? config.spans : defaultConfig.spans;
  config.port =
    typeof config.port === 'number' ? config.port : defaultConfig.port;
  config.websocket =
    typeof config.websocket === 'object'
      ? config.websocket
      : defaultConfig.websocket;
  config.iframe =
    typeof config.iframe === 'boolean' ? config.iframe : defaultConfig.iframe;
  config.chartVisibility =
    typeof config.chartVisibility === 'object'
      ? mungeChartVisibility(config.chartVisibility)
      : defaultConfig.chartVisibility;
  config.ignoreStartsWith =
    typeof config.ignoreStartsWith === 'string'
      ? config.ignoreStartsWith
      : defaultConfig.ignoreStartsWith;

  // PWA assets and page URL: independent from `path`, which may be '' when
  // the page is served by a separate (authenticated) route.
  config.assetsPath =
    typeof config.assetsPath === 'string' && config.assetsPath !== ''
      ? config.assetsPath
      : config.path || defaultConfig.path;
  config.pagePath =
    typeof config.pagePath === 'string' && config.pagePath !== ''
      ? config.pagePath
      : config.path || config.assetsPath;

  config.socketAuth =
    typeof config.socketAuth === 'function' ? config.socketAuth : defaultConfig.socketAuth;
  config.authorize =
    typeof config.authorize === 'function' ? config.authorize : defaultConfig.authorize;
  config.instanceLabel =
    typeof config.instanceLabel === 'string' && config.instanceLabel !== ''
      ? config.instanceLabel
      : defaultConfig.instanceLabel;

  config.healthChecks =
    Array.isArray(config.healthChecks)
      ? config.healthChecks
      : defaultConfig.healthChecks;
  config.themeColor =
    typeof config.themeColor === 'string' && HEX_COLOR.test(config.themeColor)
      ? config.themeColor
      : defaultConfig.themeColor;
  config.backgroundColor =
    typeof config.backgroundColor === 'string' && HEX_COLOR.test(config.backgroundColor)
      ? config.backgroundColor
      : defaultConfig.backgroundColor;

  return config;
};
