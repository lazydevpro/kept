'use client'

import { DOWNLOAD_URL } from '@/lib/site'
import { openContact } from './contact'

/**
 * The page's one real call to action: get the app.
 *
 * Fourteen screens of scroll sold something there was no way to get — the hero's buttons
 * led to the manifesto and to the source code. While the dApp Store listing is pending,
 * `DOWNLOAD_URL` is null and this asks for early access through the contact form, prefilled
 * so it is one tap to send. The day the listing is live, setting that one constant turns
 * every instance into a download link.
 */
export function GetApp({ className, label }: { className?: string; label?: string }) {
  if (DOWNLOAD_URL) {
    return (
      <a className={className} href={DOWNLOAD_URL}>
        {label ?? 'Get KEPT'}
      </a>
    )
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => openContact('I’d like early access to KEPT when it is on the Solana dApp Store.')}
    >
      {label ?? 'Get early access'}
    </button>
  )
}
