import React from 'react'
import { staticFile } from 'remotion'
import { Rings } from '@/components/rings'
import { SANS } from '../fonts'
import { AWARDS, HITS, MISSED_WEEK, SECTION, weekBeat, yearWeek } from './cues'
import { clamp, easeInOut, easeOut, lerp, span, spring } from './motion'
import { Camera, Caption, CREAM, CX, CY, D, Glow, INK, L, Smear } from './parts'
import { Award } from './middle'
import type { Clock } from './opening'

/**
 * 8 · The year, 9 · End — 1:00 to 1:16 at 120 BPM.
 *
 * The opening's row of weeks again, in white, and this time every circle closes as the camera
 * passes it — except one, and the row keeps going anyway. Awards land on the weeks that
 * earned them. On week fifty-two the camera pushes in; the ring becomes all three, the white
 * drains away, and they close on three beats.
 */

const [H0, H1, H2] = HITS as unknown as [number, number, number]
const SPACING = 390
export const WEEK_SIZE = 220
const ROW_Y = CY

/** 1 → 5.3: the week-52 ring growing into the three rings that fill the frame. */
function endZoom(beat: number) {
  return Math.pow(900 / WEEK_SIZE, span(beat, 135, 137.2, easeInOut))
}

export function Year({ beat, spb, fpb }: Clock) {
  if (beat < SECTION.year - 0.05 || beat > 137.3) return null

  const p = yearWeek(beat)
  const speed = (((yearWeek(beat + 0.02) - yearWeek(beat - 0.02)) / 0.04) * SPACING) / fpb
  const zoom = endZoom(beat)
  const othersOut = span(beat, 135, 136.2, easeOut)
  const rowIn = span(beat, 119.2, SECTION.year + 0.6, easeOut)

  const weeks: React.ReactNode[] = []
  const lo = Math.max(1, Math.floor(p - 4))
  const hi = Math.min(52, Math.ceil(p + 4))
  for (let w = lo; w <= hi; w++) {
    const x = CX + (w - p) * SPACING
    const missed = w === MISSED_WEEK
    const value = w === 1 ? 1 : missed ? 0 : easeOut(clamp((p - (w - 0.42)) / 0.34))
    const isLast = w === 52
    const fade = (isLast ? 1 : 1 - othersOut) * (w === 1 ? 1 : rowIn)
    // The last week's ring is handed to `End` the moment the three rings start to appear.
    if (isLast && beat >= 136) continue
    weeks.push(
      <React.Fragment key={w}>
        <div
          style={{
            position: 'absolute',
            left: x - WEEK_SIZE / 2,
            top: ROW_Y - WEEK_SIZE / 2,
            opacity: fade,
          }}
        >
          <Rings size={WEEK_SIZE} promise={value} only={['promise']} detail="glyph" />
        </div>
        <div
          style={{
            position: 'absolute',
            left: x,
            top: ROW_Y - 168,
            transform: 'translate(-50%, -50%)',
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: '0.22em',
            color: missed ? L.inkFaint : L.inkMuted,
            opacity: fade * (w === 1 ? rowIn : 1),
            whiteSpace: 'nowrap',
          }}
        >
          WEEK {w}
        </div>
      </React.Fragment>,
    )
  }

  const awards = AWARDS.map((award) => {
    const x = CX + (award.week - p) * SPACING
    if (Math.abs(x - CX) > 1400) return null
    const at = award.week === 1 ? SECTION.year + 0.4 : weekBeat(award.week - 0.25)
    const pop = spring((beat - at) * spb, { w: 12, z: 0.6 })
    if (pop <= 0) return null
    const fade = award.week === 52 ? 1 - othersOut : 1 - othersOut
    return (
      <React.Fragment key={award.week}>
        <Award
          name={award.object}
          size={200}
          style={{ left: x - 100, top: ROW_Y - 492, transform: `scale(${pop})`, opacity: fade }}
        />
        <div
          style={{
            position: 'absolute',
            left: x,
            top: ROW_Y - 262,
            transform: `translate(-50%, -50%) scale(${lerp(0.8, 1, clamp(pop))})`,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: '-0.02em',
            color: INK,
            opacity: clamp(pop * 1.5) * fade,
            whiteSpace: 'nowrap',
          }}
        >
          {award.title}
        </div>
      </React.Fragment>
    )
  })

  return (
    <Smear x={speed * 0.1 * zoom} y={0}>
      <Camera zoom={zoom} fx={CX} fy={ROW_Y}>
        {weeks}
        {awards}
      </Camera>
    </Smear>
  )
}

export function YearWords({ beat }: Clock) {
  return (
    <Caption
      beat={beat}
      at={121}
      out={127.5}
      y={850}
      size={66}
      words={['Week after', { accent: 'week.' }]}
    />
  )
}

// ── End ──────────────────────────────────────────────────────────────────────────────────

/** The background drains from cream to ink under the three rings. */
export function endDark(beat: number) {
  return span(beat, 136, 138.2, easeInOut)
}

