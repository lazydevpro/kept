import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { lightColors, darkColors } from '@/lib/tokens.generated'
import { SANS, SERIF } from '../fonts'

/**
 * The film's shared parts: palette, type, the counter, and the one transition.
 *
 * Three animation moves exist in this film and they are all here — arc draw, rise-and-settle,
 * and count. Anything that needs a fourth should probably not be in the film.
 */

export type Tone = {
  bg: string
  fg: string
  muted: string
  faint: string
  surface: string
  /** True while the film is still on ink — the rings need their dark track set. */
  dark: boolean
}

/** `tone` 0 = ink, 1 = cream. Interpolated rather than switched, so the lift does not pop. */
export function palette(tone: number): Tone {
  const mix = (dark: string, light: string) => (tone < 0.5 ? dark : light)
  const blend = (dark: string, light: string) => {
    // Cross-fade the two palettes through the middle of the transition only.
    if (tone <= 0) return dark
    if (tone >= 1) return light
    return tone < 0.5 ? dark : light
  }
  return {
    bg: blend(darkColors.background, lightColors.background),
    fg: blend(darkColors.ink, lightColors.ink),
    muted: mix(darkColors.inkMuted, lightColors.inkMuted),
    faint: mix(darkColors.inkFaint, lightColors.inkFaint),
    surface: mix(darkColors.surface, lightColors.surface),
    dark: tone < 0.5,
  }
}

/** ── Type ────────────────────────────────────────────────────────────────────────────── */

export function useScale() {
  const { width, height } = useVideoConfig()
  // Portrait needs a bigger share of a narrower frame, or the copy reads as a caption.
  const ratio = height > width ? 0.072 : height === width ? 0.058 : 0.05
  return Math.round(width * ratio)
}

/**
 * Ring diameter, as a fraction of frame width, corrected for aspect.
 *
 * A flat fraction of `width` under-sizes the rings in portrait for the same reason it
 * under-sized the type: a 1080-wide frame being watched at a third the physical size needs a
 * bigger share of it. The hero ring is the subject of most of this film, so getting this wrong
 * leaves the vertical cut looking like a slide deck.
 */
export function useRingPx() {
  const { width, height } = useVideoConfig()
  const boost = height > width ? 1.95 : height === width ? 1.35 : 1
  return (fraction: number) => Math.round(width * fraction * boost)
}

/**
 * Rise and settle. Every piece of text and every card in the film enters through this, with a
 * 4-frame stagger between siblings. `damping: 200` means no bounce — bounce happens once in
 * the whole film, on the week-52 total, and it is a reward rather than a default.
 */
export function Enter({
  at = 0,
  stagger = 0,
  children,
  style,
}: {
  at?: number
  stagger?: number
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const progress = spring({
    frame: frame - at - stagger,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  })
  return (
    <div
      style={{
        ...style,
        opacity: interpolate(progress, [0, 0.6], [0, 1], { extrapolateRight: 'clamp' }),
        transform: `translateY(${interpolate(progress, [0, 1], [16, 0])}px)`,
      }}
    >
      {children}
    </div>
  )
}

export function Line({
  text,
  serif,
  tone,
  size,
  at = 0,
  align = 'center',
  weight = 700,
}: {
  text: string
  serif?: string
  tone: Tone
  size: number
  at?: number
  align?: 'center' | 'left'
  weight?: number
}) {
  return (
    <Enter at={at}>
      <p
        style={{
          margin: 0,
          fontFamily: SANS,
          fontWeight: weight,
          fontSize: size,
          lineHeight: 1.16,
          letterSpacing: '-0.035em',
          color: tone.fg,
          textAlign: align,
          maxWidth: '84%',
          marginInline: align === 'center' ? 'auto' : undefined,
        }}
      >
        {text}
        {serif ? (
          <>
            {' '}
            <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400 }}>{serif}</span>
          </>
        ) : null}
      </p>
    </Enter>
  )
}

export function Eyebrow({ text, tone, size }: { text: string; tone: Tone; size: number }) {
  return (
    <p
      style={{
        margin: 0,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: size * 0.28,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: tone.muted,
      }}
    >
      {text}
    </p>
  )
}

