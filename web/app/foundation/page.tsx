import type { Metadata } from 'next'
import { lightColors } from '@/lib/tokens.generated'
import { MotionCheck } from './motion-check'
import styles from './foundation.module.css'

export const metadata: Metadata = {
  title: 'Foundation — KEPT',
  description: 'The generated design tokens, the type scale, and a live check of the motion harness.',
  robots: { index: false, follow: false },
}

/**
 * A living reference for the foundation, kept in the build rather than in a screenshot.
 *
 * Everything here is read from `lib/tokens.generated.ts`, which the same script writes as
 * `app/tokens.css` — so if a swatch on this page is the wrong colour, the stylesheet is wrong
 * too, and the two cannot disagree. It is `noindex`: useful to us, not to a search engine.
 */
export default function Foundation() {
  const groups: { title: string; names: (keyof typeof lightColors)[] }[] = [
    { title: 'Brand', names: ['kiwi', 'kiwiDeep', 'grape', 'grapeDeep', 'coral', 'coralDeep', 'sky', 'sun'] },
    { title: 'Tints', names: ['kiwiTint', 'grapeTint', 'coralTint', 'skyTint', 'sunTint'] },
    { title: 'Surfaces', names: ['background', 'surface', 'surfaceSunken', 'surfaceInverse'] },
    { title: 'Ink', names: ['ink', 'inkMuted', 'inkFaint', 'inkInverse'] },
    { title: 'Lines', names: ['hairline', 'hairlineStrong'] },
    { title: 'Ring tracks', names: ['trackKiwi', 'trackGrape', 'trackCoral'] },
    {
      title: 'Ring arcs',
      names: [
        'ringPromiseFrom',
        'ringPromiseTo',
        'ringGoalFrom',
        'ringGoalTo',
        'ringCircleFrom',
        'ringCircleTo',
      ],
    },
  ]

  return (
    <main id="main" className={`shell ${styles.page}`}>
      <header className={styles.head}>
        <p className="eyebrow">Phase 1</p>
        <h1 className={styles.title}>Foundation</h1>
        <p className="lede">
          Generated from <code>mobile/constants/theme.ts</code>. If the app&rsquo;s palette moves, this page
          moves with it on the next build.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.title} className={styles.section}>
          <h2 className={styles.sectionTitle}>{group.title}</h2>
          <ul className={styles.swatches}>
            {group.names.map((name) => (
              <li key={name} className={styles.swatch}>
                <span
                  className={styles.chip}
                  style={{ background: `var(--${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()})` }}
                />
                <span className={styles.swatchName}>{name}</span>
                <span className={`${styles.swatchHex} numeric`}>{lightColors[name]}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Editorial scale</h2>
        <p className={styles.note}>
          Site-only, fluid. The app&rsquo;s own scale stops at 40px because it was drawn for a phone.
        </p>
        <p className={styles.d1}>
          Promises <em className="serif">compound.</em>
        </p>
        <p className={styles.d2}>
          Your circle sees the <em className="serif">ring.</em>
        </p>
        <p className={styles.d3}>Twelve awards. None of them for being rich.</p>
        <p className="lede">
          Lede size. Inter, muted ink, capped at 34 characters so the eye does not have to travel.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>App scale</h2>
        <p className={styles.note}>Straight from the generated tokens — used for anything card-shaped.</p>
        <ul className={styles.typeList}>
          {(['title', 'heading', 'subheading', 'stat', 'body', 'label', 'caption', 'eyebrow'] as const).map(
            (name) => (
              <li
                key={name}
                style={{
                  fontFamily: name === 'body' ? 'var(--font-inter)' : 'var(--font-sora)',
                  fontSize: `var(--text-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}-size)`,
                  lineHeight: `var(--text-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}-height)`,
                }}
              >
                {name} — Forty-nine kept
              </li>
            ),
          )}
        </ul>
      </section>

      <MotionCheck />
    </main>
  )
}
