var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const debug = require('debug')('nickel-chrome');

let LOGGER = null;
let LEVEL = 'default';

exports.setSilent = () => LEVEL = 'silent';

exports.setLogger = function (logger) {
  LOGGER = logger;
};

exports.log = function log(msg, opt) {
  LOGGER.log(JSON.stringify(_extends({ msg }, opt)));
};

exports.error = function logError(msg, opt) {
  LOGGER.error(JSON.stringify(_extends({ msg }, opt)));
};