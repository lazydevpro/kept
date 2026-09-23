'use client'

import { useEffect, useId, useRef } from 'react'
import { BETA } from '@/lib/site'
import { openContact } from './contact'
import styles from './beta-download.module.css'

const OPEN_EVENT = 'kept:beta'

/** Open the beta notice from anywhere — every "get the app" button on the site does. */
export function openBetaDownload() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

/**
 * The Android beta, and what it means before anyone installs it.
 *
 * A download button alone would be the wrong kind of easy. This is a real-money app on
 * mainnet, installed from outside any store, and the reader should know all three before
 * the file lands — so the button that downloads it says "I understand", and the notice
 * above it is the thing they are understanding.
 *
 * Mounted once, in the layout, like the contact panel, and opened by event from the hero,
 * the footer and the invite page.
 */
export function BetaDownload() {
  const dialog = useRef<HTMLDialogElement>(null)
  const warning = useRef<HTMLDivElement>(null)
  const headingId = useId()

  useEffect(() => {
    // Focus lands on the warning, not the close button: a screen reader starts by reading
    // what this download means, and nobody sees a focus ring on × before they have read it.
    const onOpen = () => {
      dialog.current?.showModal()
      warning.current?.focus()
    }
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  const close = () => dialog.current?.close()

  const notifyMe = () => {
    close()
    openContact('Let me know when KEPT is on the Solana dApp Store.')
  }

  return (
    <dialog className={styles.dialog} ref={dialog} aria-labelledby={headingId}>
      <div className={styles.panel}>
        <header className={styles.head}>
          <div>
            <p className="eyebrow">
              Android beta · v{BETA.version} · {BETA.sizeMb} MB
            </p>
            <h2 id={headingId} className={styles.heading}>
              Try KEPT <em className="serif">early.</em>
            </h2>
          </div>
          <button type="button" className={styles.close} onClick={close} aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className={styles.warning} role="note" tabIndex={-1} ref={warning}>
          <p className={styles.warningTitle}>This is a beta, with real money.</p>
          <p>
            KEPT runs on Solana mainnet. Every purchase uses real USDC from your own wallet, and things may
            still break — start with a small amount. It is coming to the Solana dApp Store; until then, this APK
            is the way in.
          </p>
        </div>

        <ul className={styles.needs}>
          <li>Android {BETA.minAndroid} or newer — a Solana Seeker or any other Android phone.</li>
          <li>A Solana wallet app with Mobile Wallet Adapter: Seed Vault, Phantom or Solflare.</li>
          <li>Android will ask you to allow installs from your browser. That is expected for an APK.</li>
          <li>
            Buying is not available to U.S. persons or in restricted countries — see the{' '}
            <a href="/terms">terms</a>.
          </li>
        </ul>

        <div className={styles.actions}>
          <a className={styles.download} href={BETA.apkUrl} download onClick={close}>
            I understand — download the APK
          </a>
          <button type="button" className={styles.later} onClick={notifyMe}>
            Wait for the dApp Store — notify me
          </button>
        </div>

        <p className={styles.small}>
          On a computer? Open this page on your phone. Signed release, with checksums on{' '}
          <a href={BETA.releaseUrl}>GitHub</a>.
        </p>
      </div>
    </dialog>
  )
}
