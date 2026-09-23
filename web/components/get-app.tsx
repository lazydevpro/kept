'use client'

import { DAPP_STORE_URL } from '@/lib/site'
import { openBetaDownload } from './beta-download'

/**
 * The page's one real call to action: get the app.
 *
 * Until the Solana dApp Store listing is live, it opens the beta notice
 * (`beta-download.tsx`) — what running a mainnet beta means, then the APK. The day the
 * listing is live, setting `DAPP_STORE_URL` turns every instance into a store link.
 */
export function GetApp({ className, label }: { className?: string; label?: string }) {
  if (DAPP_STORE_URL) {
    return (
      <a className={className} href={DAPP_STORE_URL}>
        {label ?? 'Get KEPT on the dApp Store'}
      </a>
    )
  }
  return (
    <button type="button" className={className} onClick={openBetaDownload}>
      {label ?? 'Get the Android beta'}
    </button>
  )
}
