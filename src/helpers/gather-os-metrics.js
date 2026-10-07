const pidusage = require('pidusage');
const os = require('os');
const v8 = require('v8');
const { performance } = require('perf_hooks');
const sendMetrics = require('./send-metrics');
const debug = require('debug')('express-status-monitor');

/* Event loop metrics come from Node's built-in event loop utilization (no
 * native addon to compile). Each span keeps its own baseline, so every span
 * reports the time spent in the loop during its own interval.
 */
const eventLoopBaselines = new WeakMap();

const senseEventLoop = span => {
  const current = performance.eventLoopUtilization();
  const previous = eventLoopBaselines.get(span);

  eventLoopBaselines.set(span, current);
  if (!previous) {
    return undefined;
  }

  const delta = performance.eventLoopUtilization(current, previous);

  // `sum`: ms spent processing in the event loop since the previous collection
  return { sum: delta.active, utilization: delta.utilization };
};

module.exports = (io, span) => {
  const defaultResponse = {
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    count: 0,
    mean: 0,
    timestamp: Date.now(),
  };

  pidusage(process.pid, (err, stat) => {
    if (err) {
      debug(err);
      return;
    }

    const last = span.responses[span.responses.length - 1];

    // Convert from B to MB
    stat.memory = stat.memory / 1024 / 1024;
    stat.load = os.loadavg();
    stat.timestamp = Date.now();
    stat.heap = v8.getHeapStatistics();

    const loop = senseEventLoop(span);

    if (loop) {
      stat.loop = loop;
    }

    span.os.push(stat);
    // timestamp is in ms and interval in seconds
    if (!span.responses[0] || last.timestamp + (span.interval * 1000) < Date.now()) {
      span.responses.push(defaultResponse);
    }

    // todo: I think this check should be moved somewhere else
    if (span.os.length >= span.retention) span.os.shift();
    if (span.responses[0] && span.responses.length > span.retention) span.responses.shift();

    sendMetrics(io, span);
  });
};
