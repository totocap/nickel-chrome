var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

let injectStyles = (() => {
  var _ref = _asyncToGenerator(function* (page, styles) {
    for (const i in styles) {
      if (!styles.hasOwnProperty(i)) {
        continue;
      }
      yield page.$eval(i, assignStyle, styles[i]);
    }
  });

  return function injectStyles(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const sharp = require('sharp');
const log = require('./log');

function assignStyle(e, styles) {
  for (const i in styles) {
    if (!styles.hasOwnProperty(i)) {
      continue;
    }
    e.style[i] = styles[i];
  }
}

function getClip(page, selector) {
  return page.$eval(selector, el => {
    const rect = el.getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  });
}

function waitLoad(page, loadTimeout) {
  return new Promise(resolve => {
    const t = setTimeout(resolve, loadTimeout);
    page.on('load', () => {
      clearTimeout(t);
      resolve();
    });
  });
}

module.exports = (() => {
  var _ref2 = _asyncToGenerator(function* (browser, options) {
    const {
      html = '',
      isWatchdog,
      viewportSize = {},
      selector,
      styles,
      requestID,
      resize,
      // can be ['jpg', 'png']
      format,
      formatOptions = {},
      loadTimeout = 300
    } = options;

    const { width: pageWidth = 650, height: pageHeight = 650, fullPage = false } = viewportSize;

    const page = yield browser.newPage();
    yield page.setViewport({ width: pageWidth, height: pageHeight });

    if (!isWatchdog) log.log('Page content', { html, requestID });
    yield page.setContent(html);
    if (!isWatchdog) log.log('Wait for page to load', { requestID });
    yield waitLoad(page, loadTimeout);

    if (!isWatchdog) log.log('Clip the page', { requestID, selector });
    const clip = selector ? yield getClip(page, selector) : null;

    if (!isWatchdog) log.log('Inject styles', { requestID });
    // eventually inject custom styles
    yield injectStyles(page, styles);

    if (!isWatchdog) log.log('Get screenshot', { requestID });
    let buffer = yield page.screenshot(_extends({
      fullPage: fullPage && !clip
    }, clip ? { clip } : {}));
    yield page.close();

    if (!isWatchdog) log.log('Sharp operations', { requestID });
    // sharp operations
    const shouldSharp = !!resize || !!format;
    if (shouldSharp) {
      let img = sharp(buffer);

      // resize image
      if (resize) {
        const { width, height } = resize;
        img = img.resize(width, height);
      }

      // image format
      if (format) {
        if (format === 'jpg') {
          img = img.jpeg(formatOptions);
        } else if (format === 'png') {
          img = img.png(formatOptions);
        }
      }
      buffer = yield img.toBuffer();
    }

    return buffer.toString('base64');
  });

  function screenshot(_x3, _x4) {
    return _ref2.apply(this, arguments);
  }

  return screenshot;
})();