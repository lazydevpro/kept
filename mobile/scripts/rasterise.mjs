/**
 * SVG → PNG, used by build-brand-assets.py when rsvg-convert is not installed.
 *
 *     node scripts/rasterise.mjs <input.svg> <output.png> <size>
 *
 * librsvg is a system package and there is no usable Windows build of it, so the brand
 * assets could not be regenerated on a Windows machine at all. resvg ships prebuilt
 * binaries through npm and renders this artwork identically — it is a gradient over a
 * mask, which is the only feature the sources rely on.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const [input, output, size] = process.argv.slice(2)

if (!input || !output || !size) {
  console.error('usage: node scripts/rasterise.mjs <input.svg> <output.png> <size>')
  process.exit(1)
}

const svg = readFileSync(input, 'utf8')
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: Number(size) } })
writeFileSync(output, resvg.render().asPng())
