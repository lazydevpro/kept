import * as Haptics from 'expo-haptics'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { AccessibilityInfo, Animated, Platform, StyleSheet, View } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { SafeAreaView } from 'react-native-safe-area-context'
import { T } from '@/components/ui'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { radii, space } from '@/constants/theme'
import { Icon } from '@/design/icons'
import { apiRequest } from '@/lib/api'

/**
 * The second half of a purchase.
 *
 * Signing is instant; verification is not. The queue re-reads the confirmed
 * transaction off-chain, which takes seconds and occasionally a minute, and until
 * it returns the promise is not actually kept. So the moment splits in two:
 *
 *   signature      the sheet celebrates — ring closes, success haptic
 *   verification   this — a quiet banner, a light tap, and the rings refetch
 *
 * It lives at the root rather than in the sheet because the reader will have
 * closed the sheet and probably moved to another tab long before the answer
 * arrives. A celebration that only fires if you happen to still be looking at the
 * screen that started it is one most people will never see.
 *
 * ── Why polling ──
 *
 * Push would be the obvious channel and is the wrong one: notifications are
 * opt-in, off by default in local builds, and a permission prompt is not
 * something to spend on a confirmation the reader is already waiting for. This
 * polls a route that already exists, only while something is actually pending,
 * and stops on its own.
 */

export type Settling = {
  contributionId: string
  symbol: string
  direction: 'buy' | 'sell'
}

type Banner = { tone: 'good' | 'bad'; title: string; body: string } | null

const SettlementContext = createContext<(settling: Settling) => void>(() => {})

/** Verification normally lands inside 15s. Past three minutes, stop and stay quiet. */
const EARLY_TRIES = 10
const EARLY_DELAY = 3_000
const LATE_DELAY = 12_000
const MAX_TRIES = 25

export function useSettlementWatch() {
  return useContext(SettlementContext)
}

export function SettlementProvider({ children }: PropsWithChildren) {
  const [queue, setQueue] = useState<Settling[]>([])
  const [banner, setBanner] = useState<Banner>(null)
  const client = useQueryClient()

  const watch = useCallback((settling: Settling) => {
    setQueue((current) =>
      current.some((item) => item.contributionId === settling.contributionId) ? current : [...current, settling],
    )
  }, [])

  useEffect(() => {
    if (!queue.length) return
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let attempt = 0

    const settle = (item: Settling, verified: boolean) => {
      setQueue((current) => current.filter((q) => q.contributionId !== item.contributionId))

      // Everything the rings, the widget and the portfolio are drawn from. A sell
      // touches no promise, so awards and the circle feed are left alone.
      client.invalidateQueries({ queryKey: ['widget-snapshot'] })
      client.invalidateQueries({ queryKey: ['portfolio'] })
      if (item.direction === 'buy') {
        client.invalidateQueries({ queryKey: ['awards'] })
        client.invalidateQueries({ queryKey: ['contributions'] })
      }

      if (Platform.OS !== 'web') {
        // Light, not Success. The loud one already fired at signature; this is a
        // confirmation arriving over the reader's shoulder, not a second event.
        Haptics.impactAsync(verified ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Rigid).catch(
          () => {},
        )
      }

      setBanner(
        verified
          ? item.direction === 'buy'
            ? { tone: 'good', title: 'Verified on-chain', body: `Your ${item.symbol} purchase settled. Week kept.` }
            : { tone: 'good', title: 'Sale settled', body: `Your ${item.symbol} sale is confirmed on-chain.` }
          : {
              tone: 'bad',
              title: 'Did not verify',
              body: `That ${item.symbol} transaction did not confirm. Nothing was counted.`,
            },
      )
    }

    const tick = async () => {
      if (!alive) return
      attempt += 1

      for (const item of queue) {
        try {
          const { contribution } = await apiRequest<{ contribution: { status: string } }>(
            `/v1/contributions/${item.contributionId}`,
          )
          if (!alive) return
          if (contribution.status === 'verified') settle(item, true)
          else if (contribution.status === 'rejected') settle(item, false)
        } catch {
          // Offline or a flaky read. Try again on the next tick rather than
          // telling someone their purchase failed when it is the network that did.
        }
      }

      if (alive && attempt < MAX_TRIES) {
        timer = setTimeout(tick, attempt < EARLY_TRIES ? EARLY_DELAY : LATE_DELAY)
      }
    }

    timer = setTimeout(tick, EARLY_DELAY)
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
    // `queue` by identity: adding one restarts the loop, which is what should happen.
  }, [queue, client])

  return (
    <SettlementContext.Provider value={watch}>
      {children}
      <SettlementBanner banner={banner} onDone={() => setBanner(null)} />
    </SettlementContext.Provider>
  )
}

/** Visible for four seconds, then gone. Nothing to dismiss and nothing to tap. */
const VISIBLE_MS = 4_000

function SettlementBanner({ banner, onDone }: { banner: Banner; onDone: () => void }) {
  const styles = useStyles()
  const { colors } = useAppTheme()
  const slide = useRef(new Animated.Value(0)).current
  const reduced = useRef(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => {
        reduced.current = on
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!banner) return
    let timer: ReturnType<typeof setTimeout>
    const enter = Animated.timing(slide, {
      toValue: 1,
      duration: reduced.current ? 0 : 260,
      useNativeDriver: true,
    })
    enter.start(() => {
      timer = setTimeout(() => {
        Animated.timing(slide, {
          toValue: 0,
          duration: reduced.current ? 0 : 200,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) onDone()
        })
      }, VISIBLE_MS)
    })
    return () => {
      clearTimeout(timer)
      enter.stop()
    }
  }, [banner, slide, onDone])

  if (!banner) return null
  const good = banner.tone === 'good'

  /*
   * `SafeAreaView`, not `useSafeAreaInsets`. The hook throws without a
   * `SafeAreaProvider` ancestor and this app does not mount one — it relies on
   * `SafeAreaView`'s native insets, as `components/ui.tsx` does. Using the hook
   * here would have crashed every screen, since this sits at the root.
   */
  return (
    <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.layer}>
      <Animated.View
        pointerEvents="none"
        accessibilityLiveRegion="polite"
        style={[
          styles.banner,
          {
            opacity: slide,
            transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
          },
        ]}
      >
        <View style={[styles.mark, { backgroundColor: good ? colors.kiwiTint : colors.coralTint }]}>
          <Icon name={good ? 'checkCircle' : 'alert'} size={18} color={good ? colors.kiwiDeep : colors.coralDeep} />
        </View>
        <View style={styles.copy}>
          <T role="label">{banner.title}</T>
          <T role="caption" color={colors.inkMuted}>
            {banner.body}
          </T>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    layer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: space[4],
      paddingTop: space[2],
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[3],
      padding: space[3],
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    mark: {
      width: 34,
      height: 34,
      borderRadius: radii.plate,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, gap: 2 },
  }),
)
