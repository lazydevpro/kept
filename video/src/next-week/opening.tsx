import React from 'react'
import { Rings } from '@/components/rings'
import { SANS } from '../fonts'
import { ARRIVALS, PUSHES, SECTION, STREAK, STREAK_PAGES } from './cues'
import { clamp, easeIn, easeInOut, easeOut, lerp, mixHex, span, spring } from './motion'
import { CREAM, CX, CY, Camera, Caption, D, Glow, Hoop, INK, Smear } from './parts'

/**
 * 1 · Problem, and 2 · Turn — 0:00 to 0:22 at 120 BPM.
 *
 * A to-do gets dragged into next week until the weeks streak past, then everything stops
 * and only its empty circle is left. Three more circles arrive; ours becomes the ring; the
 * camera flies through the ring's centre into white.
 */

export type Clock = { beat: number; spb: number; fpb: number }

const PAGE = 1920
const ITEM = 'Start investing'
const ITEM_SIZE = 104
/** The checkbox sits left of the words; the pair is centred as one object. */
const HOOP_DX = -452
const TEXT_DX = -370
const HOOP_R = 46
const GREY = D.inkFaint
const DISTRACTIONS = ['Weekend.', 'New phone.', 'Later.']

/** Which week-page the to-do is on, as a float. Pushes, then the streak, then a dead stop. */
function itemPage(beat: number) {
  let page = 0
  for (const [start, end] of PUSHES) {
    if (beat >= end) page += 1
    else if (beat > start) return page + easeInOut((beat - start) / (end - start))
    else return page
  }
  const [start, end] = STREAK
  if (beat <= start) return page
  // Cubic ease-in: fastest at the very end, then nothing. That is the hard stop.
  return page + STREAK_PAGES * easeIn(clamp((beat - start) / (end - start)))
}

/** The camera overshoots the stop by a hair and settles — the jolt of it. */
function stopJolt(beat: number) {
  const t = beat - SECTION.stop
  if (t <= 0) return 0
  return 0.028 * Math.exp(-5 * t) * Math.sin(16 * t)
}

/** Where the camera is, in pages. It trails the to-do during pushes and locks on in the streak. */
function cameraPage(beat: number) {
  const lag = 0.1 * (1 - clamp((beat - STREAK[0]) / 0.6))
  return itemPage(Math.max(0, beat - lag)) + stopJolt(beat)
}

/** How lifted the to-do is: up while it is being dragged. */
function lift(beat: number) {
  for (const [start, end] of PUSHES) {
    if (beat > start && beat < end) return Math.sin(Math.PI * ((beat - start) / (end - start)))
  }
  return span(beat, STREAK[0], STREAK[0] + 0.4) * (1 - span(beat, SECTION.stop, SECTION.stop + 0.3))
}

export function Problem({ beat, fpb }: Clock) {
  if (beat > 25) return null

  const zoom = lerp(1.32, 1, span(beat, 0, 4, easeInOut))
  const cam = cameraPage(beat)
  const item = itemPage(beat)
  const speed = (((cameraPage(beat + 0.02) - cameraPage(beat - 0.02)) / 0.04) * PAGE * zoom) / fpb
  const pagesOut = 1 - span(beat, SECTION.stop + 0.2, SECTION.stop + 1.2)
  const reveal = span(beat, 1.5, 4)
  const up = lift(beat)

  const first = Math.floor(cam) - 1
  const pages = Array.from({ length: 4 }, (_, i) => first + i).filter((i) => i >= 0)

  return (
    <>
      <Smear x={speed * 0.16} y={0}>
        <Camera zoom={zoom} fx={cam * PAGE} fy={CY}>
          {pages.map((i) => (
            <WeekPage key={i} index={i} beat={beat} opacity={reveal * pagesOut} />
          ))}

          {DISTRACTIONS.map((word, k) => {
            const x = (k + 1.5) * PAGE + 40
            return (
              <div
                key={word}
                style={{
                  position: 'absolute',
                  left: x,
                  top: CY - 205,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 60,
                  letterSpacing: '-0.02em',
                  color: GREY,
                  opacity: 0.9 * pagesOut,
                }}
              >
                {word}
              </div>
            )
          })}
        </Camera>
      </Smear>

      {/* The to-do rides the camera, so it stays sharp while the weeks smear past. */}
      <Camera zoom={zoom} fx={cam * PAGE} fy={CY}>
        {/* The to-do. Its checkbox is handed to `LoneCircle` at the stop. */}
        <div
          style={{
            position: 'absolute',
            left: item * PAGE,
            top: CY,
            transform: `translateY(${-18 * up}px) rotate(${-1.6 * up}deg) scale(${1 + 0.045 * up})`,
            opacity: span(beat, 0, 1.6, easeOut),
          }}
        >
          {beat < SECTION.stop && <Hoop x={HOOP_DX} y={0} r={HOOP_R} stroke={GREY} width={5.5} />}
          <div
            style={{
              position: 'absolute',
              left: TEXT_DX,
              top: 0,
              transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: ITEM_SIZE,
              letterSpacing: '-0.025em',
              color: CREAM,
              textShadow: up > 0.05 ? `0 ${18 * up}px ${40 * up}px rgba(0,0,0,0.6)` : undefined,
            }}
          >
            {ITEM.split('').map((ch, i) => {
              const fall = span(
                beat,
                SECTION.stop + 0.35 + i * 0.07,
                SECTION.stop + 1.45 + i * 0.07,
                easeIn,
              )
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    whiteSpace: 'pre',
                    transform: `translateY(${fall * 460}px) rotate(${(i % 2 ? 1 : -1) * fall * 38}deg)`,
                    opacity: 1 - fall,
                  }}
                >
                  {ch}
                </span>
              )
            })}
          </div>
        </div>
      </Camera>
    </>
  )
}

