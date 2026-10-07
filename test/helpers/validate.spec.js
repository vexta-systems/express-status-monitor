/* eslint-disable no-unused-expressions */
const chai = require('chai');

chai.should();

const defaultConfig = require('../../src/helpers/default-config');
const validate = require('../../src/helpers/validate');

describe('validate', () => {
  describe('when config is null or undefined', () => {
    const config = validate();

    it(`then title === ${defaultConfig.title}`, () => {
      config.title.should.equal(defaultConfig.title);
    });

    it(`then path === ${defaultConfig.path}`, () => {
      config.path.should.equal(defaultConfig.path);
    });

    it(`then spans === ${JSON.stringify(defaultConfig.spans)}`, () => {
      config.spans.should.equal(defaultConfig.spans);
    });

    it('then port === null', () => {
      chai.expect(config.port).to.be.null;
    });

    it('then websocket === null', () => {
      chai.expect(config.websocket).to.be.null;
    });
  });

  describe('when config is invalid', () => {
    const config = validate({ title: true, path: false, spans: 'not-an-array', port: 'abc', websocket: false });

    it(`then title === ${defaultConfig.title}`, () => {
      config.title.should.equal(defaultConfig.title);
    });

    it(`then path === ${defaultConfig.path}`, () => {
      config.path.should.equal(defaultConfig.path);
    });

    it(`then spans === ${JSON.stringify(defaultConfig.spans)}`, () => {
      config.spans.should.equal(defaultConfig.spans);
    });

    it('then port === null', () => {
      chai.expect(config.port).to.be.null;
    });

    it('then websocket === null', () => {
      chai.expect(config.websocket).to.be.null;
    });
  });

  describe('ignoreStartsWith', () => {
    it('keeps the configured prefix even when path is an empty string', () => {
      validate({ path: '', ignoreStartsWith: '/status' }).ignoreStartsWith.should.equal('/status');
    });

    it(`falls back to ${defaultConfig.ignoreStartsWith} when not configured`, () => {
      validate({ path: '' }).ignoreStartsWith.should.equal(defaultConfig.ignoreStartsWith);
    });
  });

  describe('chartVisibility', () => {
    it('hiding a chart in one config does not hide it in configs created later', () => {
      validate({ chartVisibility: { cpu: false } }).chartVisibility.cpu.should.equal(false);

      validate({ chartVisibility: {} }).chartVisibility.cpu.should.equal(true);
      validate().chartVisibility.cpu.should.equal(true);
    });
  });

  describe('assetsPath and pagePath', () => {
    it('default to path when path is set', () => {
      const config = validate({ path: '/monitor' });

      config.assetsPath.should.equal('/monitor');
      config.pagePath.should.equal('/monitor');
    });

    it(`default to ${defaultConfig.path} when path is empty`, () => {
      const config = validate({ path: '' });

      config.assetsPath.should.equal(defaultConfig.path);
      config.pagePath.should.equal(defaultConfig.path);
    });

    it('use the configured values', () => {
      const config = validate({ path: '', assetsPath: '/assets', pagePath: '/painel' });

      config.assetsPath.should.equal('/assets');
      config.pagePath.should.equal('/painel');
    });
  });

  describe('when config is valid', () => {
    const customConfig = { title: 'Custom title', path: '/custom-path', spans: [{}, {}, {}], port: 9999, websocket: {} };
    const config = validate(customConfig);

    it(`then title === ${customConfig.title}`, () => {
      config.title.should.equal(customConfig.title);
    });

    it(`then path === ${customConfig.path}`, () => {
      config.path.should.equal(customConfig.path);
    });

    it(`then spans === ${JSON.stringify(customConfig.spans)}`, () => {
      config.spans.should.equal(customConfig.spans);
    });

    it('then websocket === {}', () => {
      config.websocket.should.deep.equal({});
    });

    it(`then port === ${customConfig.port}`, () => {
      config.port.should.equal(customConfig.port);
    });
  });
});
