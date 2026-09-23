import { Alert, Platform } from 'react-native'

/**
 * Ask a yes/no question and wait for the answer.
 *
 * `Alert.alert` with buttons is a no-op in react-native-web, so on the web build
 * every destructive action behind one would silently never happen. The browser's
 * own `confirm` is the honest fallback there.
 */
export function confirmAsync({
  title,
  message,
  confirmLabel,
  destructive = false,
}: {
  title: string
  message: string
  confirmLabel: string
  destructive?: boolean
}): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? false)
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    )
  })
}
