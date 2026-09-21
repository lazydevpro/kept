'use client'

import { useState } from 'react'
import { Rings } from '@/components/rings'
import { Object3D } from '@/components/ui'
import styles from './widget.module.css'

/**
 * The Android home-screen widget, and the one place the dark palette earns its keep.
 *
 * The flip is not a gimmick — the widget ships `res/values/colors.xml` and
 * `res/values-night/colors.xml` with exact parity, and this is the cheapest way to show both
 * without two screenshots that drift apart. `data-theme="dark"` on the frame swaps every token
 * underneath it, because `app/tokens.css` scopes the dark palette to that attribute rather
 * than binding it to `prefers-color-scheme`.
 */
export function Widget() {
  const [dark, setDark] = useState(false)

  return (
    <section className={styles.section} aria-labelledby="widget-heading">
      <div className={`shell ${styles.grid}`}>
        <div className={styles.copy}>
          <p className="eyebrow">On your home screen</p>
          <h2 id="widget-heading">
            It asks before <em className="serif">you remember.</em>
          </h2>
          <p className="lede">
            A native Android widget, built for the Solana Seeker. Three rings, the week, and nothing that needs
            you to open an app.
          </p>

          <div className={styles.controls}>
            {/* Same pattern as the privacy toggle — see the note there for why not a switch. */}
            <div className={styles.themeSwitch} role="group" aria-label="Widget theme">
              <button
                type="button"
                className={styles.themeOption}
                aria-pressed={!dark}
                onClick={() => setDark(false)}
              >
                Light
              </button>
              <button
                type="button"
                className={styles.themeOption}
                aria-pressed={dark}
                onClick={() => setDark(true)}
              >
                Dark
              </button>
            </div>
            <span className={styles.controlNote}>Both shipped, at exact parity</span>
          </div>
        </div>

        <div className={styles.stage}>
          <div className={styles.phone} data-theme={dark ? 'dark' : undefined}>
            <div className={styles.wallpaper} aria-hidden="true">
              <span className={styles.clock}>9:41</span>
            </div>

            <div className={styles.widget}>
              <div className={styles.widgetRow}>
                <Rings size={72} detail="glyph" promise={0.72} goal={0.34} circle={0.86} label="This week" />
                <div className={styles.widgetCopy}>
                  <p className={styles.widgetTitle}>Week 38</p>
                  <p className={styles.widgetSub}>$20 due Sunday</p>
                  <p className={styles.widgetStreak}>
                    <Object3D name="fire" size={16} />
                    <span className="numeric">14</span> weeks
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.dock} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
