const debug = require('debug')('nickel-chrome');
const chalk = require('chalk');

let LOGGUER = null;
let LEVEL = 'default';

function genericLog(msg, type) {
  if (LEVEL === 'silent') {
    return;
  }

  if (LOGGUER) {
    LOGGUER(`${chalk.yellow(`[${new Date().toISOString()}]`)} ${type} ${msg}`); // eslint-disable-line no-console
  } else {
    debug(`${chalk.yellow(`[${new Date().toISOString()}]`)} ${type} ${msg}`); // eslint-disable-line no-console
  }
}

exports.setSilent = () => LEVEL = 'silent';

exports.setLogguer = logguer => LOGGUER = logguer;

exports.log = function log(text) {
  genericLog(text, chalk.blue('[INFO]'));
};

exports.error = function logError(err) {
  genericLog(err.stack || err, chalk.red('[ERROR]'));
};