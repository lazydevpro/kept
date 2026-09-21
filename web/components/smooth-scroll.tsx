'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, useReducedMotion } from '@/lib/motion'

/**
 * Smooth scrolling, and the one place GSAP and Lenis are introduced to each other.
 *
 * Lenis takes over the scroll position, so ScrollTrigger has to be told when that happens or
 * every pinned section lags a frame behind the page. Driving `lenis.raf` from GSAP's own
 * ticker rather than its built-in one keeps both on a single rAF loop, which is what stops
 * pinned sections from jittering — two loops means two slightly different ideas of "now".
 *
 * `lagSmoothing(0)` is the counter-intuitive half. GSAP normally absorbs a long frame by
 * pretending less time passed; with scroll-scrubbed animation that reads as the page sticking
 * and then lurching. Off, a dropped frame is just a dropped frame.
 *
 * When the reader has asked for reduced motion none of this is set up at all — native scroll,
 * no interception. See `useScrollScene` for the other half of that promise.
 */
export function SmoothScroll() {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return

    const lenis = new Lenis({ autoRaf: false })
    const tick = (time: number) => lenis.raf(time * 1000)

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // Lenis owns the scroll position, so `window.scrollTo` no longer moves the page. That
    // makes the site awkward to drive from a console or an automated check, which is exactly
    // what the verification scripts need to do. Expose the instance in development only.
    if (process.env.NODE_ENV === 'development') {
      ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
    }

    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [reduced])

  return null
}
