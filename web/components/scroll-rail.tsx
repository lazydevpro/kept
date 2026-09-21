'use client'

import { useEffect, useRef } from 'react'
import styles from './scroll-rail.module.css'

const WEEKS = 52

/**
 * The persistent left rail: how far down the page you are, counted in weeks.
 *
 * It is the concept stated quietly and continuously — scrolling this page is living a year of
 * the habit — so it is chrome, not decoration, and it deliberately does **not** go through
 * `useScrollScene`. A progress indicator that stops indicating for readers with reduced
 * motion is just a broken progress indicator; the movement here is a 2px fill and a changing
 * number, which is information, not a vestibular trigger.
 *
 * Nothing is tweened and nothing is read back from layout during scroll: the handler writes
 * two custom properties and a string, once per frame, and CSS does the rest off the
 * compositor. That is what keeps it off the profile at 60fps.
 */
export function ScrollRail() {
  const rail = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = rail.current
    const text = label.current
    if (!node || !text) return

    let frame = 0
    let week = 1

    const paint = () => {
      frame = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0

      node.style.setProperty('--progress', String(progress))

      const next = Math.min(WEEKS, Math.floor(progress * WEEKS) + 1)
      if (next !== week) {
        week = next
        text.textContent = String(next)
        node.setAttribute('aria-valuenow', String(next))
      }
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }

    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      ref={rail}
      className={styles.rail}
      role="progressbar"
      aria-label="Progress through the year"
      aria-valuemin={1}
      aria-valuemax={WEEKS}
      aria-valuenow={1}
      aria-valuetext="Week 1 of 52"
    >
      <span className={styles.count} aria-hidden="true">
        <span className={`${styles.week} numeric`} ref={label}>
          1
        </span>
        <span className={styles.total}>/ {WEEKS}</span>
      </span>
      <span className={styles.track}>
        <span className={styles.fill} />
      </span>
    </div>
  )
}
