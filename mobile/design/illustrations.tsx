/**
 * KEPT illustration — flat 2D vector scenes.
 *
 * No outlines, rounded geometry, brand palette plus a small set of skin tones. Characters
 * are stylised: a head, a torso, limbs with round caps, and only the facial detail needed
 * to read as friendly. Everything is composed from the `Person` builder below so the cast
 * stays consistent between scenes — the thing that usually gives away assembled clip art.
 *
 * Scenes appear only where there is nothing else to show: empty states, onboarding and the
 * invite flow. An illustration is never decoration beside content that already works.
 */

import { ReactNode } from 'react'
import { View } from 'react-native'
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg'
import { useAppTheme } from '@/components/theme-provider'

/** Skin tones, warm to deep. */
const SKIN = ['#F6D2B0', '#E3B08A', '#B9764A', '#8A5230'] as const
const HAIR = ['#211A13', '#3D2A1B', '#6B4226', '#0B0F0A'] as const

type HairStyle = 'afro' | 'bun' | 'crop' | 'long' | 'curls'
type ArmPose = 'down' | 'up' | 'out' | 'wave' | 'offer'

type PersonProps = {
  x: number
  y: number
  scale?: number
  flip?: boolean
  skin?: number
  hair?: number
  hairStyle?: HairStyle
  top: string
  bottom: string
  shoes?: string
  arms?: ArmPose
}

/**
 * Feet sit at the local origin and the figure builds upward, so a scene positions people
 * by standing them on a ground line rather than guessing at bounding boxes.
 */
function Person({
  x,
  y,
  scale = 1,
  flip = false,
  skin = 0,
  hair = 0,
  hairStyle = 'crop',
  top,
  bottom,
  shoes = '#2B3320',
  arms = 'down',
}: PersonProps) {
  const tone = SKIN[skin % SKIN.length]
  const hairColor = HAIR[hair % HAIR.length]

  const armPaths: Record<ArmPose, [string, string]> = {
    down: ['M-14 -55 -20 -34', 'M14 -55 20 -34'],
    up: ['M-14 -55 -25 -74', 'M14 -55 25 -74'],
    out: ['M-14 -53 -31 -53', 'M14 -53 31 -53'],
    wave: ['M-14 -55 -20 -34', 'M14 -55 26 -70'],
    offer: ['M-14 -55 -19 -38', 'M14 -55 23 -47'],
  }
  const [leftArm, rightArm] = armPaths[arms]

  return (
    <G transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {/* legs */}
      <Path d="M-7 -8 -7 -30" stroke={bottom} strokeWidth={11} strokeLinecap="round" />
      <Path d="M7 -8 7 -30" stroke={bottom} strokeWidth={11} strokeLinecap="round" />
      <Ellipse cx={-8} cy={-4} rx={7.5} ry={4.5} fill={shoes} />
      <Ellipse cx={8} cy={-4} rx={7.5} ry={4.5} fill={shoes} />

      {/* arms behind the torso so shoulders stay clean */}
      <Path d={leftArm} stroke={tone} strokeWidth={9} strokeLinecap="round" />
      <Path d={rightArm} stroke={tone} strokeWidth={9} strokeLinecap="round" />

      {/* torso */}
      <Rect x={-16} y={-62} width={32} height={40} rx={15} fill={top} />

      {/* head */}
      {hairStyle === 'afro' && <Circle cx={0} cy={-79} r={17} fill={hairColor} />}
      {hairStyle === 'curls' && (
        <G fill={hairColor}>
          <Circle cx={-11} cy={-83} r={7} />
          <Circle cx={0} cy={-88} r={7.5} />
          <Circle cx={11} cy={-83} r={7} />
          <Circle cx={-13} cy={-74} r={6} />
          <Circle cx={13} cy={-74} r={6} />
        </G>
      )}
      {hairStyle === 'long' && <Rect x={-14} y={-88} width={28} height={34} rx={13} fill={hairColor} />}
      <Circle cx={0} cy={-75} r={13} fill={tone} />
      {hairStyle === 'crop' && <Path d="M-13 -76a13 13 0 0 1 26 0c-4-4-8-5-13-5s-9 1-13 5Z" fill={hairColor} />}
      {hairStyle === 'bun' && (
        <>
          <Path d="M-13 -76a13 13 0 0 1 26 0c-4-4-8-5-13-5s-9 1-13 5Z" fill={hairColor} />
          <Circle cx={0} cy={-91} r={6.5} fill={hairColor} />
        </>
      )}

      {/* face */}
      <Circle cx={-4.5} cy={-76} r={1.7} fill="#1A1A12" />
      <Circle cx={4.5} cy={-76} r={1.7} fill="#1A1A12" />
      <Path d="M-3.5 -70.5a4 4 0 0 0 7 0" stroke="#1A1A12" strokeWidth={1.6} strokeLinecap="round" fill="none" />
    </G>
  )
}

