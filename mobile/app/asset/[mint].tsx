/**
 * One asset, full screen: what it costs, how it has moved, and a way to buy it.
 *
 * Tapping an asset used to open the buy sheet straight away, with the chart squeezed in
 * above the amount field — so looking and buying were the same step, and the chart had
 * a quarter of the screen. This is the Binance Lite arrangement instead: the price large
 * at the top, the chart taking whatever height is left, range tabs beneath it, and one
 * button at the bottom that opens the buy sheet only once someone has decided to.
 *
 * Put a finger on the chart and the headline becomes the price under it, with the change
 * measured from the start of the range. Let go and it returns to the live figure.
 *
 * The screen does not scroll. A chart you drag across inside a view that also scrolls
 * vertically is a fight over every gesture that is not perfectly horizontal.
 */

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, IconButton, Row, T } from '@/components/ui'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { radii, space } from '@/constants/theme'
import { quantity, usd, usePortfolio } from '@/features/portfolio/portfolio-api'
import { AssetLogo } from '@/features/trade/asset-logo'
import { LineChart, thin, type ChartPoint } from '@/features/trade/line-chart'
import { PurchaseSheet } from '@/features/trade/purchase-sheet'
import {
  CHART_RANGES,
  useAssetDetail,
  usePriceChart,
  type ChartRange,
  type InvestableAsset,
} from '@/features/trade/trade-api'

const RANGE_LABEL: Record<ChartRange, string> = {
  '1D': 'Past day',
  '1W': 'Past week',
  '1M': 'Past month',
  '1Y': 'Past year',
}