/** One week: its label, and the days along the bottom. Page 0 is this week; every other is next. */
function WeekPage({ index, beat, opacity }: { index: number; beat: number; opacity: number }) {
  const x = index * PAGE
  const sweep = index === 0 ? span(beat, 4, 7.8, (t) => t) * 6 : -1
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, opacity }}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: CY - 250,
          transform: 'translate(-50%, -50%)',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 42,
          letterSpacing: '0.24em',
          color: index === 0 ? GREY : CREAM,
          opacity: index === 0 ? 0.9 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {index === 0 ? 'THIS WEEK' : 'NEXT WEEK'}
      </div>
      <div
        style={{
          position: 'absolute',
          left: x - 430,
          top: CY + 176,
          width: 860,
          height: 1.5,
          background: GREY,
          opacity: 0.35,
        }}
      />
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, d) => {
        const lit = index === 0 ? clamp(1 - Math.abs(sweep - d) / 1.2) : 0
        return (
          <div
            key={d}
            style={{
              position: 'absolute',
              left: x + (d - 3) * 124,
              top: CY + 222,
              transform: 'translate(-50%, -50%)',
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 30,
              color: CREAM,
              opacity: 0.4 + lit * 0.55,
            }}
          >
            {day}
          </div>
        )
      })}
      {index === 0 && beat > 3.8 && beat < 8.4 && (
        <div
          style={{
            position: 'absolute',
            left: x + (sweep - 3) * 124 - 5,
            top: CY + 172,
            width: 10,
            height: 10,
            borderRadius: 5,
            background: CREAM,
            boxShadow: `0 0 18px ${CREAM}`,
            opacity: span(beat, 3.8, 4.3) * (1 - span(beat, 7.8, 8.4)),
          }}
        />
      )}
    </div>
  )
}

// ── The lone circle, the friends, the ring ─────────────────────────────────────────────

const FRIENDS = [
  { dir: [-0.894, 0.447], color: D.grape },
  { dir: [0.894, 0.447], color: D.coral },
  { dir: [0, -1], color: D.sky },
] as const

/** The ring's radius at its biggest, before the fly-through. Shared with the cream disk. */
const RING_R = 240

/** Where the lone circle is and how big — the one object on screen from the stop to 0:22. */
function loneCircle(beat: number, spb: number) {
  const glide = span(beat, SECTION.stop + 1.4, SECTION.stop + 4, easeInOut)
  const x = lerp(CX + HOOP_DX - stopJolt(beat) * PAGE, CX, glide)
  let y = lerp(CY, 470, glide)
  let r = lerp(HOOP_R, 110, glide)
  const grow = spring((beat - SECTION.drop) * spb, { w: 9, z: 0.72 })
  y = lerp(y, CY, grow)
  r = lerp(r, RING_R, grow)
  return { x, y, r }
}

