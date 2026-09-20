/**
 * The asset's own artwork, with an honest fallback.
 *
 * Both providers ship a logo and the API has always returned it — the app just
 * drew initials over the top of it. xStocks serves a full-bleed 400px PNG per
 * token (its own brand colour, edge to edge), so these render without an inset.
 * Tessera serves SVG, which `<Image>` cannot decode on native, so that path goes
 * through `SvgUri` instead.
 *
 * Anything missing or broken falls back to the initials plate rather than a
 * blank square, which keeps a row legible when a logo 404s.
 */

import { useState } from 'react'
import { Image, View } from 'react-native'
import { SvgUri } from 'react-native-svg'
import { T } from '@/components/ui'
import { radii, type } from '@/constants/theme'
import { useAppTheme } from '@/components/theme-provider'
import type { InvestableAsset } from './trade-api'

/** Shared by the image and the fallback so a logo never changes a row's metrics. */
const frame = {
  borderRadius: radii.plate,
  overflow: 'hidden' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
}

export function AssetLogo({
  asset,
  size = 42,
  letters = 2,
  background,
  foreground,
  role = 'label',
}: {
  asset: Pick<InvestableAsset, 'logo' | 'symbol'>
  size?: number
  /** How many initials the fallback plate shows. */
  letters?: number
  /** Fallback plate colours. Ignored once a logo loads — the art carries its own. */
  background?: string
  foreground?: string
  role?: keyof typeof type
}) {
  const { colors } = useAppTheme()
  // Remembering *which* URL failed, rather than a bare boolean, means a row
  // recycled onto a different asset starts out trusting its own logo again.
  const [failed, setFailed] = useState<string | null>(null)

  const uri = asset.logo?.trim() ?? ''
  const plate = [frame, { width: size, height: size, backgroundColor: background ?? colors.surfaceSunken }]

  if (!uri || failed === uri) {
    return (
      <View style={plate}>
        <T role={role} color={foreground ?? colors.ink}>
          {/* The leading "t" is Tessera's prefix, not part of the name. */}
          {asset.symbol.replace(/^t/, '').slice(0, letters).toUpperCase()}
        </T>
      </View>
    )
  }

  if (uri.toLowerCase().endsWith('.svg')) {
    return (
      <View style={plate}>
        <SvgUri uri={uri} width={size} height={size} onError={() => setFailed(uri)} />
      </View>
    )
  }

  return (
    <Image
      accessibilityIgnoresInvertColors
      source={{ uri }}
      style={plate}
      resizeMode="cover"
      onError={() => setFailed(uri)}
    />
  )
}
