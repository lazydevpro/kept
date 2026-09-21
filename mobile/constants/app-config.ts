import {
  AppIdentity,
  createSolanaDevnet,
  createSolanaMainnet,
  createSolanaTestnet,
  SolanaCluster,
} from '@wallet-ui/react-native-kit'
import { Platform } from 'react-native'

export class AppConfig {
  static identity: AppIdentity = { name: 'KEPT', uri: 'https://kept.lazydevpro.workers.dev' }
  static apiUrl = process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? devApiUrl() : missingApiUrl())
  static networks: SolanaCluster[] =
    process.env.EXPO_PUBLIC_SOLANA_CLUSTER === 'mainnet-beta'
      ? [createSolanaMainnet({ url: process.env.EXPO_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com' })]
      : [
          createSolanaDevnet({ url: 'https://api.devnet.solana.com' }),
          createSolanaTestnet({ url: 'https://api.testnet.solana.com' }),
        ]
}

function devApiUrl() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:8787'
  // On web the session cookie has to be same-site, and cookies ignore the port but not the
  // host — so the API must share the page's hostname. Pointing web at 127.0.0.1 while the
  // dev server serves localhost makes every authenticated request anonymous.
  if (Platform.OS === 'web') return `http://${globalThis.location?.hostname ?? 'localhost'}:8787`
  return 'http://127.0.0.1:8787'
}

function missingApiUrl(): never {
  throw new Error('EXPO_PUBLIC_API_URL is required for release builds.')
}
