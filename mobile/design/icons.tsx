/**
 * KEPT iconography — Level 1 (line) and Level 2 (duotone plate).
 *
 * Every glyph is drawn on a 24-unit grid inside a 20-unit live area, with a 1.9 stroke,
 * round caps and round joins. Drawing them by hand rather than pulling an icon font is
 * what keeps the optical weight consistent across the app — stock sets mix 1.5 and 2.0
 * strokes and it shows the moment two icons sit in the same row.
 *
 * Level 3 (3D objects) lives in ./objects.tsx.
 */

import { ReactNode } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg'
import { radii } from '@/constants/theme'
import { useAppTheme } from '@/components/theme-provider'

type GlyphProps = { c: string; w: number }
type Glyph = (props: GlyphProps) => ReactNode

const glyphs = {
  /* ── Navigation ─────────────────────────────────────────── */

  rings: ({ c, w }) => (
    <>
      <Path d="M12 21a9 9 0 1 0-9-9" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path d="M12 17a5 5 0 1 0-5-5" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Circle cx={12} cy={12} r={1.3} fill={c} />
    </>
  ),

  people: ({ c, w }) => (
    <>
      <Circle cx={9.5} cy={8} r={3.4} stroke={c} strokeWidth={w} fill="none" />
      <Path
        d="M3.5 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M16.5 5.2a3.4 3.4 0 0 1 0 5.6" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path
        d="M18 14.3a5 5 0 0 1 3 4.6V20"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),

  flag: ({ c, w }) => (
    <>
      <Path d="M5.5 21V3.8" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path
        d="M5.5 4.6h11.9a.7.7 0 0 1 .55 1.13L15.7 8.9l2.25 3.17a.7.7 0 0 1-.55 1.13H5.5"
        stroke={c}
        strokeWidth={w}
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),

  sprout: ({ c, w }) => (
    <>
      <Path d="M12 21v-7.6" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path
        d="M12 13.4C7.3 13.4 5 11.2 5 6.6c4.7 0 7 2.2 7 6.8Z"
        stroke={c}
        strokeWidth={w}
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M12 13.4c0-4.1 2-6.2 6-6.2 0 4.1-2 6.2-6 6.2Z"
        stroke={c}
        strokeWidth={w}
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),

  /* ── Motion & chrome ────────────────────────────────────── */

  chevronRight: ({ c, w }) => (
    <Path
      d="M9.5 5.5 16 12l-6.5 6.5"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  chevronLeft: ({ c, w }) => (
    <Path
      d="M14.5 5.5 8 12l6.5 6.5"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  chevronDown: ({ c, w }) => (
    <Path
      d="M5.5 9.5 12 16l6.5-6.5"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  arrowRight: ({ c, w }) => (
    <>
      <Path d="M4 12h15.5" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path
        d="M13.5 6 19.5 12l-6 6"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  arrowUpRight: ({ c, w }) => (
    <>
      <Path d="M6.8 17.2 17.2 6.8" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path d="M8.8 6.8h8.4v8.4" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  close: ({ c, w }) => (
    <>
      <Path d="M6.4 6.4 17.6 17.6" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path d="M17.6 6.4 6.4 17.6" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  plus: ({ c, w }) => (
    <>
      <Path d="M12 5v14" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path d="M5 12h14" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  minus: ({ c, w }) => <Path d="M5 12h14" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />,
  check: ({ c, w }) => (
    <Path
      d="m5 12.8 4.6 4.4L19 6.6"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  checkCircle: ({ c, w }) => (
    <>
      <Circle cx={12} cy={12} r={8.6} stroke={c} strokeWidth={w} fill="none" />
      <Path
        d="m8.2 12.3 2.6 2.5 5-5.4"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  dot: ({ c, w }) => <Circle cx={12} cy={12} r={8.6} stroke={c} strokeWidth={w} fill="none" />,
  search: ({ c, w }) => (
    <>
      <Circle cx={10.8} cy={10.8} r={6.8} stroke={c} strokeWidth={w} fill="none" />
      <Path d="m15.8 15.8 4.6 4.6" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  more: ({ c }) => (
    <>
      <Circle cx={5.5} cy={12} r={1.6} fill={c} />
      <Circle cx={12} cy={12} r={1.6} fill={c} />
      <Circle cx={18.5} cy={12} r={1.6} fill={c} />
    </>
  ),

  /* ── Objects ────────────────────────────────────────────── */

  flame: ({ c, w }) => (
    <>
      <Path
        d="M12 2.8s5.6 4 5.6 9.1a5.6 5.6 0 1 1-11.2 0c0-2 1-3.6 1-3.6s.7 1.6 2 2c0-3.5 2.6-5.2 2.6-7.5Z"
        stroke={c}
        strokeWidth={w}
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M12 20.4a3 3 0 0 1-1.4-5.7c0 1.4 1.4 2 1.4 2s1.4-.9 1.4-2.4a3 3 0 0 1 0 6.1Z" fill={c} />
    </>
  ),
  trophy: ({ c, w }) => (
    <>
      <Path d="M7 4h10v5.2a5 5 0 0 1-10 0V4Z" stroke={c} strokeWidth={w} strokeLinejoin="round" fill="none" />
      <Path d="M7 5.6H4.6v1.6a3.4 3.4 0 0 0 2.9 3.3" stroke={c} strokeWidth={w} strokeLinejoin="round" fill="none" />
      <Path d="M17 5.6h2.4v1.6a3.4 3.4 0 0 1-2.9 3.3" stroke={c} strokeWidth={w} strokeLinejoin="round" fill="none" />
      <Path d="M12 14.4V18" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path d="M8 20.4h8" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path d="M9.4 20.4a2.6 2.6 0 0 1 5.2 0" stroke={c} strokeWidth={w} strokeLinejoin="round" fill="none" />
    </>
  ),
  sparkle: ({ c, w }) => (
    <>
      <Path
        d="M12 3.5c0 4.2 1.8 6 6 6-4.2 0-6 1.8-6 6 0-4.2-1.8-6-6-6 4.2 0 6-1.8 6-6Z"
        stroke={c}
        strokeWidth={w}
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M18.6 16.2c0 1.8.8 2.6 2.6 2.6-1.8 0-2.6.8-2.6 2.6 0-1.8-.8-2.6-2.6-2.6 1.8 0 2.6-.8 2.6-2.6Z"
        fill={c}
      />
    </>
  ),
  heart: ({ c, w }) => (
    <Path
      d="M12 20.2s-7.8-4.5-7.8-9.7A4.3 4.3 0 0 1 12 8.1a4.3 4.3 0 0 1 7.8 2.4c0 5.2-7.8 9.7-7.8 9.7Z"
      stroke={c}
      strokeWidth={w}
      strokeLinejoin="round"
      fill="none"
    />
  ),
  lock: ({ c, w }) => (
    <>
      <Rect x={4.4} y={10.2} width={15.2} height={10.2} rx={3.2} stroke={c} strokeWidth={w} fill="none" />
      <Path d="M8 10.2V7.6a4 4 0 0 1 8 0v2.6" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Circle cx={12} cy={15.3} r={1.5} fill={c} />
    </>
  ),
  shield: ({ c, w }) => (
    <>
      <Path
        d="M12 3.2 19 6v5.4c0 4.3-2.9 7.6-7 9.4-4.1-1.8-7-5.1-7-9.4V6l7-2.8Z"
        stroke={c}
        strokeWidth={w}
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="m9.2 12 2 2 3.6-3.9"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  bell: ({ c, w }) => (
    <>
      <Path
        d="M6 17.2V11a6 6 0 1 1 12 0v6.2l1.4 2H4.6l1.4-2Z"
        stroke={c}
        strokeWidth={w}
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M10 19.2a2 2 0 0 0 4 0" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  calendar: ({ c, w }) => (
    <>
      <Rect x={3.6} y={5.4} width={16.8} height={15} rx={3.4} stroke={c} strokeWidth={w} fill="none" />
      <Path d="M3.6 10.2h16.8" stroke={c} strokeWidth={w} fill="none" />
      <Path d="M8.4 3.4v3.4" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path d="M15.6 3.4v3.4" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Circle cx={8.4} cy={14.2} r={1.25} fill={c} />
      <Circle cx={12} cy={14.2} r={1.25} fill={c} />
    </>
  ),
  wallet: ({ c, w }) => (
    <>
      <Path
        d="M20.4 9.2V17a3.4 3.4 0 0 1-3.4 3.4H7A3.4 3.4 0 0 1 3.6 17V7.4A2.8 2.8 0 0 1 6.4 4.6h9.2a2.4 2.4 0 0 1 2.4 2.4v2.2"
        stroke={c}
        strokeWidth={w}
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M3.6 8.2h14.4a2.4 2.4 0 0 1 2.4 2.4v3.2h-4.2a2.8 2.8 0 0 1 0-5.6"
        stroke={c}
        strokeWidth={w}
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={16.6} cy={13} r={1.3} fill={c} />
    </>
  ),
  trendUp: ({ c, w }) => (
    <>
      <Path
        d="m4 16.4 4.8-5 3.4 3.2L20 6.6"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M14.6 6.6H20v5.2" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  bars: ({ c, w }) => (
    <>
      <Path d="M5.4 20V14" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path d="M12 20V8.4" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path d="M18.6 20V4.6" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  personAdd: ({ c, w }) => (
    <>
      <Circle cx={10} cy={8} r={3.6} stroke={c} strokeWidth={w} fill="none" />
      <Path
        d="M3.6 20.2v-1.1A5.1 5.1 0 0 1 8.7 14h2.6a5.1 5.1 0 0 1 4.3 2.3"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M18.6 14.4v5.8" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path d="M15.7 17.3h5.8" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  share: ({ c, w }) => (
    <>
      <Path d="M12 3.6v11.2" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Path
        d="m8.2 7.4 3.8-3.8 3.8 3.8"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M5.4 12.6v4.8a3 3 0 0 0 3 3h7.2a3 3 0 0 0 3-3v-4.8"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  info: ({ c, w }) => (
    <>
      <Circle cx={12} cy={12} r={8.6} stroke={c} strokeWidth={w} fill="none" />
      <Path d="M12 11.2v5" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Circle cx={12} cy={8} r={1.2} fill={c} />
    </>
  ),
  alert: ({ c, w }) => (
    <>
      <Circle cx={12} cy={12} r={8.6} stroke={c} strokeWidth={w} fill="none" />
      <Path d="M12 7.6v5.2" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Circle cx={12} cy={16.2} r={1.2} fill={c} />
    </>
  ),
  eyeOff: ({ c, w }) => (
    <>
      <Path
        d="M9.1 5.5A9.4 9.4 0 0 1 12 5c5 0 8.6 4.1 9.5 6.3.2.4.2.9 0 1.4a12 12 0 0 1-2.4 3.3M6.2 7.2A11.6 11.6 0 0 0 2.5 11.3c-.2.5-.2 1 0 1.4C3.4 14.9 7 19 12 19c1.6 0 3-.4 4.3-1.1"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M4.6 4.6 19.4 19.4" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  link: ({ c, w }) => (
    <>
      <Path
        d="M10.2 13.8a3.8 3.8 0 0 0 5.4 0l2.9-2.9a3.8 3.8 0 0 0-5.4-5.4l-1.3 1.3"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M13.8 10.2a3.8 3.8 0 0 0-5.4 0l-2.9 2.9a3.8 3.8 0 0 0 5.4 5.4l1.3-1.3"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  layers: ({ c, w }) => (
    <>
      <Path d="m12 3.6 8.4 4.3L12 12.2 3.6 7.9 12 3.6Z" stroke={c} strokeWidth={w} strokeLinejoin="round" fill="none" />
      <Path d="m3.6 12.4 8.4 4.3 8.4-4.3" stroke={c} strokeWidth={w} strokeLinejoin="round" fill="none" />
      <Path d="m3.6 16.6 8.4 4.3 8.4-4.3" stroke={c} strokeWidth={w} strokeLinejoin="round" fill="none" />
    </>
  ),
  globe: ({ c, w }) => (
    <>
      <Circle cx={12} cy={12} r={8.6} stroke={c} strokeWidth={w} fill="none" />
      <Path d="M3.6 12h16.8" stroke={c} strokeWidth={w} fill="none" />
      <Path
        d="M12 3.4c2.3 2.4 3.5 5.3 3.5 8.6s-1.2 6.2-3.5 8.6c-2.3-2.4-3.5-5.3-3.5-8.6S9.7 5.8 12 3.4Z"
        stroke={c}
        strokeWidth={w}
        fill="none"
      />
    </>
  ),
  sun: ({ c, w }) => (
    <>
      <Circle cx={12} cy={12} r={4.2} stroke={c} strokeWidth={w} fill="none" />
      <Line x1={12} y1={2.6} x2={12} y2={4.6} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <Line x1={12} y1={19.4} x2={12} y2={21.4} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <Line x1={2.6} y1={12} x2={4.6} y2={12} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <Line x1={19.4} y1={12} x2={21.4} y2={12} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <Line x1={5.3} y1={5.3} x2={6.8} y2={6.8} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <Line x1={17.2} y1={17.2} x2={18.7} y2={18.7} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <Line x1={5.3} y1={18.7} x2={6.8} y2={17.2} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <Line x1={17.2} y1={6.8} x2={18.7} y2={5.3} stroke={c} strokeWidth={w} strokeLinecap="round" />
    </>
  ),
  moon: ({ c, w }) => (
    <Path
      d="M20 14.2A8.6 8.6 0 0 1 9.8 4a8.6 8.6 0 1 0 10.2 10.2Z"
      stroke={c}
      strokeWidth={w}
      strokeLinejoin="round"
      fill="none"
    />
  ),
  play: ({ c, w }) => (
    <Path
      d="M8.4 5.9 18 11.2a.9.9 0 0 1 0 1.6L8.4 18.1a.9.9 0 0 1-1.4-.8V6.7a.9.9 0 0 1 1.4-.8Z"
      stroke={c}
      strokeWidth={w}
      strokeLinejoin="round"
      fill="none"
    />
  ),
} satisfies Record<string, Glyph>

export type IconName = keyof typeof glyphs
export const iconNames = Object.keys(glyphs) as IconName[]

export function Icon({
  name,
  size = 24,
  color,
  strokeWidth,
}: {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
}) {
  const { colors } = useAppTheme()
  const tint = color ?? colors.ink
  // 1.9 user units at 24pt, optically compensated so small icons do not go spindly and
  // large ones do not go blobby: ~2.4 at 16pt, 1.9 at 24pt, ~1.6 at 40pt.
  const stroke = strokeWidth ?? 1.9 * Math.pow(24 / size, 0.35)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {glyphs[name]({ c: tint, w: stroke })}
    </Svg>
  )
}

/**
 * Level 2 — a glyph in a hue on a rounded-square plate of that hue's tint. The fixed
 * 44pt plate is what gives list rows their scannable rhythm.
 */
export function IconPlate({
  name,
  tone = 'kiwi',
  size = 44,
  style,
}: {
  name: IconName
  tone?: 'kiwi' | 'grape' | 'coral' | 'sky' | 'sun' | 'neutral'
  size?: number
  style?: StyleProp<ViewStyle>
}) {
  const { colors } = useAppTheme()
  const palette = {
    kiwi: { fg: colors.kiwiDeep, bg: colors.kiwiTint },
    grape: { fg: colors.grape, bg: colors.grapeTint },
    coral: { fg: colors.coralDeep, bg: colors.coralTint },
    sky: { fg: colors.skyDeep, bg: colors.skyTint },
    sun: { fg: colors.sunDeep, bg: colors.sunTint },
    neutral: { fg: colors.inkMuted, bg: colors.surfaceSunken },
  }[tone]

  return (
    <View
      style={[
        styles.plate,
        { width: size, height: size, borderRadius: size * 0.36, backgroundColor: palette.bg },
        style,
      ]}
    >
      <Icon name={name} size={size * 0.52} color={palette.fg} />
    </View>
  )
}

const styles = StyleSheet.create({
  plate: { alignItems: 'center', justifyContent: 'center', borderRadius: radii.plate },
})
