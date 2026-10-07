/* eslint strict: "off", init-declarations: "off" */

'use strict';

const socketIo = require('socket.io');
const gatherOsMetrics = require('./gather-os-metrics');

let io;

const addSocketEvents = (socket, config) => {
  socket.emit('esm_start', config.spans);
  if (config.instanceLabel) {
    socket.emit('esm_instance', config.instanceLabel);
  }
  socket.on('esm_change', () => {
    socket.emit('esm_start', config.spans);
  });
};

/* Authorization runs as a handshake middleware: a rejected socket never joins
 * the server, so it cannot receive the `esm_stats` broadcast (io.emit) that
 * could reach it while an async check after `connection` was still pending.
 */
const authorizeHandshake = config => (socket, next) => {
  Promise.resolve()
    .then(() => config.authorize(socket))
    .then(authorized => next(authorized ? undefined : new Error('unauthorized')))
    .catch(() => next(new Error('unauthorized')));
};

module.exports = (server, config) => {
  if (io === null || io === undefined) {
    if (config.websocket !== null) {
      io = config.websocket;
    } else {
      io = socketIo(server);
    }

    if (config.authorize) {
      io.use(authorizeHandshake(config));
    }

    io.on('connection', socket => {
      addSocketEvents(socket, config);
    });

    config.spans.forEach(span => {
      span.os = [];
      span.responses = [];
      const interval = setInterval(() => gatherOsMetrics(io, span), span.interval * 1000);

      // Don't keep Node.js process up
      interval.unref();
    });
  }
};
