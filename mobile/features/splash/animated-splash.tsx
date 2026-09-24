/**
 * The opening sequence: two hands come together into the pinky promise, then the ring
 * above them draws itself from zero to full.
 *
 * It is an overlay, not the splash screen itself — Android's splash is a static drawable
 * and cannot animate. The native splash is therefore just the cream field, with no mark on
 * it to contradict what happens here, and this takes over the instant fonts are ready. The
 * two are the same colour, so the handoff is invisible.
 *
 * The hands are a single path, so they are not two shapes that can be moved apart. Each
 * half is a full copy of the artwork inside a fixed-width window, translated within it:
 * the window clips, the copy slides, and the two meet exactly because they are the same
 * drawing. Both halves move on the native driver.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import { useAppTheme } from '@/components/theme-provider'
import { PROMISE_PATH, PROMISE_VIEWBOX } from '@/design/promise-art'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

/* Proportions taken from scripts/build-brand-assets.py so the animated mark is the same
   lockup as the icon: ring above, small gap, hands below. */
const HANDS_WIDTH = 236
const HANDS_HEIGHT = Math.round((HANDS_WIDTH * PROMISE_VIEWBOX.height) / PROMISE_VIEWBOX.width)
const RING_DIAMETER = Math.round(HANDS_WIDTH * (0.26 / 0.84))
const RING_GAP = Math.round(HANDS_WIDTH * (0.036 / 0.84))
const RING_BAND = RING_DIAMETER * 0.17
const RING_RADIUS = (RING_DIAMETER - RING_BAND) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/** How far apart the hands start, as a fraction of each half. */
const PARTED = HANDS_WIDTH * 0.17

const TIMING = {
  join: 620,
  settle: 140,
  ring: 760,
  hold: 240,
  out: 280,
}

function Hands({ offset, colour }: { offset: Animated.Value; colour: string }) {
  const art = (id: string) => (
    <Svg width={HANDS_WIDTH} height={HANDS_HEIGHT} viewBox={`0 0 ${PROMISE_VIEWBOX.width} ${PROMISE_VIEWBOX.height}`}>
      <Defs>
        {/* Unique per copy: two gradients sharing an id collide inside one tree. */}
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#9BDB33" />
          <Stop offset="1" stopColor="#5F9410" />
        </LinearGradient>
      </Defs>
      <Path d={PROMISE_PATH} fill={`url(#${id})`} stroke={`url(#${id})`} strokeWidth={6.48} strokeLinejoin="round" />
    </Svg>
  )

  const half = HANDS_WIDTH / 2

  return (
    <View style={{ width: HANDS_WIDTH, height: HANDS_HEIGHT, flexDirection: 'row' }}>
      <View style={{ width: half, height: HANDS_HEIGHT, overflow: 'hidden' }}>
        <Animated.View style={{ transform: [{ translateX: Animated.multiply(offset, -1) }] }}>
          {art('promiseLeft')}
        </Animated.View>
      </View>
      <View style={{ width: half, height: HANDS_HEIGHT, overflow: 'hidden' }}>
        <Animated.View style={{ marginLeft: -half, transform: [{ translateX: offset }] }}>
          {art('promiseRight')}
        </Animated.View>
      </View>
      {/* `colour` is read so the mark re-renders if the theme flips mid-launch. */}
      <View style={{ width: 0, backgroundColor: colour }} />
    </View>
  )
}

export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { colors } = useAppTheme()
  const offset = useRef(new Animated.Value(PARTED)).current
  const handsIn = useRef(new Animated.Value(0)).current
  const sweep = useRef(new Animated.Value(0)).current
  const fade = useRef(new Animated.Value(1)).current
  const [done, setDone] = useState(false)

  const finish = useCallback(() => {
    setDone(true)
    onFinish()
  }, [onFinish])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      // Someone who has asked the system for less motion gets the finished mark and a fade,
      // not a sequence they have to sit through.
      const reduced = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false)
      if (cancelled) return

      if (reduced) {
        offset.setValue(0)
        handsIn.setValue(1)
        sweep.setValue(1)
        Animated.timing(fade, { toValue: 0, duration: TIMING.out, useNativeDriver: true }).start(finish)
        return
      }

      Animated.sequence([
        Animated.parallel([
          Animated.timing(handsIn, {
            toValue: 1,
            duration: TIMING.join,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(offset, {
            toValue: 0,
            duration: TIMING.join,
            // A touch of overshoot so the hands meet rather than merely arrive.
            easing: Easing.out(Easing.back(1.4)),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(TIMING.settle),
        Animated.timing(sweep, {
          toValue: 1,
          duration: TIMING.ring,
          easing: Easing.inOut(Easing.cubic),
          // strokeDashoffset is an SVG prop, so this one cannot run on the native driver.
          useNativeDriver: false,
        }),
        Animated.delay(TIMING.hold),
        Animated.timing(fade, { toValue: 0, duration: TIMING.out, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished && !cancelled) finish()
      })
    }

    run()
    return () => {
      cancelled = true
    }
  }, [fade, finish, handsIn, offset, sweep])

  if (done) return null

  const dashOffset = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.stage, { backgroundColor: colors.background, opacity: fade }]}
    >
      <View style={styles.lockup}>
        <Svg width={RING_DIAMETER} height={RING_DIAMETER}>
          <Defs>
            <LinearGradient id="splashRing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#9BDB33" />
              <Stop offset="1" stopColor="#5F9410" />
            </LinearGradient>
          </Defs>
          <AnimatedCircle
            cx={RING_DIAMETER / 2}
            cy={RING_DIAMETER / 2}
            r={RING_RADIUS}
            stroke="url(#splashRing)"
            strokeWidth={RING_BAND}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            // Start the sweep at twelve o'clock rather than three.
            transform={`rotate(-90 ${RING_DIAMETER / 2} ${RING_DIAMETER / 2})`}
          />
        </Svg>

        <Animated.View style={{ marginTop: RING_GAP, opacity: handsIn }}>
          <Hands offset={offset} colour={colors.background} />
        </Animated.View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  lockup: { alignItems: 'center', justifyContent: 'center' },
})
