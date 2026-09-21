'use client'

import { forwardRef, useId, useImperativeHandle, useMemo, useRef } from 'react'
import { lightColors } from '@/lib/tokens.generated'

/**
 * The KEPT rings, ported from `mobile/features/progress/rings.tsx`.
 *
 * Ported, not redrawn. The three details that make three arcs read as one object are the
 * app's, and they carry over exactly:
 *
 *  1. The track is the ring's OWN hue at low luminance, never neutral grey.
 *  2. Colour advances AROUND the dial rather than sitting fixed on the arc. SVG has no conic
 *     gradient, so the ring is ~6° round-capped segments coloured by absolute angle; the
 *     overlap hides every seam. Because the colour is keyed to angle, a segment's stroke
 *     never changes — which is what makes the scroll-driven version below cheap.
 *  3. The leading cap casts a soft shadow onto the track ahead of it. That shadow is the
 *     whole reason a ring reads as a physical band rather than a painted line.
 *
 * Proportions are the app's too: `width = size * 0.105`, `gap = size * 0.028`. Change them
 * here and the site stops being the same object as the product.
 *
 * ── The one thing this does differently ──
 *
 * The app re-renders on a value change. This has to move at 60fps under a scrub, and
 * re-rendering 180 paths a frame is not that. So the segments are rendered once and driven
 * imperatively through a ref: complete segments toggle `display`, and a single extra `head`
 * path is redrawn for the partial one. Two writes per ring per frame, no React in the loop,
 * and progress stays pixel-smooth rather than snapping in 6° steps.
 *
 * Laps beyond 100% are not supported here — the app draws a second overlapping lap, and the
 * site never shows a value above 1.
 */

export type RingKey = 'promise' | 'goal' | 'circle'
export type RingValues = Record<RingKey, number>

const TONES: Record<RingKey, { from: string; to: string; track: string }> = {
  promise: { from: lightColors.ringPromiseFrom, to: lightColors.ringPromiseTo, track: lightColors.trackKiwi },
  goal: { from: lightColors.ringGoalFrom, to: lightColors.ringGoalTo, track: lightColors.trackGrape },
  circle: { from: lightColors.ringCircleFrom, to: lightColors.ringCircleTo, track: lightColors.trackCoral },
}

const ORDER: RingKey[] = ['promise', 'goal', 'circle']

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
}

function mix(from: string, to: string, t: number) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  const k = Math.min(Math.max(t, 0), 1)
  const ch = (i: 0 | 1 | 2) => Math.round(a[i] + (b[i] - a[i]) * k)
  return `rgb(${ch(0)},${ch(1)},${ch(2)})`
}

/** Angles run clockwise from 12 o'clock, matching how progress is read. */
function pointOn(c: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [c + r * Math.cos(rad), c + r * Math.sin(rad)]
}

