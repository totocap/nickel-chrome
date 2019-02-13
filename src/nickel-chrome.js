const { version } = require('../package.json')
const scheduler = require('./scheduler')
const parseBody = require('./parseBody')
const log = require('./log')
const createServer = require('./createServer')

const minimalHtml = "<!doctype html><html lang=en><head><meta charset=utf-8><title>blah</title></head><body><p>I'm the content</p></body></html>"

module.exports = nickelChrome = ({port, nbWorkers, ...config}) => {
  if (config.logger) {
    log.setLogger(config.logger)
  }

  log.log(`Starting...`)

  scheduler.launchWorkers(nbWorkers)

  createServer(port, async (req, res) => {
    const requestID = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
    try {
      const now = Date.now()

      // Get body, or use dummy html if it's an healthcheck
      let payload = null
      if (['HEAD', 'GET'].includes(req.method) && req.url === '/healthcheck') {
        payload = {
          html: minimalHtml,
        }
      } else {
        log.log('Receiving request', { requestID })
        payload = await parseBody(req)
        log.log('Parsed request', { requestID, payload })
      }

      // Actually ask chrome workers for the screenshot
      const base64 = await scheduler.screenshot(payload)
      log.log('Generated screenshot', { requestID, base64, duration: Date.now() - now })

      // Send response to client
      res.writeHead(200)
      res.end(base64)
    } catch (err) {
      log.error(err.message, { requestID, stack: err.stack })

      res.writeHead(500)
      res.end('KO')
    }
  })
}

async function onExit() {
  log.error('Whole process exiting')
  await scheduler.stopWorkers()
  process.exit()
}

process.on('exit', onExit)
process.on('SIGINT', onExit)
