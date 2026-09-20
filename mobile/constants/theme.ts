/**
 * KEPT design tokens.
 *
 * Light is the primary mode; dark is a faithful counterpart. Three brand hues carry the
 * three rings and never appear decoratively anywhere that would imply the wrong meaning:
 *   kiwi  → the promise you keep
 *   grape → progress toward your goal
 *   coral → the people in your circle
 *
 * See docs/design/kept-design-system.md.
 */

const lightPalette = {
  // Brand hues
  kiwi: '#A3E635',
  kiwiDeep: '#4D7C0F',
  kiwiTint: '#EEFBD6',
  grape: '#7C5CFF',
  grapeDeep: '#5B3FD9',
  grapeTint: '#EDE9FF',
  coral: '#FF6B4A',
  coralDeep: '#D93C1B',
  coralTint: '#FFEBE5',
  sky: '#38BDF8',
  skyDeep: '#0369A1',
  skyTint: '#E2F5FE',
  sun: '#FFD447',
  sunDeep: '#A16207',
  sunTint: '#FFF6DA',

  // Surfaces
  background: '#FBFBF4',
  surface: '#FFFFFF',
  surfaceSunken: '#F3F4EA',
  surfaceInverse: '#0B0F0A',

  // Ink
  ink: '#0B0F0A',
  inkMuted: '#5A6155',
  inkFaint: '#8A9283',
  inkInverse: '#FBFBF4',

  // Lines
  hairline: '#E8E9DE',
  hairlineStrong: '#D5D7C8',

  // Ring tracks — the ring's own hue at low luminance, never neutral grey.
  trackKiwi: '#E4F3C8',
  trackGrape: '#E5E0FB',
  trackCoral: '#FBE0D8',

  /**
   * Ring arc stops. BOTH ends are vivid — the gradient shifts brightness, it does not fade
   * up from a dark tone. A ring at 8% shows the head near `From`, so a dark `From` makes
   * every early week look muddy, which is the most common way these get this wrong.
   */
  ringPromiseFrom: '#7FC117',
  ringPromiseTo: '#C3F45E',
  ringGoalFrom: '#6A48F0',
  ringGoalTo: '#AE96FF',
  ringCircleFrom: '#F5502B',
  ringCircleTo: '#FFA07A',

  shadow: '#2A3018',
} as const

const darkPalette = {
  kiwi: '#B8F04A',
  kiwiDeep: '#D2F97F',
  kiwiTint: '#1E2A10',
  grape: '#9B7DFF',
  grapeDeep: '#BCA8FF',
  grapeTint: '#211B3A',
  coral: '#FF8566',
  coralDeep: '#FFA992',
  coralTint: '#2E1810',
  sky: '#56CCFA',
  skyDeep: '#8FDDFC',
  skyTint: '#0F2430',
  sun: '#FFDE6B',
  sunDeep: '#FFEBA0',
  sunTint: '#2B2310',

  background: '#0C0F0A',
  surface: '#161A12',
  surfaceSunken: '#10140D',
  surfaceInverse: '#FBFBF4',

  ink: '#F5F7F0',
  inkMuted: '#A3AC9A',
  inkFaint: '#6F7A66',
  inkInverse: '#0B0F0A',

  hairline: '#242A1D',
  hairlineStrong: '#333A29',

  // On a near-black card the tracks need more chroma and less red, or the three of them
  // blend into one brown target instead of reading as three coloured bands.
  trackKiwi: '#26380F',
  trackGrape: '#251B52',
  trackCoral: '#3E1A0D',

  ringPromiseFrom: '#8FD41F',
  ringPromiseTo: '#D2F97F',
  ringGoalFrom: '#7E5CFF',
  ringGoalTo: '#BCA8FF',
  ringCircleFrom: '#FF6B45',
  ringCircleTo: '#FFB496',

  shadow: '#000000',
} as const

export const lightColors = { ...lightPalette } as const
export const darkColors = { ...darkPalette } as const

export type ThemeColors = { [Key in keyof typeof lightPalette]: string }
export type ThemeMode = 'light' | 'dark'

/**
 * Sora carries every number and heading — mono numerals read as "data", and this app's
 * numbers are achievements. Inter handles body copy. Mono is for addresses and hashes only.
 */
export const fonts = {
  display: 'Sora_800ExtraBold',
  displayBold: 'Sora_700Bold',
  displaySemibold: 'Sora_600SemiBold',
  displayMedium: 'Sora_500Medium',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'JetBrainsMono_500Medium',
  monoSemibold: 'JetBrainsMono_600SemiBold',
} as const

export const type = {
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, letterSpacing: -1.2 },
  title: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.displaySemibold, fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
  subheading: { fontFamily: fonts.displaySemibold, fontSize: 16, lineHeight: 21, letterSpacing: -0.2 },
  stat: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 36, letterSpacing: -1.4 },
  statSmall: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 26, letterSpacing: -0.8 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodySmall: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17, letterSpacing: -0.1 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 13, letterSpacing: 1.2 },
  mono: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16 },
} as const

/** 4pt grid. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48 } as const

export const radii = { sm: 12, md: 18, lg: 24, xl: 32, plate: 16, pill: 999 } as const

/** Soft ambient elevation. Cards are lifted with light, never outlined. */
export const elevation = {
  card: {
    shadowColor: lightPalette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  lifted: {
    shadowColor: lightPalette.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const

export const motion = {
  state: 180,
  entrance: 320,
  spring: { stiffness: 320, damping: 26, mass: 0.8 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
} as const
