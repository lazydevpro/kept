'use client'

import { useRef } from 'react'
import { useMotionScene } from '@/lib/motion'
import styles from './manifesto.module.css'

/**
 * The emotional beat, and the reference's signature move done a little better.
 *
 * gokiwi.in splits its paragraph into spans and toggles a class as scroll passes each one —
 * words snap on, one at a time. Here the colour is *interpolated* across a soft leading edge
 * three words wide, so the sentence lights like a filament rather than a row of switches, and
 * the three words that name the product's three hues land in those hues rather than in ink.
 *
 * Note that the resting state is fully legible — `--lit: 1` in the stylesheet, meaning "all
 * on". Scrolling dims the words ahead of the reader rather than revealing words that were
 * hidden. That inversion is what lets the harness refuse to run at all under reduced motion
 * and still leave a paragraph anybody can read.
 */

/** `tone` promotes a word to a brand hue at full brightness. Mapping per the design system. */
const LINES: { text: string; tone?: 'kiwi' | 'grape' | 'coral' }[][] = [
  [
    { text: 'Most' },
    { text: 'investing' },
    { text: 'apps' },
    { text: 'ask' },
    { text: 'what' },
    { text: "you're" },
    { text: 'worth.' },
  ],
  [
    { text: 'This' },
    { text: 'one' },
    { text: 'asks' },
    { text: 'whether' },
    { text: 'you' },
    { text: 'showed', tone: 'kiwi' },
    { text: 'up.', tone: 'kiwi' },
  ],
  [
    { text: 'Twenty' },
    { text: 'dollars' },
    { text: 'a' },
    { text: 'week.' },
    { text: 'A' },
    { text: 'promise', tone: 'grape' },
    { text: 'you' },
    { text: 'made' },
    { text: 'out' },
    { text: 'loud.' },
  ],
  [
    { text: 'And' },
    { text: 'four', tone: 'coral' },
    { text: 'people', tone: 'coral' },
    { text: 'who' },
    { text: 'notice' },
    { text: 'when' },
    { text: 'you' },
    { text: 'keep' },
    { text: 'it.' },
  ],
]

const WORDS = LINES.flat()

export function Manifesto() {
  const root = useRef<HTMLElement>(null)

  useMotionScene(
    ({ gsap }) => {
      const words = gsap.utils.toArray<HTMLElement>(`.${styles.word}`)
      // Start dark, then light through. Three words of feathering either side of the head.
      const FEATHER = 3
      gsap.set(words, { '--lit': 0 })

      const state = { progress: 0 }
      gsap.to(state, {
        progress: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.35,
          // No `pin` here on purpose. The viewport is pinned by CSS `position: sticky`, which
          // costs nothing, needs no JavaScript, and still holds under reduced motion — where
          // ScrollTrigger is never allowed to run. Adding `pin` on top would give the element
          // two owners of its position and they disagree.
        },
        onUpdate: () => {
          // Runs the head a little past the end so the last word finishes before the
          // section releases — otherwise the closing line is still dim as it scrolls away.
          const head = state.progress * (words.length + FEATHER)
          for (let i = 0; i < words.length; i += 1) {
            const lit = Math.min(1, Math.max(0, (head - i) / FEATHER))
            words[i]?.style.setProperty('--lit', lit.toFixed(3))
          }
        },
      })
    },
    { scope: root },
  )

  return (
    <section className={styles.section} ref={root} id="manifesto" aria-labelledby="manifesto-heading">
      <div className={styles.viewport}>
        <div className="shell">
          <h2 id="manifesto-heading" className={styles.copy}>
            {LINES.map((line, lineIndex) => (
              <span className={styles.line} key={lineIndex}>
                {line.map((word, wordIndex) => (
                  <span className={styles.word} data-tone={word.tone} key={`${lineIndex}-${wordIndex}`}>
                    {word.text}{' '}
                  </span>
                ))}
              </span>
            ))}
          </h2>
        </div>
      </div>
    </section>
  )
}

export const MANIFESTO_WORD_COUNT = WORDS.length
