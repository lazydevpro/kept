'use client'

import { useRef } from 'react'
import { useMotionScene } from '@/lib/motion'
import { Rings, type RingsHandle } from '@/components/rings'
import { BEATS, GOAL, TOTAL_INVESTED, TOTAL_KEPT, WEEKS, frameAt, kept, streakAt } from '@/lib/year'
import styles from './year.module.css'

/**
 * The centerpiece: a year of the habit, played out across three and a half screens of scroll.
 *
 * This is the section the whole page is built around, and the argument for the concept —
 * scroll is time. The reference pins a canvas and scrubs 8.5 MB of pre-rendered PNGs to
 * rotate a credit card. This pins SVG and scrubs a dataset, costs nothing to download, stays
 * sharp at any size, and tells the entire product story: the promise ring fills and *resets*
 * every week while the goal ring keeps climbing, which is the one idea the product is built
 * on and the hardest one to explain in a sentence.
 *
 * Everything is driven imperatively from a single scrub handler. React renders the markup
 * once; the loop touches `textContent`, a class, and the rings' imperative `set`. There is no
 * state update in the scroll path.
 *
 * ── Reduced motion ──
 *
 * The markup rests at the end of the year: rings full, every bar placed, all six beats in the
 * DOM. The stylesheet un-pins the viewport and lays the beats out as a list, so a reader with
 * motion off gets the same story as a short article. Nothing here is reachable only by
 * scrubbing.
 */
export function Year() {
  const root = useRef<HTMLElement>(null)
  const rings = useRef<RingsHandle>(null)
  const weekLabel = useRef<HTMLSpanElement>(null)
  const investedLabel = useRef<HTMLSpanElement>(null)
  const streakLabel = useRef<HTMLSpanElement>(null)
  const bars = useRef<(HTMLLIElement | null)[]>([])
  const beats = useRef<(HTMLDivElement | null)[]>([])

  useMotionScene(
    ({ gsap }) => {
      const state = { t: 0 }
      let lastWeek = -1
      let lastBeat = -1

      const paint = () => {
        const frame = frameAt(state.t)
        rings.current?.set(frame)

        if (frame.week !== lastWeek) {
          lastWeek = frame.week
          if (weekLabel.current) weekLabel.current.textContent = String(frame.week)

          // Bars only ever move forward or back one week at a time under a scrub, but a
          // fling can skip several, so reconcile the whole strip against the current week.
          for (let i = 0; i < WEEKS; i += 1) {
            const bar = bars.current[i]
            if (!bar) continue
            const week = i + 1
            const reached = week < frame.week || (week === frame.week && frame.promise > 0.5)
            const next = reached ? (kept(week) ? styles.barKept : styles.barMissed) : styles.barFuture
            if (bar.dataset.state !== next) {
              bar.className = `${styles.bar} ${next}`
              bar.dataset.state = next
            }
          }
        }

        if (investedLabel.current) investedLabel.current.textContent = `$${frame.invested}`
        if (streakLabel.current) streakLabel.current.textContent = String(frame.streak)

        const beatIndex = BEATS.reduce((found, beat, i) => (state.t + 1 >= beat.at ? i : found), 0)
        if (beatIndex !== lastBeat) {
          lastBeat = beatIndex
          beats.current.forEach((node, i) => {
            if (node) node.dataset.active = String(i === beatIndex)
          })
        }
      }

      gsap.set(`.${styles.stage}`, { opacity: 1 })
      gsap.to(state, {
        t: WEEKS,
        ease: 'none',
        onUpdate: paint,
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
          // Pinned by CSS `position: sticky`, not by ScrollTrigger — see the note in
          // `manifesto.tsx`. ScrollTrigger's only job here is to report progress.
        },
      })

      paint()
    },
    { scope: root },
  )

  const final = frameAt(WEEKS)

  return (
    <section className={styles.section} ref={root} aria-labelledby="year-heading">
      <div className={styles.viewport}>
        <div className={`shell ${styles.grid}`}>
          <header className={styles.head}>
            <p className="eyebrow">A year in one scroll</p>
            <h2 id="year-heading" className={styles.heading}>
              One promise, <em className="serif">fifty-two times.</em>
            </h2>
          </header>

          <div className={styles.stage}>
            <Rings
              ref={rings}
              size={340}
              promise={final.promise}
              goal={final.goal}
              circle={final.circle}
              className={styles.rings}
              label={`A simulated year: ${TOTAL_KEPT} of ${WEEKS} promises kept, $${TOTAL_INVESTED} invested against a $${GOAL} goal.`}
            />
            <p className={styles.weekBadge} aria-hidden="true">
              <span className={`${styles.weekNumber} numeric`} ref={weekLabel}>
                {WEEKS}
              </span>
              <span className={styles.weekOf}>of {WEEKS}</span>
            </p>
          </div>

          <dl className={styles.readout} aria-hidden="true">
            <div>
              <dt>Invested</dt>
              <dd className="numeric" ref={investedLabel}>
                ${TOTAL_INVESTED}
              </dd>
            </div>
            <div>
              <dt>Streak</dt>
              <dd className="numeric" ref={streakLabel}>
                {streakAt(WEEKS)}
              </dd>
            </div>
            <div>
              <dt>Goal</dt>
              <dd className="numeric">${GOAL}</dd>
            </div>
          </dl>

          <div className={styles.beats}>
            {BEATS.map((beat, i) => (
              <div
                key={beat.at}
                className={styles.beat}
                data-active={i === BEATS.length - 1}
                ref={(node) => {
                  beats.current[i] = node
                }}
              >
                <p className={styles.beatTitle}>{beat.title}</p>
                <p className={styles.beatBody}>{beat.body}</p>
              </div>
            ))}
          </div>

          <ol className={styles.strip} aria-hidden="true">
            {Array.from({ length: WEEKS }, (_, i) => (
              <li
                key={i}
                className={`${styles.bar} ${kept(i + 1) ? styles.barKept : styles.barMissed}`}
                ref={(node) => {
                  bars.current[i] = node
                }}
              />
            ))}
          </ol>

          <p className={styles.disclaimer}>
            An illustration, not an account. {TOTAL_KEPT} of {WEEKS} kept, ${TOTAL_INVESTED} against a ${GOAL}{' '}
            goal.
          </p>
        </div>
      </div>
    </section>
  )
}
