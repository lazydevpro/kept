'use client'

import { useRef } from 'react'
import { useMotionScene } from '@/lib/motion'
import { Rings, type RingKey, type RingsHandle } from '@/components/rings'
import { CAST, NOTES, REACTIONS, clockAt, keptCountAt, promiseAt } from '@/lib/friday'
import styles from './circle.module.css'

/** Hoisted so the array identity is stable and `Rings` is not handed a new one every render. */
const PROMISE_ONLY: RingKey[] = ['promise']

/**
 * When the evening is scrubbed rather than played.
 *
 * Both halves matter. Too narrow and there is no room for the row; too short and a pinned
 * 100vh viewport clips the stage, because `overflow: hidden` is what makes a sticky pin hold
 * its shape. This string and the media queries at the foot of `circle.module.css` have to
 * agree — if one moves, the other has to.
 */
const PINNED = '(width >= 72rem) and (height >= 42rem)'

type MotionContext = Parameters<Parameters<typeof useMotionScene>[0]>[0]

/**
 * The section that makes the coral ring mean something.
 *
 * Up to here the page has shown three rings and explained two of them. Circle is the one
 * nobody can infer from a static image, because its value comes from other people doing
 * something — so it gets a scene rather than a caption.
 *
 * One Friday evening, four people, no numbers anywhere on screen. That last part is the
 * point: the privacy section *states* that a circle sees progress and nothing else, and this
 * section is that claim running. Every card here shows a name and a ring, and there is no
 * amount to hide because there was never one to send.
 *
 * ── The borrow, and the inversion ──
 *
 * The notification stack is Muzzle's mechanic: cards drop in at the top, push the stack
 * down, and the oldest dim rather than vanish. Muzzle uses it to dramatise dread — the
 * embarrassing message arriving mid-screenshare. The same stack here carries the opposite
 * feeling, which is the only reason it is worth borrowing: these are the notifications you
 * *want*, and the page earns the contrast by using the product's literal copy.
 *
 * ── Two behaviours ──
 *
 * Wide screens scrub: the reader drags the evening forward and back, which keeps the page's
 * "scroll is time" concept intact — the centrepiece is one year, this is one Friday.
 * Narrow screens play it themselves on entry and loop, because a pinned scrub competes with
 * a phone's own scroll momentum and loses. Both drive the identical `paint` function, so
 * there is one scene with two clocks, not two implementations.
 *
 * ── Reduced motion ──
 *
 * The markup rests at the end of the evening: four closed rings, all six notifications, every
 * reaction, the clock at 9:40pm. The stylesheet un-pins the viewport and lets the stack read
 * as a list. Nothing in this section is reachable only by animating.
 */
