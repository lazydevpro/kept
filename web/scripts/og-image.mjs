#!/usr/bin/env node
/**
 * Renders the social share image: `app/opengraph-image.png` and `app/twitter-image.png`.
 *
 * Next picks both up by file convention and writes the <meta> tags. This script exists so the
 * image is reproducible from the brand rather than a one-off export nobody can regenerate — the
 * colours are the token values, the rings are the hero's resting values, and the type is the
 * site's own faces. Run it after changing any of those:
 *
 *   node scripts/og-image.mjs
 *
 * Needs a local Chrome (the same one `npm run audit` uses) and network access for the fonts.
 */

import { writeFile, copyFile } from 'node:fs/promises'
import { launch as launchChrome } from 'chrome-launcher'
import puppeteer from 'puppeteer-core'

const WIDTH = 1200
const HEIGHT = 630

/** Hero's AT_REST, so the share card and the first screen show the same week. */
const RINGS = [
  { value: 0.72, r: 168, from: '#7FC117', to: '#C3F45E', track: '#E4F3C8' },
  { value: 0.34, r: 126, from: '#6A48F0', to: '#AE96FF', track: '#E5E0FB' },
  { value: 0.86, r: 84, from: '#F5502B', to: '#FFA07A', track: '#FBE0D8' },
]
const STROKE = 36

const ring = ({ value, r, from, to, track }, index) => {
  const length = 2 * Math.PI * r
  return `
    <linearGradient id="g${index}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${to}"/><stop offset="1" stop-color="${from}"/>
    </linearGradient>
    <circle cx="200" cy="200" r="${r}" fill="none" stroke="${track}" stroke-width="${STROKE}"/>
    <circle cx="200" cy="200" r="${r}" fill="none" stroke="url(#g${index})" stroke-width="${STROKE}"
      stroke-linecap="round" stroke-dasharray="${length * value} ${length}"
      transform="rotate(-90 200 200)"/>`
}

const html = `<!doctype html>
<html><head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@500&family=Instrument+Serif:ital@1&display=block" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: ${WIDTH}px; height: ${HEIGHT}px; background: #FBFBF4; color: #0B0F0A;
         display: grid; grid-template-columns: 1fr 420px; align-items: center; padding: 0 72px 0 88px; }
  .mark { font: 800 26px/1 Sora; letter-spacing: 0.14em; color: #4D7C0F; margin-bottom: 36px; }
  h1 { font: 700 92px/0.98 Sora; letter-spacing: -0.045em; }
  em { font: italic 400 100px/0.98 'Instrument Serif'; letter-spacing: -0.015em; }
  p { font: 500 28px/1.35 Inter; color: #5A6155; margin-top: 32px; max-width: 18em; }
  svg { width: 400px; height: 400px; filter: drop-shadow(0 24px 40px rgba(42,48,24,0.14)); }
</style></head>
<body>
  <div>
    <div class="mark">KEPT</div>
    <h1>Promises<br><em>compound.</em></h1>
    <p>Invest a little every week, with people who notice.</p>
  </div>
  <svg viewBox="0 0 400 400">${RINGS.map(ring).join('')}</svg>
</body></html>`

const chrome = await launchChrome({ chromeFlags: ['--headless=new', '--no-sandbox'] })
try {
  const browser = await puppeteer.connect({ browserURL: `http://localhost:${chrome.port}` })
  const page = await browser.newPage()
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  const png = await page.screenshot({ type: 'png' })
  await writeFile(new URL('../app/opengraph-image.png', import.meta.url), png)
  await copyFile(
    new URL('../app/opengraph-image.png', import.meta.url),
    new URL('../app/twitter-image.png', import.meta.url),
  )
  await browser.disconnect()
  console.log(`wrote app/opengraph-image.png and app/twitter-image.png (${png.length} bytes)`)
} finally {
  await chrome.kill()
}