function arcPath(c: number, r: number, startDeg: number, endDeg: number) {
  const [x0, y0] = pointOn(c, r, startDeg)
  const [x1, y1] = pointOn(c, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r.toFixed(2)} ${r.toFixed(2)} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

/** Segments overlap slightly so antialiasing never leaves a hairline seam. */
const SEAM_OVERLAP = 0.8

export type RingsHandle = { set: (values: Partial<RingValues>) => void }

type Props = Partial<RingValues> & {
  size?: number
  /** Coarser segments for small glyphs — 180 paths per avatar is not worth the fidelity. */
  detail?: 'full' | 'glyph'
  label?: string
  className?: string
}

export const Rings = forwardRef<RingsHandle, Props>(function Rings(
  { size = 240, promise = 0, goal = 0, circle = 0, detail = 'full', label, className },
  ref,
) {
  // Gradient ids are unique per instance, not per size: three `Rings` at size 40 in one
  // section would otherwise each define `kept-cap-promise-40`, and every arc after the first
  // would reference whichever duplicate the document resolved to.
  const uid = useId().replace(/:/g, '')
  const segmentDeg = detail === 'full' ? 6 : 15
  const width = size * 0.105
  const gap = size * 0.028
  const c = size / 2
  const radii = [c - width / 2, c - width * 1.5 - gap, c - width * 2.5 - gap * 2]

  const geometry = useMemo(() => {
    const count = Math.ceil(360 / segmentDeg)
    const step = 360 / count
    return ORDER.map((key, index) => {
      const r = radii[index] ?? 0
      return {
        key,
        r,
        step,
        segments: Array.from({ length: count }, (_, i) => ({
          d: arcPath(c, r, i * step, Math.min(i * step + step + SEAM_OVERLAP, 360)),
          stroke: mix(TONES[key].from, TONES[key].to, (i * step + step / 2) / 360),
        })),
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c, size, segmentDeg])

  const segRefs = useRef<(SVGPathElement | null)[][]>([[], [], []])
  const headRefs = useRef<(SVGPathElement | null)[]>([])
  const capRefs = useRef<(SVGCircleElement | null)[]>([])

  const initial: RingValues = { promise, goal, circle }

  /**
   * Shared by the first render and every scroll frame, so the static page and the animated
   * one cannot disagree about what 34% looks like.
   */
  const project = (ringIndex: number, value: number) => {
    const ring = geometry[ringIndex]
    if (!ring) return null
    const p = Math.min(Math.max(value, 0), 1)
    const sweep = p * 360
    const whole = Math.floor(sweep / ring.step)
    const remainder = sweep - whole * ring.step
    return {
      whole,
      head:
        remainder > 0.2
          ? {
              d: arcPath(c, ring.r, whole * ring.step, sweep),
              stroke: mix(TONES[ring.key].from, TONES[ring.key].to, (whole * ring.step + remainder / 2) / 360),
            }
          : null,
      cap: p > 0.004 ? pointOn(c, ring.r, sweep + 2.5) : null,
    }
  }

  useImperativeHandle(ref, () => ({
    set(values) {
      ORDER.forEach((key, index) => {
        const value = values[key]
        if (value === undefined) return
        const state = project(index, value)
        if (!state) return

        const paths = segRefs.current[index] ?? []
        for (let i = 0; i < paths.length; i += 1) {
          const node = paths[i]
          if (!node) continue
          const shouldShow = i < state.whole
          // Touch the DOM only when it actually changes — at 6° steps roughly one segment
          // per ring crosses the threshold per frame, and the rest are already correct.
          const hidden = node.style.display === 'none'
          if (shouldShow === hidden) node.style.display = shouldShow ? '' : 'none'
        }

        const head = headRefs.current[index]
        if (head) {
          if (state.head) {
            head.setAttribute('d', state.head.d)
            head.setAttribute('stroke', state.head.stroke)
            head.style.display = ''
          } else {
            head.style.display = 'none'
          }
        }

        const cap = capRefs.current[index]
        if (cap) {
          if (state.cap) {
            cap.setAttribute('cx', state.cap[0].toFixed(2))
            cap.setAttribute('cy', state.cap[1].toFixed(2))
            cap.style.display = ''
          } else {
            cap.style.display = 'none'
          }
        }
      })
    },
  }))

  const describe =
    label ??
    `Promise ${Math.round(promise * 100)} per cent, goal ${Math.round(goal * 100)} per cent, circle ${Math.round(circle * 100)} per cent`

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={describe}
    >
      <defs>
        {ORDER.map((key) => (
          <radialGradient key={key} id={`kept-cap-${key}-${uid}`}>
            <stop offset="0.3" stopColor={lightColors.shadow} stopOpacity={0.26} />
            <stop offset="1" stopColor={lightColors.shadow} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>

      {geometry.map((ring, index) => {
        const state = project(index, initial[ring.key])
        return (
          <g key={ring.key}>
            <circle cx={c} cy={c} r={ring.r} stroke={TONES[ring.key].track} strokeWidth={width} fill="none" />

            <circle
              ref={(node) => {
                capRefs.current[index] = node
              }}
              cx={state?.cap?.[0] ?? c}
              cy={state?.cap?.[1] ?? c}
              r={width * 0.68}
              fill={`url(#kept-cap-${ring.key}-${uid})`}
              style={{ display: state?.cap ? undefined : 'none' }}
            />

            {ring.segments.map((segment, i) => (
              <path
                key={i}
                ref={(node) => {
                  const list = segRefs.current[index]
                  if (list) list[i] = node
                }}
                d={segment.d}
                stroke={segment.stroke}
                strokeWidth={width}
                strokeLinecap="round"
                fill="none"
                style={{ display: i < (state?.whole ?? 0) ? undefined : 'none' }}
              />
            ))}

            <path
              ref={(node) => {
                headRefs.current[index] = node
              }}
              d={state?.head?.d ?? ''}
              stroke={state?.head?.stroke ?? TONES[ring.key].from}
              strokeWidth={width}
              strokeLinecap="round"
              fill="none"
              style={{ display: state?.head ? undefined : 'none' }}
            />
          </g>
        )
      })}
    </svg>
  )
})
