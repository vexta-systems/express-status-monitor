const path = require('path');
const chai = require('chai');
const sinon = require('sinon');

chai.should();

const srcDir = path.join(__dirname, '..', 'src');

/* socket-io-init keeps the socket.io server in a module-level singleton, so each
 * test loads the middleware from scratch to get its own server and spans.
 */
const loadFreshMiddleware = () => {
  Object.keys(require.cache)
    .filter(key => key.startsWith(srcDir))
    .forEach(key => {
      delete require.cache[key];
    });
  return require('../src/middleware-wrapper'); // eslint-disable-line global-require
};

const createRes = () => ({
  statusCode: 200,
  writeHead: sinon.stub(),
  send: sinon.stub(),
  type: sinon.stub()
});

const totalCount = spans =>
  spans.reduce(
    (sum, span) => sum + span.responses.reduce((spanSum, bucket) => spanSum + bucket.count, 0),
    0
  );

/* Runs one request through the middleware and simulates the response being sent. */
const request = (middleware, reqPath) => {
  const req = { path: reqPath, socket: {} };
  const res = createRes();
  const next = sinon.stub();

  middleware(req, res, next);
  if (next.called) {
    res.writeHead(res.statusCode);
  }
  return { res, next };
};

const renderPage = (middleware, done, assert) => {
  const res = createRes();

  middleware.pageRoute({ path: '/status', socket: {} }, res);
  setTimeout(() => {
    assert(String(res.send.firstCall.args[0]));
    done();
  });
};

describe('middleware-wrapper options', () => {
  describe('ignoreStartsWith', () => {
    it('does not count requests under the configured prefix when path is empty', () => {
      const spans = [{ interval: 1, retention: 10 }];
      const middleware = loadFreshMiddleware()({ path: '', ignoreStartsWith: '/status', spans });

      request(middleware, '/status');
      request(middleware, '/status/manifest-like-path');
      totalCount(spans).should.equal(0);

      request(middleware, '/api/clientes');
      totalCount(spans).should.equal(1);
    });

    it('ignores /admin by default and counts other requests', () => {
      const spans = [{ interval: 1, retention: 10 }];
      const middleware = loadFreshMiddleware()({ spans });

      request(middleware, '/admin/health');
      totalCount(spans).should.equal(0);

      request(middleware, '/x');
      totalCount(spans).should.equal(1);
    });
  });

  describe('assetsPath', () => {
    it('lets /favicon.ico and /manifest.webmanifest at the root pass through', () => {
      const middleware = loadFreshMiddleware()({ path: '', assetsPath: '/status' });

      ['/favicon.ico', '/manifest.webmanifest'].forEach(reqPath => {
        const { res, next } = request(middleware, reqPath);

        sinon.assert.called(next);
        sinon.assert.notCalled(res.send);
      });
    });

    it('serves the manifest under the prefix, starting at the dashboard page', () => {
      const middleware = loadFreshMiddleware()({ path: '', assetsPath: '/status' });
      const { res, next } = request(middleware, '/status/manifest.webmanifest');
      const manifest = JSON.parse(res.send.firstCall.args[0]);

      sinon.assert.notCalled(next);
      manifest.start_url.should.equal('/status');
      manifest.icons[0].src.should.equal('/status/icons/Icone.svg');
    });

    it('serves the favicon under the prefix', () => {
      const middleware = loadFreshMiddleware()({ path: '', assetsPath: '/status' });
      const { res, next } = request(middleware, '/status/favicon.ico');

      sinon.assert.notCalled(next);
      sinon.assert.calledWith(res.type, 'image/x-icon');
    });
  });

  describe('socketAuth', () => {
    it('embeds the value returned for the request in the page', done => {
      const middleware = loadFreshMiddleware()({
        path: '',
        socketAuth: () => ({ token: 'abc.def.ghi' })
      });

      renderPage(middleware, done, html => {
        html.should.contain('var socketAuth = {"token":"abc.def.ghi"};');
      });
    });

    it('cannot close the script tag or inject markup through the value', done => {
      const middleware = loadFreshMiddleware()({
        path: '',
        socketAuth: () => ({ token: '</script><script>alert(1)</script>' })
      });

      renderPage(middleware, done, html => {
        html.should.not.contain('<script>alert(1)');
        html.should.contain('\\u003c/script\\u003e');
      });
    });

    it('is null when not configured', done => {
      const middleware = loadFreshMiddleware()({ path: '' });

      renderPage(middleware, done, html => {
        html.should.contain('var socketAuth = null;');
      });
    });

    it('is computed per request', done => {
      let counter = 0;
      const middleware = loadFreshMiddleware()({
        path: '',
        socketAuth: () => {
          counter += 1;
          return { token: `t${counter}` };
        }
      });

      renderPage(middleware, () => {
        renderPage(middleware, done, html => {
          html.should.contain('"token":"t2"');
        });
      }, html => {
        html.should.contain('"token":"t1"');
      });
    });
  });
});
