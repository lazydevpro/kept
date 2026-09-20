/**
 * The KEPT rings — the signature element.
 *
 * Modelled on Apple Fitness. Three details do the work, and skipping any one of them is
 * what makes a ring widget look like a progress bar bent into a circle:
 *
 *  1. The track is the ring's OWN hue at low luminance, never neutral grey. This is what
 *     makes three arcs read as one object.
 *  2. The colour advances AROUND the circle rather than being fixed in space. SVG has no
 *     conic gradient, so the arc is drawn as ~6° round-capped segments whose colour is
 *     interpolated by absolute angle; the overlap hides every seam.
 *  3. The leading cap casts a soft shadow onto the track ahead of it. That shadow is the
 *     entire reason a ring reads as a physical band rather than a painted line — and it is
 *     what sells the overlap once a ring passes 100%.
 *
 * One implementation for native and web: react-native-svg renders on both, so the rings
 * cannot drift between platforms the way the old Skia + CSS pair did.
 */

import { ReactNode, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg'
import { useAppTheme } from '@/components/theme-provider'
import { type ThemeColors } from '@/constants/theme'

export type RingKey = 'promise' | 'goal' | 'circle'

export type RingTone = { from: string; to: string; track: string }

export function ringTones(colors: ThemeColors): Record<RingKey, RingTone> {
  return {
    promise: { from: colors.ringPromiseFrom, to: colors.ringPromiseTo, track: colors.trackKiwi },
    goal: { from: colors.ringGoalFrom, to: colors.ringGoalTo, track: colors.trackGrape },
    circle: { from: colors.ringCircleFrom, to: colors.ringCircleTo, track: colors.trackCoral },
  }
}

/* ── colour maths ─────────────────────────────────────────── */

function hexToRgb(hex: string) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
}

function mix(from: string, to: string, t: number) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  const clamped = Math.min(Math.max(t, 0), 1)
  const channel = (i: number) => Math.round(a[i] + (b[i] - a[i]) * clamped)
  return `rgb(${channel(0)},${channel(1)},${channel(2)})`
}

/* ── geometry ─────────────────────────────────────────────── */

/** Angles run clockwise from 12 o'clock, matching how progress is read. */
function pointOn(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const [x0, y0] = pointOn(cx, cy, r, startDeg)
  const [x1, y1] = pointOn(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M${x0} ${y0}A${r} ${r} 0 ${large} 1 ${x1} ${y1}`
}

const SEGMENT_DEG = 6
/** Segments overlap slightly so antialiasing never leaves a hairline seam. */
const SEAM_OVERLAP = 0.8

function Arc({
  cx,
  cy,
  r,
  width,
  progress,
  tone,
  id,
}: {
  cx: number
  cy: number
  r: number
  width: number
  progress: number
  tone: RingTone
  id: string
}) {
  const laps = Math.max(0, progress)
  const head = Math.min(laps, 1)
  const overflow = Math.max(0, Math.min(laps - 1, 1))

  const segments = useMemo(() => {
    const build = (fraction: number, dim: boolean) => {
      const sweep = fraction * 360
      if (sweep <= 0.2) return []
      const count = Math.ceil(sweep / SEGMENT_DEG)
      const step = sweep / count
      return Array.from({ length: count }, (_, i) => {
        const start = i * step
        const end = Math.min(start + step + SEAM_OVERLAP, 360)
        return {
          key: `${dim ? 'o' : 'b'}${i}`,
          d: arcPath(cx, cy, r, start, end),
          // Colour is keyed to absolute angle, so the gradient stays put on the dial while
          // the arc grows through it — the same behaviour as a true conic gradient.
          stroke: mix(tone.from, tone.to, (start + step / 2) / 360),
        }
      })
    }
    return { base: build(head, false), over: build(overflow, true) }
  }, [cx, cy, head, overflow, r, tone.from, tone.to])

  const headAngle = (laps >= 1 ? overflow : head) * 360
  const showHead = laps > 0.004
  // Sit the shadow just ahead of the cap along the direction of travel, and keep its radius
  // inside the band so the soft edge reads as contact rather than a grey smudge.
  const [sx, sy] = pointOn(cx, cy, r, headAngle + 2.5)

  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} stroke={tone.track} strokeWidth={width} fill="none" />

      {showHead && <Circle cx={sx} cy={sy} r={width * 0.68} fill={`url(#${id})`} />}

      {segments.base.map((segment) => (
        <Path
          key={segment.key}
          d={segment.d}
          stroke={segment.stroke}
          strokeWidth={width}
          strokeLinecap="round"
          fill="none"
        />
      ))}

      {segments.over.map((segment) => (
        <Path
          key={segment.key}
          d={segment.d}
          stroke={segment.stroke}
          strokeWidth={width}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </G>
  )
}

/* ── public components ────────────────────────────────────── */

export type RingValues = { promise: number; goal: number; circle: number }

/**
 * The rings on their own, with no chrome. `size` is the full diameter; stroke and spacing
 * are derived from it so the stack stays in proportion at any scale.
 */
export function Rings({
  size = 240,
  promise = 0,
  goal = 0,
  circle = 0,
  label,
  children,
}: Partial<RingValues> & { size?: number; label?: string; children?: ReactNode }) {
  const { colors } = useAppTheme()
  const tones = ringTones(colors)

  const width = size * 0.105
  const gap = size * 0.028
  const c = size / 2
  const radii = [c - width / 2, c - width * 1.5 - gap, c - width * 2.5 - gap * 2]
  const hole = radii[2] - width / 2

  const rings: { key: RingKey; value: number; r: number }[] = [
    { key: 'promise', value: promise, r: radii[0] },
    { key: 'goal', value: goal, r: radii[1] },
    { key: 'circle', value: circle, r: radii[2] },
  ]

  const describe = `Promise ${Math.round(promise * 100)}%, goal ${Math.round(goal * 100)}%, circle ${Math.round(circle * 100)}%`

  return (
    <View accessibilityLabel={label ?? describe} accessible style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          {rings.map((ring) => (
            <RadialGradient key={ring.key} id={`kept-cap-${ring.key}`}>
              <Stop offset="0.3" stopColor={colors.shadow} stopOpacity={0.26} />
              <Stop offset="1" stopColor={colors.shadow} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {rings.map((ring) => (
          <Arc
            key={ring.key}
            cx={c}
            cy={c}
            r={ring.r}
            width={width}
            progress={ring.value}
            tone={tones[ring.key]}
            id={`kept-cap-${ring.key}`}
          />
        ))}
      </Svg>
      {children ? (
        // Clamp the centre content to the hole so nothing ever sits under an arc.
        <View pointerEvents="none" style={[styles.center, { paddingHorizontal: (size - hole * 2) / 2 }]}>
          {children}
        </View>
      ) : null}
    </View>
  )
}

/**
 * A small, non-interactive ring stack for list rows and avatars. Identical geometry to
 * the hero so a friend's rings are visibly the same object as your own.
 */
export function RingGlyph({
  size = 56,
  promise = 0,
  goal = 0,
  circle = 0,
  label,
}: Partial<RingValues> & { size?: number; label?: string }) {
  return <Rings size={size} promise={promise} goal={goal} circle={circle} label={label} />
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
})
