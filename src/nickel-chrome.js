const { version } = require('../package.json')
const scheduler = require('./scheduler')
const parseBody = require('./parseBody')
const log = require('./log')
const createServer = require('./createServer')

const minimalHtml = "<!doctype html><html lang=en><head><meta charset=utf-8><title>blah</title></head><body><p>I'm the content</p></body></html>"

module.exports = nickelChrome = ({port, nbWorkers, ...config}) => {
  if (config.logguer) {
    log.setLogguer(config.logguer)
  }

  log.log(`
     ╔═════════════════════╗
     ║                   ║
     ║   NICKEL-CHROME   ║
     ║                   ║
     ╟─────────────────────╢
     ║ ${version}             ║
     ╚═════════════════════╝
  `)

  scheduler.launchWorkers(nbWorkers)

  createServer(port, async (req, res) => {
    try {
      log.log('Receiving request')
      const now = Date.now()

      // Get body, or use dummy html if it's an healthcheck
      let payload = await parseBody(req)
      if (['HEAD', 'GET'].includes(req.method) && req.url === '/healthcheck') {
        payload = {
          html: minimalHtml,
        }
      }

      // Actually ask chrome workers for the screenshot
      const base64 = await scheduler.screenshot(payload)
      log.log(`Screenshot done in ${Date.now() - now}ms`)

      // Send response to client
      res.writeHead(200)
      res.end(base64)
    } catch (err) {
      log.error(err)
      res.writeHead(500)
      res.end('KO')
    }
  })
}

async function onExit() {
  await scheduler.stopWorkers()
  process.exit()
}

process.on('exit', onExit)
process.on('SIGINT', onExit)
