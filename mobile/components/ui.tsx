/**
 * KEPT UI primitives.
 *
 * Deliberately few: a screen, a card, a button, a chip, a row and a sheet. Every screen is
 * built from these, which is what keeps the rhythm consistent — the previous version
 * re-declared a 44pt circular icon button in six different files with four different
 * background colours.
 */

import { ComponentProps, PropsWithChildren, ReactNode, useRef } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { elevation, motion, radii, space, type } from '@/constants/theme'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { Icon, type IconName } from '@/design/icons'

export type Tone = 'kiwi' | 'grape' | 'coral' | 'sky' | 'sun' | 'neutral'

export function useTone(tone: Tone) {
  const { colors } = useAppTheme()
  return {
    kiwi: { fg: colors.kiwiDeep, bg: colors.kiwiTint, solid: colors.kiwi },
    grape: { fg: colors.grape, bg: colors.grapeTint, solid: colors.grape },
    coral: { fg: colors.coralDeep, bg: colors.coralTint, solid: colors.coral },
    sky: { fg: colors.skyDeep, bg: colors.skyTint, solid: colors.sky },
    sun: { fg: colors.sunDeep, bg: colors.sunTint, solid: colors.sun },
    neutral: { fg: colors.inkMuted, bg: colors.surfaceSunken, solid: colors.inkMuted },
  }[tone]
}

/* ── layout ───────────────────────────────────────────────── */

export function Screen({
  children,
  gap = space[5],
  /** Called once per approach to the bottom — for endless lists. */
  onEndReached,
  endReachedThreshold = 600,
}: PropsWithChildren<{ gap?: number; onEndReached?: () => void; endReachedThreshold?: number }>) {
  const styles = useStyles()
  const armed = useRef(true)

  const handleScroll = onEndReached
    ? ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = nativeEvent
        const remaining = contentSize.height - contentOffset.y - layoutMeasurement.height
        // Re-arm only after scrolling back up, so one approach fires once even
        // though scroll events keep streaming while more content loads in.
        if (remaining < endReachedThreshold) {
          if (armed.current) {
            armed.current = false
            onEndReached()
          }
        } else {
          armed.current = true
        }
      }
    : undefined

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.screen, { gap }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={handleScroll}
        scrollEventThrottle={64}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

export function Card({
  children,
  style,
  tone,
  flat = false,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; tone?: Tone; flat?: boolean }>) {
  const styles = useStyles()
  const toned = useTone(tone ?? 'neutral')
  return (
    <View style={[styles.card, flat && styles.cardFlat, tone ? { backgroundColor: toned.bg } : null, style]}>
      {children}
    </View>
  )
}

/** A card that is also a target. Keeps press feedback identical everywhere. */
export function PressableCard({
  children,
  onPress,
  style,
  tone,
  accessibilityLabel,
  disabled,
}: PropsWithChildren<{
  onPress: () => void
  style?: StyleProp<ViewStyle>
  tone?: Tone
  accessibilityLabel?: string
  disabled?: boolean
}>) {
  const styles = useStyles()
  const toned = useTone(tone ?? 'neutral')
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        tone ? { backgroundColor: toned.bg } : null,
        style,
        pressed && !disabled && motion.pressed,
        disabled && styles.disabled,
      ]}
    >
      {children}
    </Pressable>
  )
}

export function Row({
  children,
  gap = space[3],
  style,
  accessibilityRole,
}: PropsWithChildren<{
  gap?: number
  style?: StyleProp<ViewStyle>
  accessibilityRole?: ComponentProps<typeof View>['accessibilityRole']
}>) {
  return (
    <View accessibilityRole={accessibilityRole} style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>
      {children}
    </View>
  )
}

export function Spacer({ size = space[4] }: { size?: number }) {
  return <View style={{ height: size }} />
}

/* ── text ─────────────────────────────────────────────────── */

type TextRole = keyof typeof type

export function T({
  children,
  role = 'body',
  color,
  center,
  style,
  numberOfLines,
}: PropsWithChildren<{
  role?: TextRole
  color?: string
  center?: boolean
  style?: StyleProp<TextStyle>
  numberOfLines?: number
}>) {
  const { colors } = useAppTheme()
  const tone = color ?? (role === 'body' || role === 'bodySmall' || role === 'caption' ? colors.inkMuted : colors.ink)
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        type[role],
        { color: tone },
        role === 'eyebrow' && { textTransform: 'uppercase' as const },
        center && { textAlign: 'center' as const },
        style,
      ]}
    >
      {children}
    </Text>
  )
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  const styles = useStyles()
  return (
    <View style={styles.sectionHeader}>
      <T role="heading">{title}</T>
      {action}
    </View>
  )
}

