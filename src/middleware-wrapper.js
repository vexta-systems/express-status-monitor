const fs = require('fs');
const path = require('path');
const onHeaders = require('on-headers');
const Handlebars = require('handlebars');
const validate = require('./helpers/validate');
const onHeadersListener = require('./helpers/on-headers-listener');
const socketIoInit = require('./helpers/socket-io-init');
const healthChecker = require('./helpers/health-checker');

const buildPwaPaths = (basePath) => {
  const normalized = basePath === '/' ? '' : basePath.replace(/\/$/, '');
  return {
    manifestPath: `${normalized}/manifest.webmanifest`,
    iconPath: `${normalized}/icons/Icone.svg`,
    appleTouchIconPath: `${normalized}/icons/apple-touch-icon.png`,
    faviconPath: `${normalized}/favicon.ico`,
    icon192Path: `${normalized}/icons/icon-192.png`,
    icon512Path: `${normalized}/icons/icon-512.png`,
    startUrl: basePath,
    scope: basePath === '/' ? '/' : `${normalized}/`
  };
};

const buildShortName = (title) => (title.length > 12 ? `${title.slice(0, 12)}…` : title);

const middlewareWrapper = (config) => {
  const validatedConfig = validate(config);
  const pwaPaths = buildPwaPaths(validatedConfig.path);
  const bodyClasses = Object.keys(validatedConfig.chartVisibility)
    .reduce((accumulator, key) => {
      if (validatedConfig.chartVisibility[key] === false) {
        accumulator.push(`hide-${key}`);
      }
      return accumulator;
    }, [])
    .join(' ');

  const data = {
    title: validatedConfig.title,
    port: validatedConfig.port,
    socketPath: validatedConfig.socketPath,
    bodyClasses,
    themeColor: validatedConfig.themeColor,
    manifestPath: pwaPaths.manifestPath,
    iconPath: pwaPaths.iconPath,
    appleTouchIconPath: pwaPaths.appleTouchIconPath,
    faviconPath: pwaPaths.faviconPath,
    script: fs.readFileSync(path.join(__dirname, '/public/javascripts/app.js')),
    style: fs.readFileSync(path.join(__dirname, '/public/stylesheets/', validatedConfig.theme))
  };

  const manifestData = {
    title: validatedConfig.title,
    shortName: buildShortName(validatedConfig.title),
    description: 'Monitor de status de API em tempo real',
    startUrl: pwaPaths.startUrl,
    scope: pwaPaths.scope,
    themeColor: validatedConfig.themeColor,
    backgroundColor: validatedConfig.backgroundColor,
    iconPath: pwaPaths.iconPath,
    icon192Path: pwaPaths.icon192Path,
    icon512Path: pwaPaths.icon512Path
  };

  const htmlTmpl = fs.readFileSync(path.join(__dirname, '/public/index.html')).toString();

  const manifestTmpl = fs.readFileSync(path.join(__dirname, '/public/manifest.webmanifest')).toString();

  const publicDir = path.join(__dirname, '/public');
  const iconSvg = fs.readFileSync(path.join(publicDir, 'icons/Icone.svg'));
  const appleTouchIcon = fs.readFileSync(path.join(publicDir, 'icons/apple-touch-icon.png'));
  const faviconIco = fs.readFileSync(path.join(publicDir, 'favicon.ico'));
  const icon192 = fs.readFileSync(path.join(publicDir, 'icons/icon-192.png'));
  const icon512 = fs.readFileSync(path.join(publicDir, 'icons/icon-512.png'));

  const render = Handlebars.compile(htmlTmpl);
  const renderManifest = Handlebars.compile(manifestTmpl);

  const servePage = (req, res) => {
    healthChecker(validatedConfig.healthChecks).then((results) => {
      data.healthCheckResults = results;
      if (validatedConfig.iframe) {
        if (res.removeHeader) {
          res.removeHeader('X-Frame-Options');
        }

        if (res.remove) {
          res.remove('X-Frame-Options');
        }
      }

      res.send(render(data));
    });
  };

  const middleware = (req, res, next) => {
    socketIoInit(req.socket.server, validatedConfig);

    const startTime = process.hrtime();

    if (req.path === validatedConfig.path) {
      servePage(req, res);
      return;
    }

    if (req.path === pwaPaths.manifestPath) {
      res.type('application/manifest+json');
      res.send(renderManifest(manifestData));
      return;
    }

    if (req.path === pwaPaths.iconPath) {
      res.type('image/svg+xml');
      res.send(iconSvg);
      return;
    }

    if (req.path === pwaPaths.appleTouchIconPath) {
      res.type('image/png');
      res.send(appleTouchIcon);
      return;
    }

    if (req.path === pwaPaths.faviconPath || req.path === '/favicon.ico') {
      res.type('image/x-icon');
      res.send(faviconIco);
      return;
    }

    if (req.path === pwaPaths.icon192Path) {
      res.type('image/png');
      res.send(icon192);
      return;
    }

    if (req.path === pwaPaths.icon512Path) {
      res.type('image/png');
      res.send(icon512);
      return;
    }

    if (!req.path.startsWith(validatedConfig.ignoreStartsWith)) {
      onHeaders(res, () => {
        onHeadersListener(res.statusCode, startTime, validatedConfig.spans);
      });
    }

    next();
  };

  /* Provide two properties, the middleware and HTML page renderer separately
   * so that the HTML page can be authenticated while the middleware can be
   * earlier in the request handling chain.  Use like:
   * ```
   * const statusMonitor = require('express-status-monitor')(config);
   * server.use(statusMonitor);
   * server.get('/status', isAuthenticated, statusMonitor.pageRoute);
   * ```
   * discussion: https://github.com/RafalWilinski/express-status-monitor/issues/63
   */
  middleware.middleware = middleware;
  middleware.pageRoute = (req, res) => {
    servePage(req, res);
  };
  return middleware;
};

module.exports = middlewareWrapper;
