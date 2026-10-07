const path = require('path');
const chai = require('chai');
const sinon = require('sinon');

chai.should();

/* pidusage spawns OS tools (wmic/ps); replace it with a stub that answers synchronously. */
const loadWithFakePidusage = () => {
  const pidusagePath = require.resolve('pidusage');
  const gatherPath = path.join(__dirname, '..', '..', 'src', 'helpers', 'gather-os-metrics.js');

  require.cache[pidusagePath] = {
    id: pidusagePath,
    filename: pidusagePath,
    loaded: true,
    exports: (pid, callback) => callback(null, { cpu: 1, memory: 1024 * 1024 })
  };
  delete require.cache[gatherPath];
  return require(gatherPath); // eslint-disable-line global-require
};

/* Controls Date.now only: fake timers would also freeze the clock used by the event loop tests below. */
const START = 1700000000000;

describe('gather-os-metrics', () => {
  let now;
  let dateNowStub;
  let gatherOsMetrics;
  const tick = ms => {
    now += ms;
  };

  before(() => {
    gatherOsMetrics = loadWithFakePidusage();
  });

  after(() => {
    delete require.cache[require.resolve('pidusage')];
  });

  beforeEach(() => {
    now = START;
    dateNowStub = sinon.stub(Date, 'now').callsFake(() => now);
  });

  afterEach(() => {
    dateNowStub.restore();
  });

  describe('when a span has no requests for a while', () => {
    it('adds zeroed buckets and reports zero to the dashboard', () => {
      const io = { emit: sinon.spy() };
      const span = {
        interval: 1,
        retention: 60,
        os: [],
        responses: [{ 2: 5, 3: 0, 4: 0, 5: 0, count: 5, mean: 12, timestamp: Date.now() }]
      };

      [1, 2, 3].forEach(() => {
        tick(1500);
        gatherOsMetrics(io, span);
      });

      const idleBuckets = span.responses.slice(1);

      idleBuckets.length.should.equal(3);
      idleBuckets.forEach(bucket => {
        bucket.count.should.equal(0);
        bucket.mean.should.equal(0);
      });

      const lastStats = io.emit.lastCall.args[1];

      io.emit.lastCall.args[0].should.equal('esm_stats');
      lastStats.responses.count.should.equal(0);
      lastStats.responses.mean.should.equal(0);
    });
  });

  describe('when the current bucket is still open', () => {
    it('does not add a new bucket', () => {
      const io = { emit: sinon.spy() };
      const span = {
        interval: 5,
        retention: 60,
        os: [],
        responses: [{ 2: 1, 3: 0, 4: 0, 5: 0, count: 1, mean: 3, timestamp: Date.now() }]
      };

      tick(1000);
      gatherOsMetrics(io, span);

      span.responses.length.should.equal(1);
    });
  });
});

/* Keeps the event loop busy for `ms` milliseconds (synchronously). */
const busyFor = ms => {
  const end = process.hrtime.bigint() + BigInt(ms) * 1000000n;

  while (process.hrtime.bigint() < end) {
    // busy wait
  }
};

const lastStat = span => span.os[span.os.length - 1];

describe('gather-os-metrics event loop', () => {
  let gatherOsMetrics;

  before(() => {
    gatherOsMetrics = loadWithFakePidusage();
  });

  after(() => {
    delete require.cache[require.resolve('pidusage')];
  });

  const newSpan = () => ({ interval: 1, retention: 60, os: [], responses: [] });
  const io = { emit: () => undefined };

  it('reports the time spent in the event loop without any native dependency', () => {
    const span = newSpan();

    gatherOsMetrics(io, span);
    busyFor(60);
    gatherOsMetrics(io, span);

    const { loop } = lastStat(span);

    loop.sum.should.be.at.least(50);
    loop.utilization.should.be.within(0, 1);
  });

  it('has no event loop value on the first collection of a span', () => {
    const span = newSpan();

    gatherOsMetrics(io, span);

    lastStat(span).should.not.have.property('loop');
  });

  it('measures each span over its own interval', () => {
    const fast = newSpan();
    const slow = newSpan();

    gatherOsMetrics(io, fast);
    gatherOsMetrics(io, slow);
    busyFor(60);
    gatherOsMetrics(io, fast);
    gatherOsMetrics(io, slow);

    lastStat(fast).loop.sum.should.be.at.least(50);
    lastStat(slow).loop.sum.should.be.at.least(50);
  });
});
