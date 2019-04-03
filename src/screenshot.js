const sharp = require('sharp')
const log = require('./log')

function assignStyle(e, styles) {
  for (const i in styles) {
    if (!styles.hasOwnProperty(i)) {
      continue
    }
    e.style[i] = styles[i]
  }
}

async function injectStyles(page, styles) {
  for (const i in styles) {
    if (!styles.hasOwnProperty(i)) {
      continue
    }
    await page.$eval(i, assignStyle, styles[i])
  }
}

function getClip(page, selector) {
  return page.$eval(selector, el => {
    const rect = el.getBoundingClientRect()
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
  })
}

function waitLoad(page, loadTimeout) {
  return new Promise(resolve => {
    const t = setTimeout(resolve, loadTimeout)
    page.on('load', () => {
      clearTimeout(t)
      resolve()
    })
  })
}

module.exports = async function screenshot(browser, options) {
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
    loadTimeout = 300,
  } = options

  const { width: pageWidth = 650, height: pageHeight = 650, fullPage = false } = viewportSize

  const page = await browser.newPage()
  await page.setViewport({ width: pageWidth, height: pageHeight })

  if (!isWatchdog) log.log('Page content', { html, requestID })
  await page.setContent(html)
  if (!isWatchdog) log.log('Wait for page to load', { requestID })
  await waitLoad(page, loadTimeout)

  if (!isWatchdog) log.log('Clip the page', { requestID, selector })
  const clip = selector ? await getClip(page, selector) : null

  if (!isWatchdog) log.log('Inject styles', { requestID })
  // eventually inject custom styles
  await injectStyles(page, styles)

  if (!isWatchdog) log.log('Get screenshot', { requestID })
  let buffer = await page.screenshot({
    fullPage: fullPage && !clip,
    ...(clip ? { clip } : {}),
  })
  await page.close()

  if (!isWatchdog) log.log('Sharp operations', { requestID })
  // sharp operations
  const shouldSharp = !!resize || !!format
  if (shouldSharp) {
    let img = sharp(buffer)

    // resize image
    if (resize) {
      const { width, height } = resize
      img = img.resize(width, height)
    }

    // image format
    if (format) {
      if (format === 'jpg') {
        img = img.jpeg(formatOptions)
      } else if (format === 'png') {
        img = img.png(formatOptions)
      }
    }
    buffer = await img.toBuffer()
  }

  return buffer.toString('base64')
}