/* ── controls ─────────────────────────────────────────────── */

export function Button({
  label,
  onPress,
  icon,
  iconSide = 'auto',
  variant = 'primary',
  tone = 'kiwi',
  disabled = false,
  accessibilityHint,
  style,
}: {
  label: string
  onPress: () => void
  icon?: IconName
  /** `auto` trails forward arrows and leads everything else. */
  iconSide?: 'auto' | 'leading' | 'trailing'
  variant?: 'primary' | 'secondary' | 'ghost'
  tone?: Tone
  disabled?: boolean
  accessibilityHint?: string
  style?: StyleProp<ViewStyle>
}) {
  const { colors } = useAppTheme()
  const styles = useStyles()
  const toned = useTone(tone)

  const background =
    variant === 'primary' ? toned.solid : variant === 'secondary' ? colors.surfaceSunken : 'transparent'
  const foreground =
    variant === 'primary'
      ? tone === 'grape'
        ? colors.inkInverse
        : colors.ink
      : variant === 'secondary'
        ? colors.ink
        : colors.inkMuted

  const trailing =
    iconSide === 'trailing' || (iconSide === 'auto' && (icon === 'arrowRight' || icon === 'arrowUpRight'))
  const glyph = icon ? <Icon name={icon} size={19} color={foreground} /> : null

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background },
        variant === 'ghost' && styles.buttonGhost,
        style,
        pressed && !disabled && motion.pressed,
        disabled && styles.disabled,
      ]}
    >
      {trailing ? null : glyph}
      <Text style={[type.label, styles.buttonLabel, { color: foreground }]}>{label}</Text>
      {trailing ? glyph : null}
    </Pressable>
  )
}

/** The one circular icon button in the app. */
export function IconButton({
  name,
  onPress,
  label,
  tone = 'neutral',
  size = 44,
  /**
   * `surface` is white and belongs on the page background; `sunken` is grey and belongs
   * inside a white card, where a white button would be invisible.
   */
  on = 'background',
  disabled,
}: {
  name: IconName
  onPress: () => void
  label: string
  tone?: Tone
  size?: number
  on?: 'background' | 'card' | 'none'
  disabled?: boolean
}) {
  const styles = useStyles()
  const { colors } = useAppTheme()
  const toned = useTone(tone)
  const neutralBackground = on === 'none' ? 'transparent' : on === 'card' ? colors.surfaceSunken : colors.surface
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tone === 'neutral' ? neutralBackground : toned.bg,
        },
        pressed && !disabled && motion.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon name={name} size={size * 0.46} color={tone === 'neutral' ? colors.ink : toned.fg} />
    </Pressable>
  )
}

export function Chip({
  label,
  tone = 'neutral',
  icon,
  iconSide = 'auto',
  selected,
  onPress,
}: {
  label: string
  tone?: Tone
  icon?: IconName
  /** `auto` trails forward arrows and leads everything else, as Button does. */
  iconSide?: 'auto' | 'leading' | 'trailing'
  selected?: boolean
  onPress?: () => void
}) {
  const { colors } = useAppTheme()
  const styles = useStyles()
  const toned = useTone(tone)
  const background = selected ? toned.solid : toned.bg
  const foreground = selected ? (tone === 'grape' || tone === 'coral' ? colors.inkInverse : colors.ink) : toned.fg

  const trailing =
    iconSide === 'trailing' ||
    (iconSide === 'auto' && (icon === 'arrowRight' || icon === 'chevronRight' || icon === 'arrowUpRight'))
  const glyph = icon ? <Icon name={icon} size={14} color={foreground} /> : null

  const body = (
    <>
      {trailing ? null : glyph}
      <Text style={[type.caption, styles.chipLabel, { color: foreground }]}>{label}</Text>
      {trailing ? glyph : null}
    </>
  )

  if (!onPress) return <View style={[styles.chip, { backgroundColor: background }]}>{body}</View>
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { backgroundColor: background }, pressed && motion.pressed]}
    >
      {body}
    </Pressable>
  )
}

