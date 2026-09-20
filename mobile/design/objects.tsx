/**
 * KEPT iconography — Level 3, the 3D objects.
 *
 * Glossy rendered objects with a soft cast shadow, from Microsoft's Fluent Emoji 3D set
 * (MIT licensed, bundled locally in assets/3d so the app works offline).
 *
 * House rule: at most one per card, and never two competing to be the same moment. They are
 * the moment, not the furniture — if you want a second one inside a card, you want a Level 2
 * plate instead (see ./icons.tsx).
 */

import { Image, type ImageStyle } from 'expo-image'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { useAppTheme } from '@/components/theme-provider'

const sources = {
  seedling: require('../assets/3d/seedling.png'),
  plant: require('../assets/3d/potted-plant.png'),
  moneyBag: require('../assets/3d/money-bag.png'),
  banknote: require('../assets/3d/banknote.png'),
  coin: require('../assets/3d/coin.png'),
  target: require('../assets/3d/target.png'),
  trophy: require('../assets/3d/trophy.png'),
  fire: require('../assets/3d/fire.png'),
  handshake: require('../assets/3d/handshake.png'),
  chartUp: require('../assets/3d/chart-up.png'),
  star: require('../assets/3d/star.png'),
  locked: require('../assets/3d/locked.png'),
  party: require('../assets/3d/party.png'),
  calendar: require('../assets/3d/calendar.png'),
  bell: require('../assets/3d/bell.png'),
  rocket: require('../assets/3d/rocket.png'),
  check: require('../assets/3d/check.png'),
  shield: require('../assets/3d/shield.png'),
  gift: require('../assets/3d/gift.png'),
  people: require('../assets/3d/people.png'),
} as const

export type ObjectName = keyof typeof sources
export const objectNames = Object.keys(sources) as ObjectName[]

export function Object3D({
  name,
  size = 64,
  label,
  style,
}: {
  name: ObjectName
  size?: number
  label?: string
  style?: StyleProp<ImageStyle>
}) {
  return (
    <Image
      accessibilityLabel={label}
      accessible={Boolean(label)}
      source={sources[name]}
      contentFit="contain"
      style={[{ width: size, height: size }, style]}
      transition={220}
    />
  )
}

/**
 * The object on a tinted disc — used when it needs to hold its own against a white card.
 * The disc is the hue's tint, so the object reads as lit from within the brand.
 */
export function Object3DSpot({
  name,
  tone = 'kiwi',
  size = 96,
  label,
  style,
}: {
  name: ObjectName
  tone?: 'kiwi' | 'grape' | 'coral' | 'sky' | 'sun' | 'neutral'
  size?: number
  label?: string
  style?: StyleProp<ViewStyle>
}) {
  const { colors } = useAppTheme()
  const bg = {
    kiwi: colors.kiwiTint,
    grape: colors.grapeTint,
    coral: colors.coralTint,
    sky: colors.skyTint,
    sun: colors.sunTint,
    neutral: colors.surfaceSunken,
  }[tone]

  return (
    <View style={[styles.spot, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, style]}>
      <Object3D name={name} size={size * 0.62} label={label} />
    </View>
  )
}

const styles = StyleSheet.create({
  spot: { alignItems: 'center', justifyContent: 'center' },
})
