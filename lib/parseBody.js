const log = require('./log');

module.exports = function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        const body = JSON.parse(data);
        resolve(body);
      } catch (err) {
        log.log('Catch error in parseBody :', { err });
        reject(err);
      }
    });
  });
};