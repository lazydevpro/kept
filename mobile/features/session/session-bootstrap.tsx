import { usePathname } from 'expo-router'
import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { authClient } from '@/lib/auth-client'
import { space } from '@/constants/theme'
import { useAppTheme } from '@/components/theme-provider'
import { Button, T } from '@/components/ui'
import { Object3D } from '@/design/objects'

export function SessionBootstrap({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const canPreviewWithoutSession = pathname === '/' || pathname === '/onboarding'
  const { data: session, isPending } = authClient.useSession()
  const attempted = useRef(false)
  const [signInPending, setSignInPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = useCallback(async () => {
    if (signInPending) return
    setSignInPending(true)
    setError(null)
    try {
      const result = await authClient.signIn.anonymous()
      if (result.error) throw new Error(result.error.message ?? 'Could not create a private session.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create a private session.')
    } finally {
      setSignInPending(false)
    }
  }, [signInPending])

  useEffect(() => {
    // Re-armed whenever a session exists, so signing out or deleting the account
    // is followed by a fresh anonymous one rather than the "couldn't start"
    // screen. A failed attempt stays disarmed until "Try again", so an outage
    // cannot turn this into a loop.
    if (session) {
      attempted.current = false
      return
    }
    if (isPending || attempted.current) return
    attempted.current = true
    void signIn()
  }, [isPending, session, signIn])

  const { colors } = useAppTheme()

  if ((isPending || signInPending) && !canPreviewWithoutSession) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.kiwiDeep} size="large" />
        <T role="caption" center color={colors.inkFaint}>
          Securing your private progress…
        </T>
      </View>
    )
  }

  if (!session && !canPreviewWithoutSession) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Object3D name="locked" size={88} />
        <T role="title" center>
          Couldn’t start KEPT
        </T>
        <T role="body" center>
          {error ?? 'Check your connection and try again.'}
        </T>
        <Button label="Try again" onPress={() => void signIn()} style={styles.retry} />
      </View>
    )
  }

  return children
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[4], padding: space[8] },
  retry: { minWidth: 180, marginTop: space[2] },
})
