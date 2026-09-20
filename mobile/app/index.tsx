import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAppTheme } from '@/components/theme-provider'
import { isOnboardingComplete } from '@/features/onboarding/onboarding-state'

export default function HomeScreen() {
  const { colors } = useAppTheme()
  const [complete, setComplete] = useState<boolean | null>(null)

  useEffect(() => {
    isOnboardingComplete()
      .then(setComplete)
      .catch(() => setComplete(false))
  }, [])

  if (complete === null) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.kiwiDeep} />
      </View>
    )
  }

  return <Redirect href={complete ? '/(tabs)' : '/onboarding'} />
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
