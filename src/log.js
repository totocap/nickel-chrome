let LOGGER = null
let LEVEL = 'default'

exports.setSilent = () => (LEVEL = 'silent')

exports.setLogger = function(logger) {
  LOGGER = logger
}

exports.log = function log(msg, opt) {
  LOGGER.log(JSON.stringify({msg, ...opt}))
}

exports.error = function logError(msg, opt) {
  LOGGER.error(JSON.stringify({msg, ...opt}))
}
