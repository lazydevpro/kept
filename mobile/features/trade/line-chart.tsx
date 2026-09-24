/**
 * A price line you can put your finger on.
 *
 * Press anywhere on the chart and drag: a vertical rule and a dot follow the finger, the
 * time of that point appears above the rule, and `onScrub` reports the point so the page
 * can swap its headline price for the one under the finger. Let go and it all returns to
 * the live figure. That is the whole interaction — the Binance Lite reading of a chart,
 * with no candles, axes or crosshair readout to learn.
 *
 * The touch target is a transparent layer over the drawing rather than the drawing
 * itself. Android reports `locationX` relative to whichever view is under the finger, and
 * over an SVG that is often the path rather than the chart, which made the rule jump.
 * An empty layer on top is always the view that answers.
 */

import * as Haptics from 'expo-haptics'
import { useMemo, useRef, useState } from 'react'
import { PanResponder, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg'
import { useAppTheme } from '@/components/theme-provider'
import { type } from '@/constants/theme'
import type { ChartRange } from './trade-api'

export type ChartPoint = { t: number; p: number }

/** Room at the top for the timestamp, so the rule never runs under it. */
const LABEL_BAND = 26
const LABEL_WIDTH = 132

/**
 * A year of daily closes is 365 points, far more than a phone-width line can show. Thinning
 * keeps the path and the scrub search cheap without changing the shape.
 */
export function thin<T>(values: T[], limit: number) {
  if (values.length <= limit) return values
  const step = (values.length - 1) / (limit - 1)
  return Array.from({ length: limit }, (_, index) => values[Math.round(index * step)])
}

function stamp(seconds: number, range: ChartRange) {
  const date = new Date(seconds * 1000)
  // Dates follow the phone's locale; only money is pinned to en-US.
  switch (range) {
    case '1D':
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    case '1W':
      return date.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    case '1M':
      return date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    case '1Y':
      return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  }
}

export function LineChart({
  points,
  width,
  height,
  color,
  range,
  onScrub,
}: {
  points: ChartPoint[]
  width: number
  height: number
  color: string
  range: ChartRange
  onScrub?: (point: ChartPoint | null) => void
}) {
  const { colors } = useAppTheme()
  const [active, setActive] = useState<number | null>(null)
  const activeRef = useRef<number | null>(null)

  const plotTop = LABEL_BAND
  const plotHeight = Math.max(height - plotTop, 1)

  const geometry = useMemo(() => {
    if (points.length < 2 || width <= 0) return null
    const prices = points.map((point) => point.p)
    const low = Math.min(...prices)
    const high = Math.max(...prices)
    // A dead-flat series would divide by zero; it draws across the middle instead.
    const span = high - low || 1
    const inset = 4
    const xs = points.map((_, index) => (index / (points.length - 1)) * width)
    const ys = prices.map((price) => plotTop + inset + (1 - (price - low) / span) * (plotHeight - inset * 2))
    const line = xs.map((x, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${ys[index].toFixed(2)}`).join(' ')
    return { xs, ys, line }
  }, [points, width, plotTop, plotHeight])

  // Latest values read through refs, so the responder is built once and never goes stale.
  const live = useRef({ points, width, onScrub })
  live.current = { points, width, onScrub }

  const responder = useMemo(() => {
    const pick = (x: number) => {
      const { points: current, width: span } = live.current
      if (current.length < 2 || span <= 0) return null
      const ratio = Math.min(Math.max(x / span, 0), 1)
      return Math.round(ratio * (current.length - 1))
    }
    const move = (x: number) => {
      const index = pick(x)
      if (index === null || index === activeRef.current) return
      activeRef.current = index
      setActive(index)
      live.current.onScrub?.(live.current.points[index])
    }
    const end = () => {
      activeRef.current = null
      setActive(null)
      live.current.onScrub?.(null)
    }

    return PanResponder.create({
      onStartShouldSetPanResponder: () => live.current.points.length >= 2,
      onMoveShouldSetPanResponder: () => live.current.points.length >= 2,
      // Holding on to the gesture is what stops a slightly diagonal drag being taken over
      // by a parent that also wants to scroll.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        // One tick when the finger lands, not one per point: a haptic on every step of a
        // drag across 120 points is a buzz, not feedback.
        Haptics.selectionAsync().catch(() => undefined)
        move(event.nativeEvent.locationX)
      },
      onPanResponderMove: (event) => move(event.nativeEvent.locationX),
      onPanResponderRelease: end,
      onPanResponderTerminate: end,
    })
  }, [])

  const fillId = 'lineChartFill'
  const x = active !== null && geometry ? geometry.xs[active] : null
  const y = active !== null && geometry ? geometry.ys[active] : null
  const labelLeft = x === null ? 0 : Math.min(Math.max(x - LABEL_WIDTH / 2, 0), width - LABEL_WIDTH)

  return (
    <View style={{ width, height }}>
      {geometry ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.18} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={`${geometry.line} L${width} ${height} L0 ${height} Z`} fill={`url(#${fillId})`} />
          <Path
            d={geometry.line}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {x !== null && y !== null ? (
            <>
              <Line
                x1={x}
                y1={plotTop}
                x2={x}
                y2={height}
                stroke={colors.inkFaint}
                strokeWidth={1}
                strokeDasharray="3 4"
              />
              <Circle cx={x} cy={y} r={6} fill={color} stroke={colors.surface} strokeWidth={2.5} />
            </>
          ) : null}
        </Svg>
      ) : null}

      {active !== null && x !== null ? (
        <View pointerEvents="none" style={[styles.label, { left: labelLeft, width: LABEL_WIDTH }]}>
          <Text style={[type.caption, { color: colors.inkMuted, textAlign: 'center' }]}>
            {stamp(points[active].t, range)}
          </Text>
        </View>
      ) : null}

      <View style={StyleSheet.absoluteFill} {...responder.panHandlers} />
    </View>
  )
}

const styles = StyleSheet.create({
  label: { position: 'absolute', top: 4 },
})
