/**
 * Proves criteria 4 and 5 of docs/plans/landing-page.md §9 against the real built site.
 *
 * Reduced-motion support is the kind of thing that is easy to claim and easy to silently
 * break — one section that forgets the gate, and the promise is gone with nothing failing.
 * So it is checked the same way a user would check it: load the page with the media feature
 * emulated both ways, scroll, and look at what actually moved.
 *
 * Usage: `npm run preview` in one terminal, then `node scripts/check-motion.mjs`.
 */

import { launch as launchChrome } from 'chrome-launcher'
import puppeteer from 'puppeteer-core'

const url = process.argv[2] ?? 'http://localhost:8788'
const failures = []

const check = (ok, label, detail = '') => {
  if (!ok) failures.push(label)
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? `  ${detail}` : ''}`)
}

const chrome = await launchChrome({ chromeFlags: ['--headless=new', '--no-sandbox'] })
const browser = await puppeteer.connect({ browserURL: `http://localhost:${chrome.port}` })

/** Scrolls with a real wheel event — Lenis intercepts those, `window.scrollTo` it swallows. */
async function measure(preference) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: preference }])
  await page.goto(url, { waitUntil: 'networkidle0' })

  await page.mouse.move(700, 450)
  for (let i = 0; i < 6; i += 1) {
    await page.mouse.wheel({ deltaY: 160 })
    await new Promise((r) => setTimeout(r, 120))
  }
  await new Promise((r) => setTimeout(r, 900))

  const result = await page.evaluate(() => {
    const copy = document.querySelector('[class*="hero-module"][class*="copy"], [class*="copy"]')
    const heading = document.querySelector('h1')
    const style = copy ? getComputedStyle(copy) : null
    const box = heading?.getBoundingClientRect()
    return {
      lenisActive: document.documentElement.classList.contains('lenis'),
      transform: style?.transform ?? 'none',
      opacity: style ? Number(style.opacity) : 1,
      scrollY: Math.round(window.scrollY),
      headingVisible: !!box && box.width > 0 && box.height > 0,
      headingText: heading?.textContent?.trim() ?? '',
    }
  })

  await page.close()
  return result
}

try {
  console.log(`\n  ${url}\n`)

  console.log('  prefers-reduced-motion: no-preference')
  const full = await measure('no-preference')
  check(full.lenisActive, 'Lenis is driving the scroll', '(html.lenis)')
  check(full.scrollY > 0, 'the page scrolled', `(${full.scrollY}px)`)
  check(full.transform !== 'none', 'ScrollTrigger moved the hero copy', `(${full.transform})`)
  check(full.opacity < 1, 'and faded it', `(opacity ${full.opacity.toFixed(2)})`)

  console.log('\n  prefers-reduced-motion: reduce')
  const reduced = await measure('reduce')
  check(!reduced.lenisActive, 'Lenis did not initialise — native scroll', '(no html.lenis)')
  check(reduced.scrollY > 0, 'the page still scrolls', `(${reduced.scrollY}px)`)
  check(reduced.transform === 'none', 'nothing transformed the hero copy', `(${reduced.transform})`)
  check(reduced.opacity === 1, 'nothing faded it', `(opacity ${reduced.opacity})`)
  check(reduced.headingVisible, 'the headline is still laid out and legible')
  check(reduced.headingText.startsWith('Promises'), 'with its text intact', `("${reduced.headingText}")`)

  console.log('\n  Keyboard')
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(url, { waitUntil: 'networkidle0' })
  const order = []
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press('Tab')
    order.push(
      await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return null

        // Walk up as well as checking the element itself. A composite control — the amount
        // field with its currency sign and unit suffix — draws one ring around the whole row
        // via `:focus-within`, which is the correct place for it. Testing only the focused
        // node would report that as unfocusable and push us into ringing part of a control.
        let node = el
        let outlined = false
        for (let depth = 0; node && depth < 4; depth += 1) {
          const style = getComputedStyle(node)
          if (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) {
            outlined = true
            break
          }
          node = node.parentElement
        }

        return {
          text: (el.textContent ?? '').trim().slice(0, 28),
          tag: el.tagName.toLowerCase(),
          outlined,
        }
      }),
    )
  }
  await page.close()

  const focused = order.filter(Boolean)
  check(focused.length >= 3, 'tab reaches every interactive element', `(${focused.length} stops)`)
  check(
    focused[0]?.text.startsWith('Skip'),
    'the skip link comes first',
    focused[0] ? `("${focused[0].text}")` : '',
  )
  check(
    focused.every((f) => f.outlined),
    'every focus stop draws a visible ring',
  )

  if (failures.length) {
    console.error(`\n  ${failures.length} check(s) failed.\n`)
    process.exitCode = 1
  } else {
    console.log('\n  Criteria 4 and 5 hold.\n')
  }
} finally {
  browser.disconnect()
  await chrome.kill()
}
