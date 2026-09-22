import * as Haptics from 'expo-haptics'
import { useEffect, useRef } from 'react'
import { AccessibilityInfo, Animated, Platform, StyleSheet, View } from 'react-native'
import { Button, T } from '@/components/ui'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { radii, space } from '@/constants/theme'
import { Rings, type RingKey } from '@/features/progress/rings'
import { useRingReveal } from '@/features/progress/use-ring-reveal'

/**
 * The instant half of a purchase: the ring closing, the moment it is signed.
 *
 * The product's whole claim is that an unclosed circle is unbearable and closing
 * one feels good — and until now that moment was a native OS alert with an OK
 * button. Worse, onboarding's *practice* ring fired a success haptic while the
 * real purchase fired nothing, so the rehearsal felt better than the event.
 *
 * ── Why it can celebrate before verification ──
 *
 * The transaction is signed and submitted; the queue has not yet re-read it off
 * the chain, so the promise is not *confirmed* kept for a few more seconds. The
 * copy is written to be true at the instant it appears — "that's in", and a
 * status line that says plainly what is still happening. The word "kept" belongs
 * to the banner that arrives when the chain has actually agreed
 * (`settlement.tsx`), and it is deliberately not used here.
 *
 * A ring that closed only after verification would be honest and would also mean
 * most people never see it: they have closed the sheet and changed tabs by then.
 * So the ring closes now and the claim catches up, rather than the other way
 * round.
 */

/** Hoisted so `Rings` is not handed a fresh array identity on every frame of the reveal. */
const PROMISE_ONLY: RingKey[] = ['promise']

export function KeptMoment({
  symbol,
  amountUsd,
  receives,
  rehearsal,
  onDone,
}: {
  symbol: string
  amountUsd: string
  /** "0.0259 SPYx" — what the route actually returned, when it is known. */
  receives: string | null
  /** Devnet: the memo settled, but nothing was bought. Say so rather than cheering. */
  rehearsal: boolean
  onDone: () => void
}) {
  const styles = useStyles()
  const { colors } = useAppTheme()

  // The one ring that moved. Goal and circle are unchanged by a single purchase
  // and drawing them here would imply otherwise.
  const rings = useRingReveal({ promise: 1 })

  const pulse = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    }
  }, [])

  // The status dot breathes while the chain is still being asked. It stops when
  // this unmounts, which is when the answer has arrived or the reader moved on.
  useEffect(() => {
    let cancelled = false
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (cancelled || reduced) return
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
          ]),
        ).start()
      })
      .catch(() => {})
    return () => {
      cancelled = true
      pulse.stopAnimation()
    }
  }, [pulse])

  return (
    <View style={styles.wrap}>
      {/*
        `only`, not `goal={0} circle={0}`. Passing zeroes still draws those two
        TRACKS — a pale violet and a pale coral band inside the green one — which
        reads as two more rings sitting unfinished at the exact moment the screen
        is about to say something went right. One purchase moves one ring.
      */}
      <Rings
        size={180}
        only={PROMISE_ONLY}
        promise={rings.promise}
        label={`Promise ring closing. ${amountUsd} of ${symbol} submitted.`}
      />

      <View style={styles.copy}>
        <T role="title" center>
          {rehearsal ? 'Rehearsal signed.' : 'That’s in.'}
        </T>
        <T role="body" center color={colors.inkMuted}>
          {rehearsal
            ? `A devnet rehearsal for ${amountUsd}. No money moved and no ${symbol} was bought.`
            : receives
              ? `${amountUsd} → ${receives}`
              : `${amountUsd} of ${symbol}`}
        </T>
      </View>

      <View style={styles.status}>
        <Animated.View style={[styles.dot, { opacity: pulse, backgroundColor: colors.kiwiDeep }]} />
        <T role="caption" color={colors.inkMuted}>
          {rehearsal
            ? 'Confirming the signed memo on devnet.'
            : 'Confirming on-chain. Your week is marked kept once it settles.'}
        </T>
      </View>

      <Button label="Done" onPress={onDone} />
    </View>
  )
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: { alignItems: 'center', gap: space[5], paddingVertical: space[4] },
    copy: { gap: space[2], alignItems: 'center' },
    status: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[2],
      paddingVertical: space[2],
      paddingHorizontal: space[4],
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceSunken,
    },
    dot: { width: 8, height: 8, borderRadius: radii.pill },
  }),
)
