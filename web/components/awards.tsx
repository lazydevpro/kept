'use client'

import { useRef } from 'react'
import { useMotionScene } from '@/lib/motion'
import { Object3D, type ObjectName } from '@/components/ui'
import styles from './awards.module.css'

/**
 * The twelve awards, exactly as `mobile/features/awards/awards-api.ts` defines them — same
 * ids, same thresholds, same 3D object per award. If the app gains a thirteenth, this list is
 * wrong, and that is the right kind of wrong: obvious, and easy to fix.
 *
 * They unlock as the reader scrolls. The unlock is a pop rather than a fade because the app's
 * motion spec presses everything to 0.97 and springs back, and an award landing should feel
 * like that press in reverse.
 */

type Award = { id: string; title: string; unit: string; object: ObjectName; group: string }

const AWARDS: Award[] = [
  { id: 'week-1', title: 'First promise', unit: '1 week', object: 'seedling', group: 'Showing up' },
  { id: 'week-4', title: 'First month', unit: '4 weeks', object: 'potted-plant', group: 'Showing up' },
  { id: 'week-8', title: 'Steady eight', unit: '8 weeks', object: 'fire', group: 'Showing up' },
  { id: 'week-12', title: 'Quarter rhythm', unit: '12 weeks', object: 'chart-up', group: 'Showing up' },
  { id: 'week-26', title: 'Half a year', unit: '26 weeks', object: 'star', group: 'Showing up' },
  { id: 'week-52', title: 'A full year', unit: '52 weeks', object: 'trophy', group: 'Showing up' },
  { id: 'month-1', title: 'Perfect month', unit: '1 month', object: 'calendar', group: 'Whole months' },
  { id: 'month-3', title: 'Three perfect months', unit: '3 months', object: 'rocket', group: 'Whole months' },
  { id: 'friend-1', title: 'Not alone', unit: '1 person', object: 'people', group: 'Together' },
  { id: 'friend-3', title: 'Small circle', unit: '3 people', object: 'handshake', group: 'Together' },
  { id: 'nudge-1', title: 'First nudge', unit: '1 nudge', object: 'bell', group: 'Encouragement' },
  { id: 'nudge-10', title: 'Good neighbour', unit: '10 nudges', object: 'gift', group: 'Encouragement' },
]

export function Awards() {
  const root = useRef<HTMLElement>(null)

  useMotionScene(
    ({ gsap }) => {
      gsap.from(`.${styles.award}`, {
        scale: 0.92,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(1.7)',
        stagger: { each: 0.045, from: 'start' },
        scrollTrigger: { trigger: `.${styles.grid}`, start: 'top 80%' },
      })
    },
    { scope: root },
  )

  return (
    <section className={styles.section} ref={root} aria-labelledby="awards-heading">
      <div className="shell">
        <header className={styles.head}>
          <p className="eyebrow">The collection</p>
          <h2 id="awards-heading" className="display-2">
            Twelve awards. <em className="serif">None for being rich.</em>
          </h2>
          <p className="lede">
            Every one is earned by turning up, or by helping somebody else turn up. Portfolio size is never
            celebrated, because it is never the thing you controlled.
          </p>
        </header>

        <ul className={styles.grid}>
          {AWARDS.map((award) => (
            <li key={award.id} className={styles.award}>
              <Object3D name={award.object} size={64} />
              <p className={styles.awardTitle}>{award.title}</p>
              <p className={styles.awardUnit}>{award.unit}</p>
              <span className={styles.awardGroup}>{award.group}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