/** A label above a number. The number is the headline; the label is the caption. */
export function Stat({
  label,
  value,
  tone = 'neutral',
  role = 'statSmall',
}: {
  label: string
  value: string
  tone?: Tone
  role?: 'stat' | 'statSmall'
}) {
  const { colors } = useAppTheme()
  const toned = useTone(tone)
  return (
    <View style={{ gap: space[1] }}>
      <T role="caption" color={colors.inkFaint}>
        {label}
      </T>
      <T role={role} color={tone === 'neutral' ? colors.ink : toned.fg}>
        {value}
      </T>
    </View>
  )
}

/** A list row inside a card: plate, copy, trailing. */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  last = false,
}: {
  leading?: ReactNode
  title: string
  subtitle?: string
  trailing?: ReactNode
  onPress?: () => void
  last?: boolean
}) {
  const styles = useStyles()
  const { colors } = useAppTheme()
  const body = (
    <>
      {leading}
      <View style={styles.rowCopy}>
        <T role="label" color={colors.ink}>
          {title}
        </T>
        {subtitle ? (
          <T role="caption" color={colors.inkFaint}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Icon name="chevronRight" size={18} color={colors.inkFaint} /> : null)}
    </>
  )

  if (!onPress) return <View style={[styles.row, last && styles.rowLast]}>{body}</View>
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && motion.pressed]}
    >
      {body}
    </Pressable>
  )
}

/* ── sheet ────────────────────────────────────────────────── */

export function Sheet({
  visible,
  onClose,
  title,
  eyebrow,
  leading,
  footer,
  children,
}: PropsWithChildren<{
  visible: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  /** Sits left of the title — an asset logo, usually. */
  leading?: ReactNode
  /** Pinned below the scroll area, so a primary action is never scrolled away. */
  footer?: ReactNode
}>) {
  const styles = useStyles()
  const { colors } = useAppTheme()
  const { height } = useWindowDimensions()

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetFill}
      >
        <Pressable accessibilityLabel="Dismiss" style={styles.scrim} onPress={onClose} />
        {/* Capped and scrollable: the buy ticket is much taller than the
            confirmations this started out holding, and on a short screen with
            the keyboard up it would otherwise run off the bottom. */}
        <View style={[styles.sheet, { maxHeight: height * 0.9 }]}>
          <View style={styles.grabber} />
          <View style={styles.sheetHeader}>
            {leading}
            <View style={styles.sheetTitle}>
              {eyebrow ? (
                <T role="eyebrow" color={colors.inkFaint}>
                  {eyebrow}
                </T>
              ) : null}
              <T role="title">{title}</T>
            </View>
            <IconButton name="close" label="Close" onPress={onClose} tone="neutral" on="card" />
          </View>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetBody}
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.sheetFooter}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    screen: { paddingHorizontal: space[5], paddingTop: space[2], paddingBottom: 132 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: space[5],
      ...elevation.card,
      shadowColor: colors.shadow,
    },
    cardFlat: { shadowOpacity: 0, elevation: 0, backgroundColor: colors.surfaceSunken },
    disabled: { opacity: 0.4 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] },
    button: {
      minHeight: 54,
      borderRadius: radii.pill,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space[2],
      paddingHorizontal: space[6],
    },
    buttonGhost: { minHeight: 44, paddingHorizontal: space[3] },
    buttonLabel: { fontSize: 15 },
    chip: {
      minHeight: 30,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[1],
      paddingHorizontal: space[3],
      borderRadius: radii.pill,
    },
    chipLabel: { fontSize: 12 },
    row: {
      minHeight: 60,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[3],
      paddingVertical: space[2],
      borderBottomWidth: StyleSheet.hairlineWidth * 2,
      borderBottomColor: colors.hairline,
    },
    rowLast: { borderBottomWidth: 0 },
    rowCopy: { flex: 1, gap: 2 },
    sheetFill: { flex: 1 },
    scrim: { flex: 1, backgroundColor: 'rgba(11,15,10,0.5)' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      paddingHorizontal: space[5],
      paddingTop: space[3],
      gap: space[4],
    },
    sheetBody: { gap: space[5], paddingBottom: space[5] },
    sheetFooter: {
      gap: space[3],
      paddingTop: space[4],
      paddingBottom: space[8],
      borderTopWidth: StyleSheet.hairlineWidth * 2,
      borderTopColor: colors.hairline,
    },
    grabber: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.hairlineStrong,
      alignSelf: 'center',
    },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] },
    sheetTitle: { flex: 1, gap: space[1] },
  }),
)
