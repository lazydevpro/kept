'use client'

import { useRef, useState } from 'react'
import { useReducedMotion, useMotionScene } from '@/lib/motion'
import styles from './foundation.module.css'

/**
 * A live readout of the motion harness, so "reduced motion works" is something we can look at
 * rather than something we assert.
 *
 * Turn motion off in the OS while this is on screen: the state flips without a reload, the
 * square stops tracking scroll, and the tick count freezes. Turn it back on and it resumes.
 * That is the whole contract in `lib/motion.ts`, visible.
 */
export function MotionCheck() {
  const root = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [ticks, setTicks] = useState(0)

  useMotionScene(
    ({ gsap }) => {
      setTicks(0)
      gsap.to(`.${styles.puck}`, {
        xPercent: 620,
        rotate: 180,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top 85%',
          end: 'bottom 35%',
          scrub: 0.4,
          onUpdate: () => setTicks((n) => n + 1),
        },
      })
    },
    { scope: root, deps: [reduced] },
  )

  return (
    <section className={styles.section} ref={root}>
      <h2 className={styles.sectionTitle}>Motion harness</h2>
      <p className={styles.note}>
        Lenis drives GSAP&rsquo;s ticker; ScrollTrigger scrubs against it. Everything runs inside a{' '}
        <code>matchMedia</code> gate, so there is no path that animates when you have asked it not to.
      </p>

      <dl className={styles.readout}>
        <div>
          <dt>prefers-reduced-motion</dt>
          <dd className="numeric">{reduced ? 'reduce' : 'no-preference'}</dd>
        </div>
        <div>
          <dt>Smooth scroll</dt>
          <dd className="numeric">{reduced ? 'off — native' : 'on — Lenis'}</dd>
        </div>
        <div>
          <dt>ScrollTrigger updates</dt>
          <dd className="numeric">{ticks}</dd>
        </div>
      </dl>

      <div className={styles.runway}>
        <span className={styles.puck} />
      </div>
      <p className={styles.note}>
        {reduced
          ? 'Motion is off, so the square rests where the markup put it — legible, not hidden.'
          : 'Scroll: the square crosses the runway in step with the page, not on a timer.'}
      </p>
    </section>
  )
}
