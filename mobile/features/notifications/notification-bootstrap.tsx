import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { apiRequest } from '@/lib/api'

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

const notificationRoutes: Record<string, '/(tabs)' | '/(tabs)/invest' | '/(tabs)/circle' | '/(tabs)/goal'> = {
  '/': '/(tabs)',
  '/invest': '/(tabs)/invest',
  '/circle': '/(tabs)/circle',
  '/goal': '/(tabs)/goal',
}

function openNotification(notification: Notifications.Notification) {
  const route = notification.request.content.data?.route
  if (typeof route === 'string' && notificationRoutes[route]) router.push(notificationRoutes[route])
}

export type PushOutcome = 'enabled' | 'denied' | 'unsupported'

/**
 * Registers for weekly reminders.
 *
 * Returns WHY it failed rather than a bare boolean. "You declined" and "this
 * build cannot do push at all" produce very different copy, and collapsing them
 * meant a misconfigured build told the user they had chosen no reminders.
 *
 * `unsupported` is usually a missing EAS project id. EAS injects it at build
 * time, but a local `expo run:android` build needs `extra.eas.projectId` in
 * app.json — run `eas init` to write it.
 */
export async function enablePushNotifications(): Promise<PushOutcome> {
  if (Platform.OS === 'web') return 'unsupported'
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) {
    console.warn('Push reminders are off: no EAS project id. Run `eas init` or set extra.eas.projectId.')
    return 'unsupported'
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('promises', {
      name: 'Weekly promises',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 80, 180],
    })
  }
  const current = await Notifications.getPermissionsAsync()
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync()
  if (!permission.granted) return 'denied'
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
  await apiRequest('/v1/me/push-tokens', {
    method: 'POST',
    body: JSON.stringify({ token, platform: Platform.OS }),
  })
  return 'enabled'
}

export function NotificationBootstrap() {
  useEffect(() => {
    if (Platform.OS === 'web') return
    const last = Notifications.getLastNotificationResponse()
    if (last?.notification) openNotification(last.notification)
    const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
      openNotification(response.notification),
    )
    return () => subscription.remove()
  }, [])
  return null
}
