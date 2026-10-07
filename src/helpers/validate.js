const defaultConfig = require('./default-config');

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const isType = type => value => typeof value === type;
const isString = isType('string');
const isNonEmptyString = value => isString(value) && value !== '';
const isFunction = isType('function');
const isObject = isType('object');
const isHexColor = value => isString(value) && HEX_COLOR.test(value);

const pick = (value, isValid, fallback) => (isValid(value) ? value : fallback);

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

const validateDashboard = config => {
  config.title = pick(config.title, isString, defaultConfig.title);
  config.theme = pick(config.theme, isString, defaultConfig.theme);
  config.path = pick(config.path, isString, defaultConfig.path);
  config.socketPath = pick(config.socketPath, isString, defaultConfig.socketPath);
  config.spans = pick(config.spans, isObject, defaultConfig.spans);
  config.port = pick(config.port, isType('number'), defaultConfig.port);
  config.websocket = pick(config.websocket, isObject, defaultConfig.websocket);
  config.iframe = pick(config.iframe, isType('boolean'), defaultConfig.iframe);
  config.chartVisibility = isObject(config.chartVisibility)
    ? mungeChartVisibility(config.chartVisibility)
    : defaultConfig.chartVisibility;
  config.ignoreStartsWith = pick(config.ignoreStartsWith, isString, defaultConfig.ignoreStartsWith);
  config.healthChecks = pick(config.healthChecks, Array.isArray, defaultConfig.healthChecks);
};

// PWA assets and page URL: independent from `path`, which may be '' when
// the page is served by a separate (authenticated) route.
const validatePwa = config => {
  config.assetsPath = pick(config.assetsPath, isNonEmptyString, config.path || defaultConfig.path);
  config.pagePath = pick(config.pagePath, isNonEmptyString, config.path || config.assetsPath);
  config.themeColor = pick(config.themeColor, isHexColor, defaultConfig.themeColor);
  config.backgroundColor = pick(config.backgroundColor, isHexColor, defaultConfig.backgroundColor);
};

const validateSocket = config => {
  config.socketAuth = pick(config.socketAuth, isFunction, defaultConfig.socketAuth);
  config.authorize = pick(config.authorize, isFunction, defaultConfig.authorize);
  config.instanceLabel = pick(config.instanceLabel, isNonEmptyString, defaultConfig.instanceLabel);
};

module.exports = inputConfig => {
  // No config: still normalize, so derived options (assetsPath, pagePath) get their defaults.
  const config = inputConfig || {};

  validateDashboard(config);
  validatePwa(config);
  validateSocket(config);

  return config;
};
