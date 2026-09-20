import AsyncStorage from '@react-native-async-storage/async-storage'
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import { darkColors, lightColors, type ThemeColors, type ThemeMode } from '@/constants/theme'

type ThemePreference = ThemeMode | 'system'

type ThemeContextValue = {
  colors: ThemeColors
  mode: ThemeMode
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'kept:theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme()
  // KEPT is a light-first brand, so a first run lands on light regardless of the OS.
  // The toggle in the header switches it and the choice persists from then on.
  const [preference, setPreferenceState] = useState<ThemePreference>('light')
  const systemMode: ThemeMode = systemScheme === 'light' ? 'light' : 'dark'
  const mode = preference === 'system' ? systemMode : preference
  const colors = mode === 'light' ? lightColors : darkColors

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') setPreferenceState(saved)
      })
      .catch(() => undefined)
  }, [])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined)
  }, [])

  const toggleTheme = useCallback(() => setPreference(mode === 'dark' ? 'light' : 'dark'), [mode, setPreference])

  const value = useMemo(
    () => ({ colors, mode, preference, setPreference, toggleTheme }),
    [colors, mode, preference, setPreference, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAppTheme() {
  const theme = useContext(ThemeContext)
  if (!theme) throw new Error('useAppTheme must be used inside ThemeProvider')
  return theme
}

export function makeThemedStyles<T>(factory: (colors: ThemeColors) => T) {
  const styles = { dark: factory(darkColors), light: factory(lightColors) }
  return function useThemedStyles() {
    return styles[useAppTheme().mode]
  }
}