export function End({ beat, spb }: Clock) {
  if (beat < 136) return null

  const dark = endDark(beat)
  const contract = span(beat, 140.3, 141.8, easeInOut)
  const toMark = span(beat, SECTION.logo - 0.6, SECTION.logo + 0.8, easeInOut)
  const size = lerp(lerp(WEEK_SIZE * endZoom(beat), 300, contract), 150, toMark)
  const y = lerp(lerp(ROW_Y, 400, contract), 390, toMark)
  const goal = span(beat, H1 - 0.7, H1, easeOut)
  const circle = span(beat, H2 - 0.7, H2, easeOut)
  const trackIn = span(beat, 136, 136.8)
  const ringsOut = span(beat, SECTION.logo, SECTION.logo + 0.8)

  const hit = (at: number) => Math.exp(-Math.max(0, beat - at) * 2.2) * (beat >= at ? 1 : 0)
  const glow = 0.18 + 0.2 * (hit(H0) + hit(H1) + hit(H2))

  const mark = spring((beat - SECTION.logo) * spb, { w: 10, z: 0.8 })
  const word = span(beat, SECTION.logo + 0.6, SECTION.logo + 1.6, easeOut)
  const cta = span(beat, SECTION.logo + 2, SECTION.logo + 3, easeOut)
  const small = span(beat, SECTION.logo + 2.8, SECTION.logo + 3.8, easeOut)

  const rings = (mode: 'light' | 'dark') => (
    <>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - trackIn }}>
        <Rings size={size} promise={1} only={['promise']} mode={mode} />
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: trackIn }}>
        <Rings size={size} promise={1} goal={goal} circle={circle} mode={mode} />
      </div>
    </>
  )

  return (
    <>
      {/* Off-centre, so the light falls round the rings and not into their middle. */}
      <Glow
        x={CX + size * 0.1}
        y={y - size * 0.42}
        r={size * 0.85}
        color={D.kiwi}
        opacity={glow * dark * (1 - ringsOut)}
      />
      <Glow
        x={CX - size * 0.35}
        y={y + size * 0.25}
        r={size * 0.8}
        color={D.grape}
        opacity={(0.1 + 0.3 * hit(H1)) * dark * (1 - ringsOut)}
      />
      <Glow
        x={CX + size * 0.35}
        y={y - size * 0.2}
        r={size * 0.8}
        color={D.coral}
        opacity={(0.1 + 0.3 * hit(H2)) * dark * (1 - ringsOut)}
      />

      <div
        style={{
          position: 'absolute',
          left: CX - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          opacity: 1 - ringsOut,
          transform: `scale(${1 + 0.035 * (hit(H0) + hit(H1) + hit(H2))})`,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - dark }}>{rings('light')}</div>
        <div style={{ position: 'absolute', inset: 0, opacity: dark }}>{rings('dark')}</div>
      </div>

      <Caption
        beat={beat}
        at={141.5}
        out={SECTION.logo - 0.7}
        y={700}
        size={92}
        color={CREAM}
        words={['Promises', { accent: 'compound.' }]}
      />

      {/* The mark, tinted kiwi: the pinkies of a promise. */}
      {mark > 0 && (
        <div
          style={{
            position: 'absolute',
            left: CX - 125,
            top: 390 - 85,
            width: 250,
            height: 170,
            background: D.kiwi,
            WebkitMaskImage: `url(${staticFile('promise.svg')})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            transform: `scale(${lerp(0.6, 1, mark)})`,
            opacity: clamp(mark * 1.4),
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: CX,
          top: 575,
          transform: `translate(-50%, -50%) translateY(${(1 - word) * 30}px)`,
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 150,
          letterSpacing: '0.02em',
          color: CREAM,
          opacity: word,
          filter: word < 1 ? `blur(${(1 - word) * 12}px)` : undefined,
        }}
      >
        KEPT
      </div>
      <div
        style={{
          position: 'absolute',
          left: CX,
          top: 718,
          transform: `translate(-50%, -50%) translateY(${(1 - cta) * 20}px)`,
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 38,
          letterSpacing: '-0.01em',
          color: CREAM,
          opacity: cta * 0.82,
          whiteSpace: 'nowrap',
        }}
      >
        Android beta now · Solana dApp Store soon
      </div>
      <div
        style={{
          position: 'absolute',
          left: CX,
          top: 782,
          transform: 'translate(-50%, -50%)',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 32,
          color: D.kiwi,
          opacity: cta,
        }}
      >
        keptapp.pages.dev
      </div>
      <div
        style={{
          position: 'absolute',
          left: CX,
          top: 1030,
          transform: 'translate(-50%, -50%)',
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 18,
          color: D.inkFaint,
          opacity: small * 0.9,
          whiteSpace: 'nowrap',
        }}
      >
        Tokenized stocks via xStocks. Private-market tokens via Tessera. Not available to U.S.
        persons. Capital at risk.
      </div>
    </>
  )
}
