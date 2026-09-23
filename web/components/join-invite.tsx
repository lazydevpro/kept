'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { API_URL, APP_SCHEME } from '@/lib/site'
import { GetApp } from './get-app'
import styles from './join-invite.module.css'

type Preview =
  | { state: 'loading' }
  | { state: 'ready'; token: string; name: string; memberCount: number }
  | { state: 'gone' }

/** `/join/<token>`, or `/join?t=<token>` for anything that strips path segments. */
function readToken() {
  const fromPath = window.location.pathname.match(/^\/join\/([^/?#]+)/)?.[1]
  return fromPath ?? new URLSearchParams(window.location.search).get('t')
}

export function JoinInvite() {
  const [preview, setPreview] = useState<Preview>({ state: 'loading' })

  useEffect(() => {
    const token = readToken()
    // The preview route is public by design: it names the circle and its size, nothing about
    // anyone in it, and only to someone holding the token.
    const lookup = token
      ? fetch(`${API_URL}/v1/invites/${encodeURIComponent(token)}`)
      : Promise.reject(new Error('no token'))
    lookup
      .then(async (response) => {
        if (!response.ok || !token) throw new Error(String(response.status))
        const { circle } = (await response.json()) as { circle: { name: string; memberCount: number } }
        setPreview({ state: 'ready', token, name: circle.name, memberCount: Number(circle.memberCount) })
      })
      .catch(() => setPreview({ state: 'gone' }))
  }, [])

  return (
    <main id="main" className={`shell ${styles.page}`}>
      <Link className={styles.back} href="/">
        KEPT
      </Link>

      {preview.state === 'loading' ? (
        <p className="lede" role="status">
          Opening your invite…
        </p>
      ) : preview.state === 'gone' ? (
        <section className={styles.card}>
          <p className="eyebrow">Invite</p>
          <h1 className={styles.title}>This invite has expired.</h1>
          <p className="lede">
            Invites last a short while and can be used a limited number of times. Ask for a new one.
          </p>
        </section>
      ) : (
        <section className={styles.card}>
          <p className="eyebrow">You’re invited</p>
          <h1 className={styles.title}>
            Join <em className="serif">{preview.name}</em>
          </h1>
          <p className="lede">
            {preview.memberCount} {preview.memberCount === 1 ? 'person keeps' : 'people keep'} a weekly
            investing promise here. They see that you kept yours — never how much.
          </p>
          <div className={styles.actions}>
            <a className={styles.primary} href={`${APP_SCHEME}://join/${preview.token}`}>
              Open in KEPT
            </a>
            <GetApp className={styles.secondary} label="I don’t have KEPT yet" />
          </div>
        </section>
      )}
    </main>
  )
}
