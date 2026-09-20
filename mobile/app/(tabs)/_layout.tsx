import { Tabs } from 'expo-router'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { elevation, motion, radii, space, type } from '@/constants/theme'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { Icon, type IconName } from '@/design/icons'

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Week', icon: 'rings' },
  { name: 'circle', label: 'Circle', icon: 'people' },
  { name: 'goal', label: 'Goal', icon: 'flag' },
  { name: 'invest', label: 'Invest', icon: 'sprout' },
]

/**
 * A floating bar rather than an edge-to-edge one: it lets the cream background run under
 * the content and keeps the bar reading as an object you can reach, not a wall.
 */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useAppTheme()
  const styles = useStyles()
  const insets = useSafeAreaInsets()

  return (
    <View pointerEvents="box-none" style={[styles.dock, { paddingBottom: Math.max(insets.bottom, space[3]) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const tab = TABS.find((item) => item.name === route.name)
          if (!tab) return null
          const focused = state.index === index

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name)
              }}
              style={({ pressed }) => [styles.tab, pressed && motion.pressed]}
            >
              <View style={[styles.pill, focused && styles.pillActive]}>
                <Icon name={tab.icon} size={22} color={focused ? colors.ink : colors.inkFaint} />
              </View>
              <Text style={[type.caption, styles.label, { color: focused ? colors.ink : colors.inkFaint }]}>
                {tab.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export default function TabLayout() {
  const { colors } = useAppTheme()
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  )
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    dock: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space[4] },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space[2],
      paddingTop: space[2],
      paddingBottom: space[2],
      borderRadius: radii.xl,
      backgroundColor: colors.surface,
      ...elevation.lifted,
      shadowColor: colors.shadow,
    },
    tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: space[1] },
    pill: {
      minWidth: 56,
      height: 32,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillActive: { backgroundColor: colors.kiwiTint },
    label: { fontSize: 11 },
  }),
)