/** Cheap tokens need more than two places or every price reads "$0.00". */
function price(value: number) {
  const digits = value >= 1 ? 2 : value >= 0.01 ? 4 : 6
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

const pct = (value: number) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}%`

export default function AssetScreen() {
  const { mint } = useLocalSearchParams<{ mint: string }>()
  const router = useRouter()
  const { colors } = useAppTheme()
  const styles = useStyles()

  const [range, setRange] = useState<ChartRange>('1M')
  const [scrub, setScrub] = useState<ChartPoint | null>(null)
  const [buying, setBuying] = useState(false)
  const [plot, setPlot] = useState({ width: 0, height: 0 })

  const detail = useAssetDetail(mint ?? null).data?.asset ?? null
  const chart = usePriceChart(mint ?? null, range)
  const portfolio = usePortfolio()

  const points = useMemo(() => thin(chart.data?.chart.points ?? [], 140), [chart.data])
  const first = points.at(0)?.p ?? null
  const last = points.at(-1)?.p ?? null

  // The line's colour answers "how has this done over the window", so it follows the whole
  // range and does not flicker as a finger moves across it.
  const rangeUp = first === null || last === null ? true : last >= first

  const shownPrice = scrub?.p ?? detail?.priceUsd ?? last
  const shownChange = scrub && first ? ((scrub.p - first) / first) * 100 : (chart.data?.chart.changePct ?? null)
  const changeColour = shownChange === null ? colors.inkFaint : shownChange >= 0 ? colors.kiwiDeep : colors.coralDeep

  const held = portfolio.data?.portfolio.positions.find((position) => position.mint === mint)

  // The buy sheet takes the catalogue's asset shape; the detail endpoint carries everything
  // it reads, so there is no second request to make one.
  const asset: InvestableAsset | null = detail
    ? {
        mint: detail.mint,
        symbol: detail.symbol,
        name: detail.name,
        logo: detail.logo,
        description: '',
        available: detail.available,
        supportsAtomicSwaps: false,
        provider: detail.provider ?? 'xstocks',
        instrument: detail.instrument ?? 'tokenized_stock',
        transferFeeBps: detail.transferFeeBps,
        priceUsd: detail.priceUsd,
        priceChange24h: detail.change24h,
      }
    : null

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/invest'))

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <Row style={styles.header}>
        <IconButton name="chevronLeft" label="Back" onPress={goBack} />
        <View style={styles.title}>
          <T role="subheading" center numberOfLines={1}>
            {detail?.name ?? ''}
          </T>
          <T role="caption" center color={colors.inkFaint}>
            {detail?.symbol ?? ''}
          </T>
        </View>
        <View style={styles.logo}>{asset ? <AssetLogo asset={asset} size={36} /> : null}</View>
      </Row>

      <View style={styles.priceBlock}>
        {shownPrice == null ? (
          // Too thin a market for anyone to quote. A dash set in the display face rendered as
          // a heavy black bar that read as a glitch, so the absence is written out instead.
          <>
            <T role="title" color={colors.inkMuted}>
              No live price
            </T>
            <T role="caption" color={colors.inkFaint}>
              Nobody has traded this recently on Solana
            </T>
          </>
        ) : (
          <>
            <T role="display">{price(shownPrice)}</T>
            <Row gap={space[2]}>
              <T role="label" color={changeColour}>
                {shownChange === null ? '—' : pct(shownChange)}
              </T>
              <T role="caption" color={colors.inkFaint}>
                {RANGE_LABEL[range]}
              </T>
            </Row>
          </>
        )}
      </View>

      <View
        style={styles.plot}
        onLayout={(event) =>
          setPlot({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })
        }
      >
        {chart.isPending ? (
          <ActivityIndicator color={colors.inkFaint} />
        ) : points.length >= 2 && plot.width > 0 ? (
          <LineChart
            points={points}
            width={plot.width}
            height={plot.height}
            range={range}
            color={rangeUp ? colors.kiwiDeep : colors.coralDeep}
            onScrub={setScrub}
          />
        ) : (
          // Thin markets genuinely have no history — Jupiter returns an empty series — so
          // this says so rather than drawing a flat line that implies a price never moved.
          <T role="caption" color={colors.inkFaint} center>
            No price history for this one yet
          </T>
        )}
      </View>

      <Row style={styles.ranges}>
        {CHART_RANGES.map((option) => {
          const selected = option === range
          return (
            <Pressable
              // Keyed on selection so the pill is remounted, not updated: Android's renderer
              // drops the corner radius when an existing view gains a background colour, the
              // same fault that squared off the tab bar's active pill.
              key={`${option}-${selected ? 'on' : 'off'}`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={RANGE_LABEL[option]}
              onPress={() => {
                setScrub(null)
                setRange(option)
              }}
              style={[styles.range, selected && styles.rangeOn]}
            >
              <T role="label" color={selected ? colors.ink : colors.inkFaint}>
                {option}
              </T>
            </Pressable>
          )
        })}
      </Row>

      <View style={styles.bottom}>
        {held ? (
          <View style={styles.holding}>
            <T role="label">
              {held.quantity === null ? '—' : quantity(held.quantity)} {held.symbol}
            </T>
            <T role="caption" color={colors.inkFaint}>
              {held.valueUsd === null ? `${usd(held.costUsd)} invested` : `≈ ${usd(held.valueUsd)}`}
            </T>
          </View>
        ) : null}
        <Button
          label={detail && !detail.available ? 'Not available yet' : `Buy ${detail?.symbol ?? ''}`.trim()}
          onPress={() => setBuying(true)}
          disabled={!asset || !detail?.available}
          style={held ? styles.buyBeside : styles.buyFull}
        />
      </View>

      <PurchaseSheet asset={buying ? asset : null} onClose={() => setBuying(false)} />
    </SafeAreaView>
  )
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: space[4], paddingTop: space[2], gap: space[3] },
    title: { flex: 1, gap: 2 },
    logo: { width: 44, alignItems: 'center' },
    priceBlock: { paddingHorizontal: space[5], paddingTop: space[5], gap: space[1] },
    // Edge to edge: the wider the chart, the finer a finger can place the rule.
    plot: { flex: 1, marginTop: space[4], alignItems: 'center', justifyContent: 'center' },
    ranges: { paddingHorizontal: space[5], paddingVertical: space[3], justifyContent: 'space-between' },
    range: { paddingHorizontal: space[4], paddingVertical: space[2], borderRadius: radii.pill },
    rangeOn: { backgroundColor: colors.surfaceSunken },
    bottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[4],
      paddingHorizontal: space[5],
      paddingTop: space[3],
      paddingBottom: space[3],
      borderTopWidth: StyleSheet.hairlineWidth * 2,
      borderTopColor: colors.hairline,
    },
    holding: { flex: 1, gap: 2 },
    buyBeside: { minWidth: 148 },
    buyFull: { flex: 1 },
  }),
)
