import { Platform } from 'react-native'

// Solana's native client stack needs QuickCrypto on Android/iOS. The browser
// already provides Web Crypto, and loading the native module there crashes the
// Expo Web preview before React can mount.
if (Platform.OS !== 'web') {
  const { install } = require('react-native-quick-crypto')
  install()
}