/** ── Count ───────────────────────────────────────────────────────────────────────────── */

/**
 * Numbers count. A figure that cuts to its final value reads as a slide, not a film.
 *
 * Tabular figures are not optional here — proportional digits make a counting number jitter
 * horizontally, which is the single most common tell of a cheap motion-graphics job.
 */
export function Counter({
  value,
  prefix = '',
  suffix = '',
  size,
  tone,
  weight = 800,
  bounce = false,
  at = 0,
}: {
  value: number
  prefix?: string
  suffix?: string
  size: number
  tone: Tone
  weight?: number
  bounce?: boolean
  at?: number
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const pop = spring({
    frame: frame - at,
    fps,
    config: bounce ? { damping: 11, mass: 0.7 } : { damping: 200 },
    durationInFrames: bounce ? 26 : 18,
  })

  return (
    <span
      style={{
        fontFamily: SANS,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: '-0.05em',
        color: tone.fg,
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum" 1',
        display: 'inline-block',
        transform: `scale(${interpolate(pop, [0, 1], [bounce ? 0.8 : 1, 1])})`,
      }}
    >
      {prefix}
      {Math.round(value).toLocaleString('en-US')}
      {suffix}
    </span>
  )
}

/** ── The transition ──────────────────────────────────────────────────────────────────── */

/**
 * The one transition in the film, and it is the brand's own: a ring arc sweeps the frame.
 *
 * Built as a circle whose stroke is half the diagonal wide and whose radius is a quarter of
 * it, so the band spans corner to corner. Growing the dash sweeps colour on from twelve
 * o'clock; then growing the offset sweeps it off from the same point, which reads as one band
 * travelling round rather than two separate wipes.
 *
 * No fades, no slides, no light leaks anywhere else. A film with one signature transition
 * looks authored; a film with five looks like a template.
 */
export function RingWipes({
  boundaries,
  colour,
  half = 9,
}: {
  boundaries: number[]
  colour: string
  half?: number
}) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()

  const active = boundaries.find((b) => frame > b - half && frame < b + half)
  if (active === undefined) return null

  const diagonal = Math.hypot(width, height)
  const r = diagonal / 4
  const circumference = 2 * Math.PI * r
  const p = (frame - (active - half)) / (half * 2)

  const on = p < 0.5
  const t = on ? p * 2 : (p - 0.5) * 2
  const dash = on ? t * circumference : circumference
  const offset = on ? 0 : -t * circumference

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        <circle
          cx={width / 2}
          cy={height / 2}
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth={diagonal / 2}
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${width / 2} ${height / 2})`}
        />
      </svg>
    </AbsoluteFill>
  )
}

/** ── Week strip ──────────────────────────────────────────────────────────────────────── */

/**
 * The 52-week bar strip, the same object as the landing page's. Bars only ever appear —
 * nothing animates out — so the strip reads as an accumulating record rather than a chart.
 */
export function Strip({
  through,
  kept,
  width: stripWidth,
  height: stripHeight,
  tone,
}: {
  through: number
  kept: (week: number) => boolean
  width: number
  height: number
  tone: Tone
}) {
  const gap = Math.max(2, Math.round(stripWidth * 0.0035))
  const barWidth = (stripWidth - gap * 51) / 52

  return (
    <div style={{ display: 'flex', gap, height: stripHeight, alignItems: 'flex-end' }}>
      {Array.from({ length: 52 }, (_, i) => {
        const week = i + 1
        const reached = week <= through
        const good = kept(week)
        const scale = !reached ? 0.12 : good ? 1 : 0.32
        return (
          <div
            key={i}
            style={{
              width: barWidth,
              height: stripHeight,
              borderRadius: 999,
              transformOrigin: 'bottom',
              transform: `scaleY(${scale})`,
              background: !reached
                ? tone.faint
                : good
                  ? `linear-gradient(to top, ${lightColors.ringPromiseFrom}, ${lightColors.ringPromiseTo})`
                  : lightColors.coral,
              opacity: reached ? 1 : 0.35,
            }}
          />
        )
      })}
    </div>
  )
}