function Heart({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return (
    <Path
      d={`M${x} ${y + s * 0.42}C${x - s * 1.05} ${y - s * 0.3} ${x - s * 0.62} ${y - s * 1.05} ${x} ${y - s * 0.42}C${x + s * 0.62} ${y - s * 1.05} ${x + s * 1.05} ${y - s * 0.3} ${x} ${y + s * 0.42}Z`}
      fill={color}
    />
  )
}

function Sparkle({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return (
    <Path
      d={`M${x} ${y - r}c0 ${r * 0.62} ${r * 0.38} ${r} ${r} ${r}c${-r * 0.62} 0 ${-r} ${r * 0.38} ${-r} ${r}c0 ${-r * 0.62} ${-r * 0.38} ${-r} ${-r} ${-r}c${r * 0.62} 0 ${r} ${-r * 0.38} ${r} ${-r}Z`}
      fill={color}
    />
  )
}

export type SceneName = 'together' | 'invite' | 'firstStep' | 'cheer' | 'shelf' | 'quiet'

/**
 * Scenes are drawn in a 320×220 frame and scale to whatever width they are given.
 */
export function Illustration({ name, width = 280, label }: { name: SceneName; width?: number; label?: string }) {
  const { colors } = useAppTheme()
  const height = (width / 320) * 220

  const ground = colors.kiwiTint
  const scenes: Record<SceneName, ReactNode> = {
    /* Two people standing together — the circle, before anyone joins. */
    together: (
      <>
        <Ellipse cx={160} cy={188} rx={124} ry={22} fill={ground} />
        <Circle cx={58} cy={52} r={16} fill={colors.sunTint} />
        <Sparkle x={272} y={48} r={13} color={colors.kiwi} />
        <Person x={124} y={186} skin={0} hair={3} hairStyle="bun" top={colors.grape} bottom="#2E3A4A" arms="offer" />
        <Person
          x={196}
          y={186}
          skin={2}
          hair={0}
          hairStyle="afro"
          top={colors.kiwi}
          bottom="#38414F"
          arms="offer"
          flip
        />
        <Heart x={160} y={86} s={17} color={colors.coral} />
      </>
    ),

    /* Handing over an invite link. */
    invite: (
      <>
        <Ellipse cx={160} cy={190} rx={112} ry={20} fill={ground} />
        <Sparkle x={66} y={58} r={12} color={colors.sun} />
        <Sparkle x={258} y={92} r={9} color={colors.coral} />
        <Person x={128} y={188} skin={1} hair={2} hairStyle="curls" top={colors.coral} bottom="#333B48" arms="offer" />
        <G transform="translate(196 92) rotate(-8)">
          <Rect x={-42} y={-28} width={84} height={58} rx={12} fill={colors.surface} />
          <Rect x={-42} y={-28} width={84} height={58} rx={12} fill={colors.grapeTint} />
          <Path d="M-42 -20 0 8 42 -20" stroke={colors.grape} strokeWidth={5} strokeLinejoin="round" fill="none" />
          <Rect x={-42} y={-28} width={84} height={58} rx={12} stroke={colors.grape} strokeWidth={5} fill="none" />
        </G>
        <Circle cx={244} cy={150} r={9} fill={colors.kiwi} />
      </>
    ),

    /* Climbing the first step — week one. */
    firstStep: (
      <>
        <Rect x={44} y={156} width={66} height={34} rx={12} fill={colors.grapeTint} />
        <Rect x={116} y={124} width={66} height={66} rx={12} fill={colors.skyTint} />
        <Rect x={188} y={86} width={66} height={104} rx={12} fill={colors.kiwiTint} />
        <Person x={149} y={124} skin={3} hair={0} hairStyle="crop" top={colors.kiwi} bottom="#2E3A4A" arms="up" />
        <Sparkle x={236} y={56} r={14} color={colors.sun} />
        <Circle cx={72} cy={68} r={10} fill={colors.coralTint} />
      </>
    ),

    /* A promise kept — confetti. */
    cheer: (
      <>
        <Ellipse cx={160} cy={190} rx={106} ry={20} fill={ground} />
        <Person x={160} y={188} skin={1} hair={1} hairStyle="afro" top={colors.kiwi} bottom="#2E3A4A" arms="up" />
        <Rect x={68} y={54} width={9} height={22} rx={4.5} fill={colors.coral} transform="rotate(-24 72 65)" />
        <Rect x={238} y={62} width={9} height={22} rx={4.5} fill={colors.grape} transform="rotate(28 242 73)" />
        <Rect x={104} y={30} width={9} height={18} rx={4.5} fill={colors.sky} transform="rotate(14 108 39)" />
        <Rect x={206} y={28} width={9} height={18} rx={4.5} fill={colors.sun} transform="rotate(-18 210 37)" />
        <Circle cx={54} cy={112} r={6} fill={colors.sun} />
        <Circle cx={266} cy={126} r={7} fill={colors.kiwi} />
        <Sparkle x={160} y={36} r={15} color={colors.sun} />
      </>
    ),

    /* The deliberately small shelf. */
    shelf: (
      <>
        <Rect x={46} y={150} width={228} height={12} rx={6} fill={colors.hairlineStrong} />
        <Rect x={62} y={96} width={62} height={54} rx={14} fill={colors.kiwiTint} />
        <Rect x={134} y={76} width={62} height={74} rx={14} fill={colors.grapeTint} />
        <Rect x={206} y={110} width={62} height={40} rx={14} fill={colors.coralTint} />
        <Circle cx={93} cy={123} r={13} fill={colors.kiwi} />
        <Path d="M152 130V104" stroke={colors.grape} strokeWidth={7} strokeLinecap="round" />
        <Path d="M166 130v-38" stroke={colors.grape} strokeWidth={7} strokeLinecap="round" />
        <Path d="M180 130v-18" stroke={colors.grape} strokeWidth={7} strokeLinecap="round" />
        <Circle cx={237} cy={130} r={11} fill={colors.coral} />
        <Sparkle x={272} y={62} r={11} color={colors.kiwi} />
      </>
    ),

    /* Nothing here yet — a plant on a quiet ledge. */
    quiet: (
      <>
        <Ellipse cx={160} cy={182} rx={92} ry={18} fill={ground} />
        <Path d="M132 176h56l-7 -44h-42Z" fill={colors.coral} />
        <Rect x={124} y={124} width={72} height={16} rx={8} fill={colors.coralDeep} />
        <Path d="M160 124V78" stroke={colors.kiwiDeep} strokeWidth={7} strokeLinecap="round" />
        <Path d="M160 100c-22 0-32-10-32-31 21 0 32 10 32 31Z" fill={colors.kiwi} />
        <Path d="M160 92c0-19 9-28 28-28 0 19-9 28-28 28Z" fill={colors.kiwiDeep} />
        <Sparkle x={228} y={64} r={11} color={colors.sun} />
        <Circle cx={92} cy={86} r={8} fill={colors.skyTint} />
      </>
    ),
  }

  // The accessibility props live on a wrapping View: react-native-svg forwards unknown
  // props straight to the DOM element on web, and `accessible` is not a valid attribute there.
  return (
    <View accessibilityRole="image" accessibilityLabel={label} accessible={Boolean(label)}>
      <Svg width={width} height={height} viewBox="0 0 320 220">
        {scenes[name]}
      </Svg>
    </View>
  )
}
