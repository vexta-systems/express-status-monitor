const http = require('http');
const path = require('path');
const chai = require('chai');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');

chai.should();

const socketIoInitPath = path.join(__dirname, '..', '..', 'src', 'helpers', 'socket-io-init.js');
const SILENCE_MS = 300;

/* socket-io-init keeps the server in a module-level singleton: load a fresh copy per test. */
const loadFreshSocketIoInit = () => {
  delete require.cache[socketIoInitPath];
  return require(socketIoInitPath); // eslint-disable-line global-require
};

/* Connects and records which events arrive (or the connection error) within a short window. */
const connectAndListen = (port, auth) =>
  new Promise(resolve => {
    const received = {};
    const client = ioClient(`http://localhost:${port}`, {
      transports: ['websocket'],
      reconnection: false,
      auth
    });

    ['esm_start', 'esm_instance', 'esm_stats'].forEach(event => {
      client.on(event, data => {
        received[event] = data;
      });
    });
    client.on('connect_error', error => {
      received.connectError = error.message;
    });
    setTimeout(() => {
      client.close();
      resolve(received);
    }, SILENCE_MS);
  });

describe('socket-io-init authorization', () => {
  let httpServer;
  let io;
  let port;

  beforeEach(done => {
    httpServer = http.createServer();
    io = new Server(httpServer);
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      done();
    });
  });

  afterEach(done => {
    io.close();
    httpServer.close(() => done());
  });

  const init = extraConfig =>
    loadFreshSocketIoInit()(
      httpServer,
      Object.assign(
        {
          websocket: io,
          spans: [{ interval: 60, retention: 10 }],
          authorize: socket => Promise.resolve(socket.handshake.auth.token === 'valid-token')
        },
        extraConfig
      )
    );

  it('rejects a client without token before it receives any metrics event', async () => {
    init();
    // Broadcasts metrics continuously while the client tries to connect
    const broadcast = setInterval(() => io.emit('esm_stats', { leaked: true }), 5);

    const received = await connectAndListen(port, {});

    clearInterval(broadcast);
    received.connectError.should.equal('unauthorized');
    received.should.not.have.property('esm_start');
    received.should.not.have.property('esm_stats');
  });

  it('rejects a client with an invalid token', async () => {
    init();

    const received = await connectAndListen(port, { token: 'forged' });

    received.connectError.should.equal('unauthorized');
    received.should.not.have.property('esm_start');
  });

  it('rejects the client when authorize throws', async () => {
    init({
      authorize: () => {
        throw new Error('boom');
      }
    });

    const received = await connectAndListen(port, { token: 'valid-token' });

    received.connectError.should.equal('unauthorized');
  });

  it('accepts a valid token and sends the spans and the instance label', async () => {
    init({ instanceLabel: 'instância 2 · pid 1234' });

    const received = await connectAndListen(port, { token: 'valid-token' });

    received.should.not.have.property('connectError');
    received.esm_start.should.be.an('array').with.lengthOf(1);
    received.esm_instance.should.equal('instância 2 · pid 1234');
  });

  it('does not send an instance label when none is configured', async () => {
    init();

    const received = await connectAndListen(port, { token: 'valid-token' });

    received.should.have.property('esm_start');
    received.should.not.have.property('esm_instance');
  });

  it('accepts any client when authorize is not configured (previous behavior)', async () => {
    init({ authorize: null });

    const received = await connectAndListen(port, {});

    received.should.have.property('esm_start');
  });
});
