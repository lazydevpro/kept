import { SCORE_BPM, SECTION, TOTAL_BEATS } from './cues'

/**
 * The music the film can be laid against. The picture is counted in beats, so a track only
 * has to say how fast it goes and which parts of it play where — the film retimes itself.
 *
 * A track not written for the film is cut the way an editor would cut it: a list of edits,
 * each starting on a film beat and playing the file from a point on its own beat grid.
 * `null` is silence. Measure a new file with `node scripts/track-info.mjs <file>`.
 */
export type Edit = { beat: number; from: number | null }

export type Track = {
  id: string
  label: string
  /** Path under `public/`. */
  src: string
  bpm: number
  edits: Edit[]
  /** Linear level under the effects. Commercial masters run hot; the effects were mixed against the score. */
  gain?: number
  /** Where it came from and what its licence asks for. */
  credit?: string
}

/** Seconds of a track's own beat `n`, given its first beat and tempo. */
const grid = (first: number, bpm: number) => (beat: number) => first + (beat * 60) / bpm

// NastelBom – Product: 140.1 BPM, first beat at 0.096s. Measured, then the section edges
// read off the bar table: build from bar 9, full drop after a gap at bar 17, breakdown at
// bar 41, second drop at bar 49 — 8-bar phrases, drops exactly 32 bars apart.
const PRODUCT_BPM = 140.1
const product = grid(0.096, PRODUCT_BPM)

export const TRACKS: Track[] = [
  {
    id: 'score',
    label: 'Composed score',
    src: 'next-week/score.wav',
    bpm: SCORE_BPM,
    // Written to the film, silence included — it plays straight through.
    edits: [{ beat: 0, from: 0 }],
  },
  {
    id: 'product',
    label: 'NastelBom – Product',
    src: 'next-week/music/nastelbom-product.mp3',
    bpm: PRODUCT_BPM,
    gain: 0.6,
    edits: [
      // The build, from bar 11, so the film's hard stop lands just short of the track's drop.
      { beat: 0, from: product(11 * 4) },
      { beat: SECTION.stop, from: null },
      // The drop on the drop: the ring turns green on the track's first full bar.
      { beat: SECTION.drop, from: product(17 * 4) },
      // Into the breakdown as the moment is shared, so the second drop arrives with the year.
      { beat: SECTION.shared, from: product(41 * 4) },
    ],
    credit:
      'NastelBom – "Product", Pixabay Content License (no attribution required). Content ID registered: YouTube may show a claim.',
  },
]

export const FPS = 30
export const TAIL_SECONDS = 1.5

export const framesPerBeat = (bpm: number) => (FPS * 60) / bpm
export const filmFrames = (bpm: number) =>
  Math.ceil(TOTAL_BEATS * framesPerBeat(bpm) + TAIL_SECONDS * FPS)

/** Whether a track has silence cut into it — the film then adds its own swell under the turn. */
export const hasSilence = (track: Track) => track.edits.some((e) => e.from === null)
