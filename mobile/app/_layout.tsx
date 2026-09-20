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
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { AppProviders } from '@/components/app-providers'
import { useAppTheme } from '@/components/theme-provider'

export default function RootLayout() {
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

  if (!fontsLoaded) return null

  return (
    <AppProviders>
      <RootNavigation />
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
        <Stack.Screen name="join/[token]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </>
  )
}
