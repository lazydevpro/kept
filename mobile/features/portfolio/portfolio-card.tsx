/**
 * The Invest screen's header: what the portfolio is worth, and how it has done.
 *
 * It used to be a plain "Your portfolio" row two-thirds of the way down, below the wallet
 * and above the shelves — so the one number someone opens an investing screen to see was
 * the thing they had to go looking for. This is the Binance Lite arrangement instead: the
 * value first and large, the gain beneath it in green or red, and the amount put in as a
 * smaller supporting figure.
 *
 * Every money field but cost can be null — live prices exist only on mainnet with a
 * Jupiter key — and a null is shown as unavailable, never as zero. So when there is no
 * live value the headline falls back to what was put in, and says that is what it is.
 * Devnet rehearsals move no money and are never presented as holdings.
 */

import { useRouter } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { PressableCard, Row, T } from '@/components/ui'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { space, type } from '@/constants/theme'
import { Icon } from '@/design/icons'
import { signedPct, signedUsd, usd, usePortfolio } from './portfolio-api'

export function PortfolioCard() {
  const router = useRouter()
  const { colors } = useAppTheme()
  const styles = useStyles()
  const portfolio = usePortfolio()

  const data = portfolio.data?.portfolio
  const totals = data?.totals
  const hasHoldings = (totals?.positions ?? 0) > 0
  const rehearsed = data?.rehearsals.notionalUsd ?? 0

  // The headline is the live value when there is one, and the cost basis when there is
  // not — labelled as such, so a devnet balance never reads as market value.
  const liveValue = totals?.valueUsd ?? null
  const headline = liveValue ?? totals?.costUsd ?? 0
  const headlineLabel = !hasHoldings ? 'Portfolio' : liveValue !== null ? 'Portfolio value' : 'Invested'

  const gain = totals?.pnlUsd ?? null
  const gainPct = totals?.pnlPct ?? null
  const gainColour = gain === null ? colors.inkFaint : gain >= 0 ? colors.kiwiDeep : colors.coralDeep

  const caption = () => {
    if (!hasHoldings) {
      return rehearsed > 0
        ? `${usd(rehearsed)} rehearsed on devnet — no money moved`
        : 'Your first purchase shows up here'
    }
    if (liveValue === null) return 'Live value unavailable — showing what you put in'
    return `${usd(totals?.costUsd ?? 0)} invested`
  }

  return (
    <PressableCard
      accessibilityLabel="Open your portfolio"
      onPress={() => router.push('/portfolio')}
      style={styles.card}
    >
      <Row style={styles.top}>
        <T role="eyebrow" color={colors.inkFaint}>
          {headlineLabel}
        </T>
        <Row gap={space[1]}>
          <T role="caption" color={colors.inkFaint}>
            Private to you
          </T>
          <Icon name="chevronRight" size={16} color={colors.inkFaint} />
        </Row>
      </Row>

      {portfolio.isPending ? (
        <View style={styles.pending}>
          <ActivityIndicator color={colors.inkFaint} />
        </View>
      ) : (
        <>
          <T role="display" style={styles.value}>
            {usd(headline)}
          </T>

          {/* The gain only exists when there is a live price to measure it against. */}
          {hasHoldings && gain !== null ? (
            <T role="label" color={gainColour}>
              {signedUsd(gain)}
              {gainPct !== null ? `  (${signedPct(gainPct)})` : ''}
            </T>
          ) : null}

          <T role="caption" color={colors.inkFaint}>
            {caption()}
          </T>
        </>
      )}
    </PressableCard>
  )
}

const useStyles = makeThemedStyles(() =>
  StyleSheet.create({
    card: { gap: space[2], paddingVertical: space[5] },
    top: { justifyContent: 'space-between' },
    value: { ...type.display, marginTop: space[1] },
    pending: { height: 72, alignItems: 'center', justifyContent: 'center' },
  }),
)
