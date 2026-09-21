'use client'

import { useRef } from 'react'
import { useMotionScene } from '@/lib/motion'
import { Rings, type RingsHandle } from '@/components/rings'
import { Card, Chip, Object3D } from '@/components/ui'
import styles from './hero.module.css'

/**
 * The first screen.
 *
 * The rings are the anchor rather than a decoration, because they are the product's actual
 * signature — the same arcs, from the same geometry, that sit on the reader's home screen if
 * they install it. A stock hero illustration here would be the first lie the page tells.
 *
 * They draw themselves on load. Under reduced motion they are simply already drawn: the
 * markup renders at the final values and the tween only ever runs inside the harness gate.
 */

const AT_REST = { promise: 0.72, goal: 0.34, circle: 0.86 }

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const rings = useRef<RingsHandle>(null)

  useMotionScene(
    ({ gsap }) => {
      // Draw on. The rings render at AT_REST, so this rewinds to empty and plays forward —
      // a reader with motion off never sees the empty state, only the finished one.
      const drawn = { promise: 0, goal: 0, circle: 0 }
      gsap.to(drawn, {
        ...AT_REST,
        duration: 1.6,
        ease: 'power3.out',
        delay: 0.15,
        onUpdate: () => rings.current?.set(drawn),
      })

      gsap.from(`.${styles.reveal}`, {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
      })

      // Parallax out. The stage leaves faster than the copy, which reads as depth rather
      // than as two things sliding past each other.
      gsap
        .timeline({
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.5 },
        })
        .to(`.${styles.copy}`, { y: -70, opacity: 0.2, ease: 'none' }, 0)
        .to(`.${styles.stage}`, { y: -150, ease: 'none' }, 0)

      gsap.to(`.${styles.cue}`, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: '35% top', scrub: true },
      })
    },
    { scope: root },
  )

  return (
    <section className={styles.hero} ref={root}>
      <div className={`shell ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={`${styles.wordmark} ${styles.reveal}`}>KEPT</p>
          <h1 className={styles.reveal}>
            Promises <em className="serif">compound.</em>
          </h1>
          <p className={`lede ${styles.reveal}`}>Invest a little every week, with people who notice.</p>
          <div className={`${styles.actions} ${styles.reveal}`}>
            <a className={styles.cta} href="#manifesto">
              See how it works
            </a>
            <a className={styles.ghost} href="https://github.com/lazydevpro/kept">
              Read the source
            </a>
          </div>
        </div>

        <div className={styles.stage}>
          <Rings ref={rings} size={380} {...AT_REST} className={styles.rings} />

          <Card className={styles.floatA}>
            <Chip label="Week 38" tone="kiwi" />
            <p className={styles.floatTitle}>Promise kept</p>
            <p className={styles.floatMeta}>$20 → SPYx · 4 saw it</p>
          </Card>

          <Card className={styles.floatB}>
            <Object3D name="fire" size={38} />
            <div>
              <p className={`${styles.floatStat} numeric`}>14</p>
              <p className={styles.floatMeta}>week streak</p>
            </div>
          </Card>
        </div>
      </div>

      <p className={styles.cue} aria-hidden="true">
        Scroll
      </p>
    </section>
  )
}
