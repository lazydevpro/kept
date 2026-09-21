import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular'
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium'
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold'
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold'
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium'
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono/600SemiBold'
import { Sora_500Medium } from '@expo-google-fonts/sora/500Medium'
import { Sora_600SemiBold } from '@expo-google-fonts/sora/600SemiBold'
import { Sora_700Bold } from '@expo-google-fonts/sora/700Bold'
import { Sora_800ExtraBold } from '@expo-google-fonts/sora/800ExtraBold'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import 'react-native-reanimated'
import { AppProviders } from '@/components/app-providers'
import { useAppTheme } from '@/components/theme-provider'
import { AnimatedSplash } from '@/features/splash/animated-splash'

// Hold the native splash until the fonts are in. Without this it hides on the first frame,
// which is the frame this layout renders nothing on — so the opening was a cream field, a
// blank white gap, then the app.
SplashScreen.preventAutoHideAsync().catch(() => undefined)

export default function RootLayout() {
  const [introPlayed, setIntroPlayed] = useState(false)
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  })

  // Handing the native splash over only once this tree has painted is what keeps the seam
  // invisible: the overlay is already on screen, in the same cream, before the splash goes.
  const handOver = useCallback(() => {
    SplashScreen.hideAsync().catch(() => undefined)
  }, [])

  if (!fontsLoaded) return null

  return (
    <AppProviders>
      <RootNavigation />
      {introPlayed ? null : (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none" onLayout={handOver}>
          <AnimatedSplash onFinish={() => setIntroPlayed(true)} />
        </View>
      )}
    </AppProviders>
  )
}

function RootNavigation() {
  const { colors, mode } = useAppTheme()
  return (
    <>
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="awards" options={{ headerShown: false }} />
        <Stack.Screen name="portfolio" options={{ headerShown: false }} />
        <Stack.Screen name="markets" options={{ headerShown: false }} />
        <Stack.Screen name="asset/[mint]" options={{ headerShown: false }} />
        <Stack.Screen name="join/[token]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </>
  )
}
