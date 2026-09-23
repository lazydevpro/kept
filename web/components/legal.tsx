import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './legal.module.css'

/**
 * The frame for /terms and /privacy: a back link, a title, a date, and a readable column.
 *
 * Deliberately none of the landing page's motion or chrome. Someone reading the terms is
 * checking something, and the page should get out of the way of that.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <main id="main" className={`shell ${styles.page}`}>
      <Link className={styles.back} href="/">
        ← KEPT
      </Link>
      <header className={styles.head}>
        <p className="eyebrow">Last updated {updated}</p>
        <h1 className={styles.title}>{title}</h1>
      </header>
      <article className={styles.body}>{children}</article>
    </main>
  )
}
