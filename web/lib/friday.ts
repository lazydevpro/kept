/**
 * One Friday evening in a circle of four, as data.
 *
 * The same discipline as `year.ts`: every figure the section shows comes from here, so the
 * clock, the ring states, the notification stack and the "kept" counter cannot contradict
 * each other. `year.ts` is one year at a glance; this is one evening, which is the scale at
 * which the *social* half of the product actually happens.
 *
 * ── On the copy ──
 *
 * Every notification below is the product's own wording, not marketing written to look like
 * it. The kept cards are the activity-feed row the backend writes (`display_name` +
 * "Kept this week's promise"); the reminder and the nudge are the two push payloads the
 * Worker sends. If the app's copy changes, this should change with it — a page that invents
 * friendlier notifications than the product sends is lying in a small, corrosive way.
 */

export type MemberId = 'maya' | 'sam' | 'dev' | 'you'

export interface Member {
  id: MemberId
  name: string
  /** Their goal ring. Static: only the promise ring moves in this scene. */
  goal: number
  /** Their circle ring. Static for the same reason. */
  circle: number
  /** The point in the evening at which their promise ring finishes closing. */
  keptAt: number
  /** Marks the reader's own card, which is styled as theirs and keeps its promise last. */
  you?: boolean
}

/**
 * Four people, which is the size the product is designed around and the size the copy has
 * used since the manifesto ("four people who notice"). Maya is named in the privacy section
 * too — the same cast across the page reads as one product rather than three mock-ups.
 *
 * "You" keeps last on purpose. The reader watches three people follow through before the
 * page asks anything of them, which is the actual social pressure the app creates.
 */
export const CAST: Member[] = [
  { id: 'maya', name: 'Maya', goal: 0.62, circle: 0.75, keptAt: 0.12 },
  { id: 'sam', name: 'Sam', goal: 0.41, circle: 0.75, keptAt: 0.32 },
  { id: 'dev', name: 'Dev', goal: 0.78, circle: 0.75, keptAt: 0.62 },
  { id: 'you', name: 'You', goal: 0.34, circle: 0.75, keptAt: 0.84, you: true },
]

/** How long a promise ring takes to sweep closed, as a fraction of the evening. */
const FILL = 0.05

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

/** A member's promise ring at time `t`: closed by `keptAt`, sweeping for `FILL` before it. */
export function promiseAt(member: Member, t: number): number {
  return clamp01((t - (member.keptAt - FILL)) / FILL)
}

export type NoteKind = 'kept' | 'reminder' | 'nudge'

export interface Note {
  at: number
  kind: NoteKind
  /** Whose card the note is about — used to light that card as the note lands. */
  who: MemberId
  title: string
  body: string
}

/**
 * The evening, in five cards.
 *
 * Ordered by `at`, and the order is the argument: three people keep theirs, the app reminds
 * you while there is still time, a friend nudges you, and then you keep yours. That is the
 * product's whole retention loop in one screen, and none of it involves a number.
 */
export const NOTES: Note[] = [
  { at: 0.12, kind: 'kept', who: 'maya', title: 'Maya', body: 'Kept this week’s promise' },
  { at: 0.32, kind: 'kept', who: 'sam', title: 'Sam', body: 'Kept this week’s promise' },
  {
    at: 0.5,
    kind: 'reminder',
    who: 'you',
    title: 'Your promise is within reach',
    body: 'A small step this week keeps the rhythm alive.',
  },
  { at: 0.62, kind: 'kept', who: 'dev', title: 'Dev', body: 'Kept this week’s promise' },
  {
    at: 0.72,
    kind: 'nudge',
    who: 'you',
    title: 'A nudge from your circle',
    body: 'Maya is cheering you on. Your week is still open.',
  },
  { at: 0.84, kind: 'kept', who: 'you', title: 'You', body: 'Kept this week’s promise' },
]

export interface Reaction {
  at: number
  on: MemberId
  emoji: string
}

/**
 * The four reactions the app ships, and no others — there is no comment box in the product
 * and there is none here.
 *
 * Reactions accumulate and never clear. That is true to the app, where a reaction is a row
 * in the database rather than a transient effect, and it means the resting state of this
 * section is the full picture: every ring closed, every cheer still on the card.
 */
export const REACTIONS: Reaction[] = [
  { at: 0.18, on: 'maya', emoji: '👏' },
  { at: 0.21, on: 'maya', emoji: '💜' },
  { at: 0.38, on: 'sam', emoji: '🔥' },
  { at: 0.41, on: 'sam', emoji: '👏' },
  { at: 0.67, on: 'dev', emoji: '🙌' },
  // All three land on the reader at once. The payoff of the scene is being noticed.
  { at: 0.9, on: 'you', emoji: '👏' },
  { at: 0.92, on: 'you', emoji: '💜' },
  { at: 0.94, on: 'you', emoji: '🔥' },
]

const START_MINUTES = 17 * 60 + 4
const END_MINUTES = 21 * 60 + 40

/** The wall clock, so the scene reads as an evening rather than an abstract timeline. */
export function clockAt(t: number): string {
  const total = Math.round(START_MINUTES + clamp01(t) * (END_MINUTES - START_MINUTES))
  const hours24 = Math.floor(total / 60)
  const minutes = total % 60
  const hours = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours}:${String(minutes).padStart(2, '0')}${hours24 < 12 ? 'am' : 'pm'}`
}

/** How many of the four have kept it by `t`. Drives the counter and the headline chip. */
export function keptCountAt(t: number): number {
  return CAST.filter((member) => t >= member.keptAt).length
}
