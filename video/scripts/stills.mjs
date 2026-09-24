/**
 * Renders stills of "Next week" at given beats, from one bundle — for checking hand-offs
 * without rendering the whole film.
 *
 *   node scripts/stills.mjs 22 22.5 36.4        # beats
 *   node scripts/stills.mjs --track=score 80
 *
 * Writes out/stills/b<beat>.png. The score's tempo is assumed unless a track is given.
 */

import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const track = (args.find((a) => a.startsWith('--track=')) ?? '--track=score').slice(8)
const beats = args.filter((a) => !a.startsWith('--')).map(Number)
const id = track === 'score' ? 'NextWeek' : `NextWeek-${track}`

const serveUrl = await bundle({
  entryPoint: path.resolve('src/index.ts'),
  publicDir: path.resolve('public'),
  // Same alias as remotion.config.ts: `@/` is the web workspace.
  webpackOverride: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: { ...(config.resolve?.alias ?? {}), '@': path.resolve('..', 'web') },
    },
  }),
})

const inputProps = { track }
const composition = await selectComposition({ serveUrl, id, inputProps })
const fpb = (composition.fps * 60) / (track === 'score' ? 120 : Number(process.env.BPM ?? 120))

mkdirSync('out/stills', { recursive: true })
for (const beat of beats) {
  const frame = Math.min(Math.round(beat * fpb), composition.durationInFrames - 1)
  await renderStill({ composition, serveUrl, output: `out/stills/b${beat}.png`, frame, inputProps })
  console.log(`b${beat} → frame ${frame}`)
}
