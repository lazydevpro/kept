/**
 * Connect a wallet, then prove it belongs to this account.
 *
 * Two steps that read as one: Mobile Wallet Adapter hands back an address, and a
 * signed challenge proves whoever is holding the app holds its key. The Invest
 * screen displays that state, the purchase sheet requires it, and both need the
 * same transition — so it lives here rather than being written twice.
 */

import { Base64 } from 'js-base64'
import { useState } from 'react'
import { Alert } from 'react-native'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { apiRequest } from '@/lib/api'
import { useMe } from '@/features/social/social-api'

export function useWalletLink() {
  const { account, connect, signMessages } = useMobileWallet()
  const me = useMe()
  const [connecting, setConnecting] = useState(false)

  /** Connected is not enough — only a verified signature counts as linked. */
  const linked = Boolean(account && me.data?.wallets?.some((wallet) => wallet.address === String(account.address)))

  const linkWallet = async () => {
    setConnecting(true)
    try {
      if (!account) {
        await connect()
        return
      }
      const challenge = await apiRequest<{ challengeId: string; message: string }>('/v1/wallets/challenge', {
        method: 'POST',
        body: JSON.stringify({ address: String(account.address) }),
      })
      const signed = await signMessages(new TextEncoder().encode(challenge.message))
      await apiRequest('/v1/wallets/verify', {
        method: 'POST',
        body: JSON.stringify({ challengeId: challenge.challengeId, signature: Base64.fromUint8Array(signed) }),
      })
      await me.refetch()
    } catch (error) {
      Alert.alert('Wallet link failed', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  return { account, linked, connecting, linkWallet }
}
