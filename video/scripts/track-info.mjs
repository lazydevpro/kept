/**
 * Measures a music file for `src/next-week/tracks.ts`: its tempo, where its beats fall, and
 * how loud each bar is — enough to choose where the film's intro and drop should sit.
 *
 *   node scripts/track-info.mjs public/next-week/music/some-track.mp3
 *
 * Tempo comes from autocorrelating an onset envelope; the beat phase from the offset that best
 * lines a grid up with the onsets. Section boundaries are left to a person reading the bar
 * table — a drop is where the loudness jumps on a downbeat.
 */

import { spawnSync } from 'node:child_process'

const file = process.argv[2]
if (!file) {
  console.error('usage: node scripts/track-info.mjs <audio file>')
  process.exit(1)
}

const SR = 11025
const HOP = 128
const pcm = spawnSync(
  'ffmpeg',
  ['-nostdin', '-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'],
  {
    maxBuffer: 1 << 30,
  },
)
if (pcm.status !== 0) {
  console.error(pcm.stderr.toString())
  process.exit(1)
}
const x = new Float32Array(pcm.stdout.buffer, pcm.stdout.byteOffset, pcm.stdout.byteLength / 4)
const seconds = x.length / SR

// Onset strength: positive change in short-time energy, low band weighted (kicks carry the grid).
const frames = Math.floor(x.length / HOP)
const energy = new Float32Array(frames)
const low = new Float32Array(frames)
const power = new Float32Array(frames)
const lowPower = new Float32Array(frames)
let lp = 0
for (let f = 0; f < frames; f++) {
  let e = 0
  let l = 0
  for (let i = f * HOP; i < (f + 1) * HOP; i++) {
    e += x[i] * x[i]
    lp += 0.06 * (x[i] - lp)
    l += lp * lp
  }
  energy[f] = Math.log1p(e * 100)
  low[f] = Math.log1p(l * 400)
  power[f] = e / HOP
  lowPower[f] = l / HOP
}
const onset = new Float32Array(frames)
for (let f = 1; f < frames; f++)
  onset[f] = Math.max(0, energy[f] - energy[f - 1]) + 1.5 * Math.max(0, low[f] - low[f - 1])

// Tempo: autocorrelation over 70–180 BPM, folded into 90–180.
const fps = SR / HOP
let best = { bpm: 0, score: -Infinity }
const scores = []
for (let bpm = 70; bpm <= 180; bpm += 0.05) {
  const lag = (60 / bpm) * fps
  let s = 0
  for (let f = 0; f + lag * 4 < frames - 2; f++) {
    const a = onset[f]
    const lerp = (k) => {
      const p = f + lag * k
      const i = Math.floor(p)
      return onset[i] + (onset[i + 1] - onset[i]) * (p - i)
    }
    s += a * (lerp(1) + 0.5 * lerp(2) + 0.25 * lerp(4))
  }
  scores.push([bpm, s])
  if (s > best.score) best = { bpm, score: s }
}
let bpm = best.bpm
if (!(bpm > 0)) {
  console.error('Could not find a tempo.')
  process.exit(1)
}
while (bpm < 90) bpm *= 2
while (bpm > 180) bpm /= 2

// Phase: the offset of a beat grid that collects the most onset.
const period = (60 / bpm) * fps
let phase = { t: 0, score: -Infinity }
for (let off = 0; off < period; off += 0.25) {
  let s = 0
  for (let p = off; p < frames - 1; p += period) {
    const i = Math.floor(p)
    s += Math.max(onset[i], onset[i + 1])
  }
  if (s > phase.score) phase = { t: off / fps, score: s }
}

const beat = 60 / bpm
console.log(`file      ${file}`)
console.log(`duration  ${seconds.toFixed(2)}s`)
console.log(
  `tempo     ${bpm.toFixed(2)} BPM  (beat ${beat.toFixed(4)}s, bar ${(beat * 4).toFixed(3)}s)`,
)
console.log(`first beat on the grid at ${phase.t.toFixed(3)}s`)
console.log('')
console.log('bar  starts     level  low     (dB RMS)')
const db = (from, to, band) => {
  const a = Math.max(0, Math.floor(from * fps))
  const b = Math.min(frames, Math.floor(to * fps))
  let sum = 0
  for (let f = a; f < b; f++) sum += band[f]
  return 10 * Math.log10(sum / Math.max(1, b - a) + 1e-12)
}
for (let k = 0, t = phase.t; t + beat * 4 <= seconds + 0.01; k++, t += beat * 4) {
  const level = db(t, t + beat * 4, power)
  const bass = db(t, t + beat * 4, lowPower)
  const meter = '█'.repeat(Math.max(0, Math.round((level + 30) * 1.2)))
  console.log(
    `${String(k).padStart(3)}  ${t.toFixed(2).padStart(7)}s  ${level.toFixed(1).padStart(5)}  ${bass.toFixed(1).padStart(5)}  ${meter}`,
  )
}
