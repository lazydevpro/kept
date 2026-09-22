/**
 * KEPT — the troop film. A social/marketing piece, not the product launch film.
 *
 * Source is a single 20.01s / 24fps generated clip, `public/troop.mp4`.
 *
 * ── Where the shots actually are ──
 *
 * Scene detection gives cut *boundaries*, and the boundaries are not where the beats are.
 * Two moments that matter happen mid-shot, and an earlier version of this file put both
 * captions on the wrong picture by assuming otherwise:
 *
 *   0.000  lone ape in the mist
 *   1.958  two hands, one stick — intact
 *   2.500  ↳ IT BREAKS. Mid-shot, not on a cut.
 *   4.500  the troop comes through the trees
 *   5.958  one ape straining against a bound bundle — it holds
 *   7.200  ↳ fists go up. Also mid-shot.
 *   8.458  the troop wide, advancing
 *  11.958  two apes face each other, one offers a hand
 *  13.958  pinkies hook
 *  17.917  linked, turning to camera
 *  20.010  end
 *
 * Verified by pulling frames either side of each, not by reading the detector's output.
 *
 * ── The register ──
 *
 * Every shot is used, roar included. The joke is the gap between the footage and the words:
 * epic primate cinema, and captions about a twenty-dollar weekly habit. Deadpan over absurd
 * is funnier than absurd over absurd, and it is the only version where someone who clicks
 * through does not find a product that contradicts the ad.
 *
 * So the footage is the meme and the copy stays flat. Nothing ever says ape, nothing winks.
 * The two `Week` cards carry the whole gag by contrast, and each one is timed to land on the
 * frame where the picture turns — "Week 3." on the break, "Week 40." on the fists.
 *
 * The composition runs at the source's 24fps so footage frames map 1:1 and nothing is
 * resampled. `rate` below 1 slows a shot; nothing goes under 0.85, because duplicated frames
 * start to judder past that.
 */

export const FPS = 24
const SRC_FPS = 24

/** Seconds in the source → frames. */
const at = (seconds: number) => Math.round(seconds * SRC_FPS)

export type Shot = {
  id: string
  from: number
  to: number
  /** <1 slows the shot down. */
  rate: number
  note: string
}

export const SHOTS = {
  alone: { id: 'alone', from: at(0), to: at(1.958), rate: 0.85, note: 'lone ape in the mist' },
  stick: { id: 'stick', from: at(1.958), to: at(4.5), rate: 0.9, note: 'one stick, and it breaks' },
  arrive: { id: 'arrive', from: at(4.5), to: at(5.958), rate: 0.9, note: 'the troop arrives' },
  bundle: { id: 'bundle', from: at(5.958), to: at(7.4), rate: 0.85, note: 'the bundle holds' },
  fists: { id: 'fists', from: at(7.4), to: at(8.458), rate: 0.85, note: 'fists up' },
  standing: { id: 'standing', from: at(8.458), to: at(10.5), rate: 0.95, note: 'the troop, wide' },
  offer: { id: 'offer', from: at(11.958), to: at(13.958), rate: 0.9, note: 'a hand offered' },
  hook: { id: 'hook', from: at(13.958), to: at(17.917), rate: 0.85, note: 'pinkies hook' },
  linked: { id: 'linked', from: at(17.917), to: at(20.01), rate: 0.9, note: 'linked, to camera' },
} satisfies Record<string, Shot>

/** On-screen duration once `rate` is applied. */
export const screenFrames = (shot: Shot) => Math.round((shot.to - shot.from) / shot.rate)

export type Caption = {
  text: string
  /** Set in Instrument Serif italic — the accent word. */
  serif?: string
  atFrame?: number
  /** `punch` is the big centred beat; `lower` is the quiet line along the bottom. */
  place?: 'lower' | 'punch'
}

export type Segment =
  | { kind: 'shot'; shot: Shot; caption?: Caption }
  | { kind: 'bridge'; durationInFrames: number; caption: string }
  | { kind: 'end'; durationInFrames: number }

/**
 * `atFrame` on the two punches is computed, not guessed:
 *   break  — source 2.500s is local source frame (2.500 - 1.958) * 24 = 13, and at rate 0.9
 *            that is composition frame 13 / 0.9 ≈ 14.
 *   fists  — `fists` starts exactly on the turn, so frame 1 is enough to avoid pre-empting it.
 */
export const TIMELINE: Segment[] = [
  {
    kind: 'shot',
    shot: SHOTS.alone,
    caption: { text: 'Investing', serif: 'alone.', atFrame: 14, place: 'lower' },
  },
  { kind: 'shot', shot: SHOTS.stick, caption: { text: 'Week 3.', atFrame: 14, place: 'punch' } },
  { kind: 'shot', shot: SHOTS.arrive },
  {
    kind: 'shot',
    shot: SHOTS.bundle,
    caption: { text: 'Investing with people who', serif: 'notice.', atFrame: 3, place: 'lower' },
  },
  { kind: 'shot', shot: SHOTS.fists, caption: { text: 'Week 40.', atFrame: 1, place: 'punch' } },
  { kind: 'shot', shot: SHOTS.standing },
  { kind: 'shot', shot: SHOTS.offer },
  // The pinky promise is KEPT's actual mark. It plays clean, with nothing over it.
  { kind: 'shot', shot: SHOTS.hook },
  { kind: 'shot', shot: SHOTS.linked },
  {
    kind: 'bridge',
    durationInFrames: Math.round(3.4 * FPS),
    caption: 'Invest a little every week, with people who notice.',
  },
  { kind: 'end', durationInFrames: Math.round(3.2 * FPS) },
]

export const segmentFrames = (segment: Segment) =>
  segment.kind === 'shot' ? screenFrames(segment.shot) : segment.durationInFrames

/** Cumulative start frame for each segment. */
export const OFFSETS = TIMELINE.reduce<number[]>((acc, segment, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1]! + segmentFrames(TIMELINE[i - 1]!))
  return acc
}, [])

export const TOTAL_FRAMES =
  OFFSETS[OFFSETS.length - 1]! + segmentFrames(TIMELINE[TIMELINE.length - 1]!)

/** Where the footage stops and the product bridge begins — the audio bed ends here. */
export const FOOTAGE_FRAMES = OFFSETS[TIMELINE.findIndex((s) => s.kind === 'bridge')]!