export function Circle() {
  const root = useRef<HTMLElement>(null)
  const rings = useRef<Record<string, RingsHandle | null>>({})
  const cards = useRef<Record<string, HTMLLIElement | null>>({})
  const notes = useRef<(HTMLLIElement | null)[]>([])
  const reactions = useRef<(HTMLSpanElement | null)[]>([])
  const clock = useRef<HTMLSpanElement>(null)
  const counter = useRef<HTMLSpanElement>(null)

  /**
   * One painter, driven by either clock. Touches `textContent`, a `data-` attribute and the
   * rings' imperative `set` — no React state, so neither the scrub nor the loop re-renders.
   */
  const paint = (t: number) => {
    for (const member of CAST) {
      rings.current[member.id]?.set({ promise: promiseAt(member, t) })
      const card = cards.current[member.id]
      const kept = String(t >= member.keptAt)
      if (card && card.dataset.kept !== kept) card.dataset.kept = kept
    }

    NOTES.forEach((note, i) => {
      const node = notes.current[i]
      if (!node) return
      const shown = String(t >= note.at)
      if (node.dataset.shown !== shown) node.dataset.shown = shown
    })

    REACTIONS.forEach((reaction, i) => {
      const node = reactions.current[i]
      if (!node) return
      const shown = String(t >= reaction.at)
      if (node.dataset.shown !== shown) node.dataset.shown = shown
    })

    if (clock.current) clock.current.textContent = clockAt(t)
    if (counter.current) counter.current.textContent = String(keptCountAt(t))
  }

  // Wide: the reader is the clock.
  useMotionScene(
    ({ gsap }) => {
      const state = { t: 0 }
      gsap.to(state, {
        t: 1,
        ease: 'none',
        onUpdate: () => paint(state.t),
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
          // Pinned by CSS `position: sticky`; ScrollTrigger only reports progress.
        },
      })
      paint(0)
    },
    { scope: root, when: PINNED },
  )

  /**
   * The scene is its own clock. Paused off-screen so it costs nothing in the background.
   *
   * Registered twice, against the two halves of "not pinned", because these strings are
   * ANDed onto the reduced-motion gate inside `useMotionScene` and `and` does not distribute
   * over a comma. `(no-preference) and (width < 72rem), (height < 42rem)` parses as
   * `[(no-preference) and (width < 72rem)] or [(height < 42rem)]` — which would start this
   * animation for a reader on a short screen who asked for no motion. Two pure AND chains
   * cover the same ground with no way to misread them.
   */
  const autoplay = ({ gsap, ScrollTrigger }: MotionContext) => {
    const state = { t: 0 }
    const play = gsap.to(state, {
      t: 1,
      duration: 15,
      ease: 'none',
      paused: true,
      repeat: -1,
      repeatDelay: 2.5,
      onUpdate: () => paint(state.t),
    })

    ScrollTrigger.create({
      trigger: root.current,
      start: 'top 85%',
      end: 'bottom 15%',
      onEnter: () => play.play(),
      onEnterBack: () => play.play(),
      onLeave: () => play.pause(),
      onLeaveBack: () => play.pause(),
    })

    paint(0)
    return () => play.kill()
  }

  useMotionScene(autoplay, { scope: root, when: '(width < 72rem)' })
  useMotionScene(autoplay, { scope: root, when: '(width >= 72rem) and (height < 42rem)' })

  return (
    <section className={styles.section} ref={root} aria-labelledby="circle-heading">
      <div className={styles.viewport}>
        <div className={`shell ${styles.grid}`}>
          <div className={styles.copy}>
            <p className="eyebrow">Your circle</p>
            <h2 id="circle-heading">
              Four people. <em className="serif">One Friday.</em>
            </h2>
            <p className="lede">
              The app reminds you before your day runs out, tells your circle the moment you follow through, and
              lets them cheer you on. Watch an evening of it.
            </p>

            <p className={styles.readout} aria-hidden="true">
              <span className={`${styles.clock} numeric`} ref={clock}>
                {clockAt(1)}
              </span>
              <span className={styles.tally}>
                <span className="numeric" ref={counter}>
                  {CAST.length}
                </span>
                {' of '}
                {CAST.length} kept
              </span>
            </p>

            <p className={styles.punchline}>
              Nobody saw a number. <span>Not one of them knows what anyone put in.</span>
            </p>

            <p className={styles.disclaimer}>
              An illustration of one week in a four-person circle. The notification wording is the app’s own.
            </p>
          </div>

          <div className={styles.stage}>
            <ul className={styles.cluster}>
              {CAST.map((member) => (
                <li
                  key={member.id}
                  className={styles.member}
                  data-kept="true"
                  data-you={member.you ? 'true' : undefined}
                  ref={(node) => {
                    cards.current[member.id] = node
                  }}
                >
                  {/*
                    One ring, not three. The scene is about this week's promise, so the goal
                    and circle bands carry nothing here — and at this size they actively hurt:
                    three arcs crowd the hole down to a quarter of the diameter and read as a
                    smudge rather than as progress. Alone, promise gets the outer radius and
                    the whole circle, and four of them closing in turn is a far clearer beat.
                  */}
                  <Rings
                    ref={(handle) => {
                      rings.current[member.id] = handle
                    }}
                    size={76}
                    detail="glyph"
                    only={PROMISE_ONLY}
                    promise={1}
                    label={`${member.name} kept this week`}
                    className={styles.memberRing}
                  />
                  <p className={styles.memberName}>{member.name}</p>
                  <p className={styles.memberState}>Kept</p>

                  <span className={styles.reactions} aria-hidden="true">
                    {REACTIONS.map((reaction, i) =>
                      reaction.on === member.id ? (
                        <span
                          key={i}
                          className={styles.reaction}
                          data-shown="true"
                          ref={(node) => {
                            reactions.current[i] = node
                          }}
                        >
                          {reaction.emoji}
                        </span>
                      ) : null,
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {/*
              The stack sits over the cluster rather than beside it, because a notification
              that politely waits in its own column is not what a notification is.
            */}
            <ul className={styles.stack} aria-label="What the circle sees that evening">
              {NOTES.map((note, i) => (
                <li
                  key={i}
                  className={styles.note}
                  data-kind={note.kind}
                  data-shown="true"
                  ref={(node) => {
                    notes.current[i] = node
                  }}
                >
                  <span className={styles.noteMark} aria-hidden="true" />
                  <span className={styles.noteText}>
                    <strong>{note.title}</strong>
                    {note.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
