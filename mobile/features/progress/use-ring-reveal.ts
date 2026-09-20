/**
 * Ring reveal.
 *
 *    0ms  Promise begins sweeping from where it was
 *   70ms  Goal begins
 *  140ms  Circle begins
 * 1180ms  All three settle, with a small overshoot on the way in
 *
 * The staggered start is the whole trick: three arcs that begin together read as a loading
 * spinner, three that begin 70ms apart read as a sequence of achievements.
 *
 * Re-running when the targets change means the same hook covers both the entrance on a
 * screen and the step-to-step animation in onboarding. Honours reduce-motion.
 */

import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing } from 'react-native'
import type { RingValues } from '@/features/progress/rings'

const DURATION = 1180
const STAGGER = 70
const TOTAL = DURATION + STAGGER * 2

/** Slight overshoot, settling back — reads as momentum rather than a wipe. */
const reveal = Easing.bezier(0.32, 1.28, 0.62, 1)

const ZERO: RingValues = { promise: 0, goal: 0, circle: 0 }

export function useRingReveal(targets: Partial<RingValues>): RingValues {
  const target: RingValues = {
    promise: targets.promise ?? 0,
    goal: targets.goal ?? 0,
    circle: targets.circle ?? 0,
  }

  const clock = useRef(new Animated.Value(0)).current
  const from = useRef<RingValues>(ZERO)
  const current = useRef<RingValues>(ZERO)
  const [values, setValues] = useState<RingValues>(ZERO)

  const signature = `${target.promise}|${target.goal}|${target.circle}`

  useEffect(() => {
    let active = true
    from.current = current.current
    const start = from.current
    const end = target

    const at = (elapsed: number, index: number, a: number, b: number) => {
      const local = (elapsed - index * STAGGER) / DURATION
      return a + (b - a) * reveal(Math.min(Math.max(local, 0), 1))
    }

    const listener = clock.addListener(({ value }) => {
      const elapsed = value * TOTAL
      const next: RingValues = {
        promise: at(elapsed, 0, start.promise, end.promise),
        goal: at(elapsed, 1, start.goal, end.goal),
        circle: at(elapsed, 2, start.circle, end.circle),
      }
      current.current = next
      setValues(next)
    })

    let animation: Animated.CompositeAnimation | undefined
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!active) return
        if (reduceMotion) {
          current.current = end
          setValues(end)
          return
        }
        clock.setValue(0)
        animation = Animated.timing(clock, {
          toValue: 1,
          duration: TOTAL,
          easing: Easing.linear,
          useNativeDriver: false,
        })
        animation.start()
      })
      .catch(() => {
        if (!active) return
        current.current = end
        setValues(end)
      })

    return () => {
      active = false
      animation?.stop()
      clock.removeListener(listener)
    }
    // `signature` collapses the three numeric targets into one dependency so the reveal
    // re-runs exactly when a value actually changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, signature])

  return values
}