/** How far the camera has flown into the ring. 1 = the cream inside fills the frame. */
export function flyZoom(beat: number) {
  return Math.exp(Math.log(11) * span(beat, SECTION.through, SECTION.promise, easeIn))
}

export function Turn({ beat, spb }: Clock) {
  if (beat < SECTION.stop || beat > SECTION.promise + 0.1) return null

  const { x, y, r } = loneCircle(beat, spb)
  const lit = span(beat, SECTION.drop, SECTION.drop + 0.3, easeOut)
  const sweep = span(beat, SECTION.drop, SECTION.drop + 1.4, easeInOut)
  const ringSize = r / 0.4475
  const disk = spring((beat - 40) * spb, { w: 8, z: 1 }) * (RING_R - 24)
  const zoom = flyZoom(beat)

  return (
    <Camera zoom={zoom} fx={CX} fy={CY}>
      {/* The first colour in the film arrives with the drop. */}
      <Glow x={CX + Math.sin(beat * 0.35) * 40} y={CY} r={760} color={D.kiwi} opacity={0.2 * lit} />
      <Glow
        x={CX - 560 + Math.sin(beat * 0.3) * 30}
        y={CY + 260}
        r={620}
        color={D.grape}
        opacity={0.13 * lit}
      />
      <Glow
        x={CX + 580}
        y={CY - 220 + Math.cos(beat * 0.3) * 30}
        r={600}
        color={D.coral}
        opacity={0.11 * lit}
      />

      {FRIENDS.map((friend, k) => {
        const a = spring((beat - ARRIVALS[k]!) * spb, { w: 6.5, z: 0.82 })
        if (a <= 0) return null
        const dist = r + 175 + (1 - a) * 1100
        const bob = Math.sin(beat * 0.8 + k * 2.1) * 6
        const fx = x + friend.dir[0] * dist
        const fy = y + friend.dir[1] * dist + bob
        return (
          <React.Fragment key={k}>
            <Glow
              x={fx}
              y={fy}
              r={240}
              color={friend.color}
              opacity={(0.32 + 0.18 * lit) * clamp(a * 1.4)}
            />
            <Hoop
              x={fx}
              y={fy}
              r={66}
              stroke={friend.color}
              width={6 + 5 * lit}
              opacity={clamp(a * 1.4)}
            />
          </React.Fragment>
        )
      })}

      {/* Ours: grey until the drop, then the promise ring drawing itself. */}
      <Hoop
        x={x}
        y={y}
        r={r}
        stroke={GREY}
        width={lerp(4.5, 6, clamp((r - HOOP_R) / 50))}
        opacity={1 - lit}
      />
      {lit > 0 && (
        <div
          style={{
            position: 'absolute',
            left: x - ringSize / 2,
            top: y - ringSize / 2,
            opacity: lit,
          }}
        >
          <Rings size={ringSize} promise={sweep} only={['promise']} mode="dark" />
        </div>
      )}

      {/* The ring's hollow fills with cream — the white the camera is about to fly into. */}
      {disk > 0.5 && (
        <div
          style={{
            position: 'absolute',
            left: CX - disk,
            top: CY - disk,
            width: disk * 2,
            height: disk * 2,
            borderRadius: '50%',
            background: CREAM,
          }}
        />
      )}

      {beat > 37.8 && (
        <div
          style={{
            position: 'absolute',
            left: CX,
            top: CY,
            transform: `translate(-50%, -50%) scale(${lerp(0.9, 1, span(beat, 38, 38.9, easeOut))})`,
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 108,
            letterSpacing: '0.05em',
            color: mixHex(CREAM, INK, span(beat, 40.2, 40.9)),
            opacity: span(beat, 38, 38.8, easeOut),
            filter: `blur(${(1 - span(beat, 38, 38.9, easeOut)) * 10}px)`,
          }}
        >
          KEPT
        </div>
      )}
    </Camera>
  )
}

/** The words of the opening. They sit under the circle, in the one place there is room. */
export function OpeningWords({ beat }: Clock) {
  return (
    <>
      <Caption
        beat={beat}
        at={23.8}
        out={27.2}
        y={735}
        size={76}
        color={CREAM}
        words={['Next week', { accent: 'never' }, 'comes.']}
      />
      <Caption
        beat={beat}
        at={27.8}
        out={32.2}
        y={735}
        size={76}
        color={CREAM}
        words={["Unless you're not doing it", { accent: 'alone.' }]}
      />
    </>
  )
}
