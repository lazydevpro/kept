/**
 * One simulated year of the habit, used by the centerpiece section.
 *
 * Every number the page shows comes from here, so they reconcile: the ring positions, the
 * bar strip, the running total, the streak counter and the copy in the beat cards are all
 * derived from the same three constants below. Nothing is written twice, which is the only
 * reliable way to stop a marketing page from claiming $520 in one place and $460 in another.
 *
 * It is an illustration, not a real account, and the section labels it as one.
 */

export const WEEKLY = 20
export const GOAL = 1000
export const WEEKS = 52

/**
 * Three misses, placed so the story the beats tell is actually true of the data: the run
 * after the last miss (week 27 onward) is fourteen weeks long when the reader reaches week 40.
 */
const MISSED = new Set([6, 19, 26])

export const kept = (week: number) => !MISSED.has(week)

/** Dollars in after `week` complete weeks. */
export function investedThrough(week: number): number {
  let total = 0
  for (let w = 1; w <= week; w += 1) if (kept(w)) total += WEEKLY
  return total
}

/** Consecutive kept weeks ending at `week`. */
export function streakAt(week: number): number {
  let run = 0
  for (let w = 1; w <= week; w += 1) run = kept(w) ? run + 1 : 0
  return run
}

/**
 * How much of the circle showed up alongside you that week. Four friends, and the shape is
 * deliberately not a clean climb — a circle that only ever improves is a circle nobody
 * believes.
 */
const CIRCLE_BY_WEEK = [
  1, 2, 2, 3, 3, 2, 3, 3, 4, 4, 3, 4, 4, 4, 3, 3, 4, 4, 2, 3, 3, 4, 4, 4, 3, 2, 3, 4, 4, 4, 3, 4, 4, 4, 4, 3, 4,
  4, 4, 4, 3, 4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4,
]

export const circleAt = (week: number) => (CIRCLE_BY_WEEK[week - 1] ?? 0) / 4

export const TOTAL_KEPT = Array.from({ length: WEEKS }, (_, i) => i + 1).filter(kept).length
export const TOTAL_INVESTED = investedThrough(WEEKS)

export type Frame = {
  week: number
  promise: number
  goal: number
  circle: number
  invested: number
  streak: number
}

/**
 * Reads the year at any continuous point — `t` runs 0 → 52, so `t = 12.5` is halfway through
 * week 13.
 *
 * The promise ring is the sawtooth and the whole reason this section exists: it sweeps to
 * full across a kept week and starts the next one empty, so "the ring resets, the money
 * doesn't" is something the reader watches rather than something the page asserts. A missed
 * week stalls at 45% instead of completing.
 */
export function frameAt(t: number): Frame {
  const clamped = Math.min(Math.max(t, 0), WEEKS)
  const index = Math.min(Math.floor(clamped), WEEKS - 1)
  const week = index + 1
  const phase = clamped - index

  const wasKept = kept(week)
  const banked = investedThrough(week - 1)

  return {
    week,
    promise: wasKept ? phase : phase * 0.45,
    goal: (banked + (wasKept ? phase * WEEKLY : 0)) / GOAL,
    // Ease between last week's circle and this week's so the coral arc drifts rather than steps.
    circle: circleAt(Math.max(1, week - 1)) + (circleAt(week) - circleAt(Math.max(1, week - 1))) * phase,
    invested: banked + (wasKept ? Math.floor(phase * WEEKLY) : 0),
    streak: streakAt(wasKept && phase > 0.5 ? week : week - 1),
  }
}

/** The six moments the section stops to name. `at` is the week the card takes over. */
export const BEATS: { at: number; title: string; body: string }[] = [
  {
    at: 1,
    title: 'Week 1',
    body: 'You promise $20 a week and say it out loud. The ring starts empty.',
  },
  {
    at: 6,
    title: 'Week 6',
    body: 'You miss one. The ring resets — the money does not.',
  },
  {
    at: 13,
    title: 'Week 13',
    body: `A quarter in. $${investedThrough(13)} invested, and Maya noticed before you did.`,
  },
  {
    at: 26,
    title: 'Week 26',
    body: `Halfway. $${investedThrough(26)}, spread across six names you chose.`,
  },
  {
    at: 40,
    title: 'Week 40',
    body: `Your longest run yet — ${streakAt(40)} weeks without missing.`,
  },
  {
    // Fires at 52, not earlier: this card names the final total, and the live counter beside
    // it is still climbing until the last week lands. Showing it early makes the page
    // contradict itself on screen for three weeks of scroll.
    at: 52,
    title: 'Week 52',
    body: `${WEEKS} promises. ${TOTAL_KEPT} kept. $${TOTAL_INVESTED} in. Nobody ever saw your balance.`,
  },
]
