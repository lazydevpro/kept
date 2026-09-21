/**
 * Runs Lighthouse against the built site and checks it against the spec's budget.
 *
 * The thresholds are `docs/plans/landing-page.md` §9 — they are the acceptance criteria, not
 * advice, so this exits non-zero when one is missed. Mobile throttling is the default because
 * that is the run that fails first; a desktop 100 proves very little.
 *
 * Usage: `npm run preview` in one terminal, then `npm run audit` in another.
 *   node scripts/lighthouse.mjs [url] [--desktop]
 */

import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'

const args = process.argv.slice(2)
const desktop = args.includes('--desktop')
const url = args.find((a) => !a.startsWith('--')) ?? 'http://localhost:8788'

/** Performance can wobble a point or two between runs; the rest should not move at all. */
const FLOORS = { performance: 0.95, accessibility: 1, 'best-practices': 1, seo: 1 }
const WEIGHT_BUDGET_KB = 1024

const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'] })

try {
  const { lhr } = await lighthouse(
    url,
    { port: chrome.port, output: 'json', logLevel: 'error' },
    desktop
      ? {
          extends: 'lighthouse:default',
          settings: {
            formFactor: 'desktop',
            screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
            throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
          },
        }
      : undefined,
  )

  const transferredKb = Math.round((lhr.audits['total-byte-weight']?.numericValue ?? 0) / 1024)
  const failures = []

  console.log(`\n  ${url}  (${desktop ? 'desktop' : 'mobile, throttled'})\n`)

  for (const [key, floor] of Object.entries(FLOORS)) {
    const score = lhr.categories[key]?.score ?? 0
    const ok = score >= floor
    if (!ok)
      failures.push(`${lhr.categories[key].title} ${Math.round(score * 100)} < ${Math.round(floor * 100)}`)
    console.log(`  ${ok ? '✓' : '✗'} ${lhr.categories[key].title.padEnd(16)} ${Math.round(score * 100)}`)
  }

  const weightOk = transferredKb <= WEIGHT_BUDGET_KB
  if (!weightOk) failures.push(`${transferredKb}KB transferred > ${WEIGHT_BUDGET_KB}KB budget`)
  console.log(
    `  ${weightOk ? '✓' : '✗'} ${'Transferred'.padEnd(16)} ${transferredKb}KB / ${WEIGHT_BUDGET_KB}KB`,
  )

  for (const metric of [
    'first-contentful-paint',
    'largest-contentful-paint',
    'cumulative-layout-shift',
    'total-blocking-time',
  ]) {
    const audit = lhr.audits[metric]
    if (audit) console.log(`    ${audit.title.padEnd(28)} ${audit.displayValue ?? '—'}`)
  }

  if (failures.length) {
    console.error(`\n  Missed ${failures.length} of the §9 criteria:`)
    for (const f of failures) console.error(`    · ${f}`)
    console.error('')
    process.exitCode = 1
  } else {
    console.log('\n  All §9 thresholds met.\n')
  }
} finally {
  await chrome.kill()
}
