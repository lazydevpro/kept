import Image from 'next/image'
import styles from './site-footer.module.css'

/**
 * The close. Oversized wordmark, the pinky-promise mark it is named after, and the two links
 * a reader actually wants at this point — the code, and what it is built on.
 *
 * Dark, because the page has been cream for eight sections and the end should feel like one.
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`shell ${styles.inner}`}>
        <div className={styles.top}>
          <Image
            src="/brand/promise.svg"
            alt=""
            width={120}
            height={80}
            className={styles.mark}
            aria-hidden="true"
          />
          <p className={styles.tagline}>
            Promises <em className="serif">compound.</em>
          </p>
          <p className={styles.sub}>Invest a little every week, with people who notice.</p>
        </div>

        <div className={styles.meta}>
          <nav className={styles.links} aria-label="Footer">
            <a href="https://github.com/lazydevpro/kept">Source</a>
            <a href="#how">How it works</a>
            <a href="#main">Back to top</a>
          </nav>
          <p className={styles.built}>
            Built for Solana Mobile. Expo and Mobile Wallet Adapter on the phone, Cloudflare Workers and D1
            behind it, xStocks and Tessera on the shelf.
          </p>
        </div>

        <p className={styles.wordmark} aria-hidden="true">
          KEPT
        </p>
      </div>
    </footer>
  )
}
