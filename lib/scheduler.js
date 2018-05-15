let launchWorker = (() => {
  var _ref = _asyncToGenerator(function* () {
    const browser = yield puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    workers.push({ browser, isAvailable: true });
    log.log(`Launched worker (total: ${workers.length})`);
  });

  return function launchWorker() {
    return _ref.apply(this, arguments);
  };
})();

let getAvailableWorker = (() => {
  var _ref2 = _asyncToGenerator(function* (maxRetry = 10) {
    if (!maxRetry) {
      throw new Error('No available browsers.');
    }
    const browser = workers.find(function (w) {
      return w.isAvailable;
    });
    if (browser) {
      return browser;
    }
    yield wait();
    return getAvailableWorker(maxRetry - 1);
  });

  return function getAvailableWorker() {
    return _ref2.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const puppeteer = require('puppeteer');

const log = require('./log');
const screenshot = require('./screenshot');

let workers = [];

function wait(ms = 200) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

exports.launchWorkers = (() => {
  var _ref3 = _asyncToGenerator(function* (nb = 5) {
    log.log('Launching workers');
    for (let i = 0; i < nb; i++) {
      yield launchWorker();
    }
  });

  return function () {
    return _ref3.apply(this, arguments);
  };
})();

exports.stopWorkers = _asyncToGenerator(function* () {
  if (!workers.length) {
    return;
  }
  for (let i = 0; i < workers.length; i++) {
    try {
      // for some reason, sometimes close fail (but no zombie process)
      yield workers[i].browser.close();
    } catch (err) {} // eslint-disable-line no-empty
  }
  log.log(`Stopped ${workers.length} workers`);
  workers = [];
});

exports.screenshot = (() => {
  var _ref5 = _asyncToGenerator(function* (payload) {
    const worker = yield getAvailableWorker();
    worker.isAvailable = false;
    const buffer = yield screenshot(worker.browser, payload);
    worker.isAvailable = true;
    return buffer;
  });

  return function (_x) {
    return _ref5.apply(this, arguments);
  };
})();