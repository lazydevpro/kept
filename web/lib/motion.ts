'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
export const FULL_MOTION = '(prefers-reduced-motion: no-preference)'

/**
 * Reads the OS setting and keeps reading it — someone who turns motion off mid-page gets a
 * still page immediately, without a reload.
 *
 * The server snapshot is `false` because a static export has no reader to ask at build time.
 * That is safe in the direction that matters: the markup is identical either way, and the
 * first thing `SmoothScroll` and `useMotionScene` do on the client is re-check.
 */
export function useReducedMotion(): boolean {
  const subscribe = useCallback((notify: () => void) => {
    const query = window.matchMedia(REDUCED_MOTION)
    query.addEventListener('change', notify)
    return () => query.removeEventListener('change', notify)
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )
}

/**
 * The single door every animated section goes through — scroll-driven or not.
 *
 * `build` runs inside a `gsap.matchMedia` scoped to `(prefers-reduced-motion: no-preference)`,
 * so there is no code path in this codebase that animates on scroll for a reader who asked
 * not to be animated at. That is deliberate: reduced-motion support that depends on each
 * section remembering to check is reduced-motion support that eventually breaks.
 *
 * The consequence for section authors is a rule, not a suggestion: **markup must be complete
 * and legible before `build` runs.** Animate from a readable resting state to another
 * readable state — never from `opacity: 0`, never from a value that hides content. If a
 * section is blank until GSAP touches it, it is blank forever for a reader with motion off,
 * and blank in the no-JS snapshot too.
 */
export function useMotionScene(
  build: (context: { gsap: typeof gsap; ScrollTrigger: typeof ScrollTrigger }) => void,
  { scope, deps = [] }: { scope?: React.RefObject<HTMLElement | null>; deps?: unknown[] } = {},
): void {
  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add(FULL_MOTION, () => {
        build({ gsap, ScrollTrigger })
      })
      return () => media.revert()
    },
    { scope, dependencies: deps, revertOnUpdate: true },
  )
}

export { gsap, ScrollTrigger }
