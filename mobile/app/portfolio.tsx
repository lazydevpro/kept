/**
 * The owner's portfolio — the one screen in the app that shows money rather than
 * progress, and the only place P&L exists.
 *
 * It stays private on purpose: nothing here is shared with a circle, and the
 * backend never exposes these numbers to anyone but their owner. That is why the
 * privacy note at the foot is not decoration — it is the promise the rest of the
 * product makes, restated at the one place it could plausibly be broken.
 *
 * Every value except cost basis can be null (no live prices on devnet, or a price
 * outage). Null renders as an honest absence, never as zero or a dash that looks
 * like a loss.
 */

import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Button, Card, Chip, IconButton, Row, Screen, SectionHeader, T } from '@/components/ui'
import { space } from '@/constants/theme'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { IconPlate } from '@/design/icons'
import { Illustration } from '@/design/illustrations'
import { Object3D } from '@/design/objects'
import { AssetLogo } from '@/features/trade/asset-logo'
import { SellSheet } from '@/features/trade/sell-sheet'
import { type Position, quantity, signedPct, signedUsd, usd, usePortfolio } from '@/features/portfolio/portfolio-api'

export default function PortfolioScreen() {
  const { colors } = useAppTheme()
  const styles = useStyles()
  const router = useRouter()
  const portfolio = usePortfolio()
  const [selling, setSelling] = useState<Position | null>(null)

  const data = portfolio.data?.portfolio
  const totals = data?.totals
  const positions = data?.positions ?? []
  const gain = totals?.pnlUsd ?? null
  const gainColour = gain === null ? colors.inkMuted : gain >= 0 ? colors.kiwiDeep : colors.coralDeep

  return (
    <Screen>
      <Row style={styles.header}>
        <IconButton name="chevronLeft" label="Back" onPress={() => router.back()} />
        <View style={styles.headerCopy}>
          <T role="eyebrow" color={colors.inkFaint}>
            Private to you
          </T>
          <T role="title">Portfolio</T>
        </View>
      </Row>

      {portfolio.isPending ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.kiwiDeep} />
        </View>
      ) : positions.length === 0 ? (
        <Empty rehearsals={data?.rehearsals.lots ?? 0} />
      ) : (
        <>
          {/* ── What it's worth, or what went in when we can't know. ── */}
          <Card style={styles.hero}>
            <Row style={styles.heroTop}>
              <View style={styles.heroCopy}>
                <T role="caption" color={colors.inkFaint}>
                  {totals?.valueUsd === null ? 'Invested' : 'Value today'}
                </T>
                <T role="display">{usd(totals?.valueUsd ?? totals?.costUsd ?? 0)}</T>
              </View>
              <Object3D name="chartUp" size={64} />
            </Row>

            {totals?.valueUsd === null ? (
              <T role="bodySmall">
                {data?.cluster === 'mainnet-beta'
                  ? 'Live prices are unavailable right now, so this is what you put in.'
                  : 'Devnet has no real prices. This is what you put in.'}
              </T>
            ) : (
              <Row style={styles.heroFoot}>
                <T role="statSmall" color={gainColour}>
                  {signedUsd(gain ?? 0)}
                </T>
                <Chip label={signedPct(totals?.pnlPct ?? 0)} tone={(gain ?? 0) >= 0 ? 'kiwi' : 'coral'} />
                <T role="caption" color={colors.inkFaint} style={styles.heroCost}>
                  on {usd(totals?.costUsd ?? 0)}
                </T>
              </Row>
            )}
          </Card>

          {/* ── Each thing you own. ── */}
          <View style={styles.section}>
            <SectionHeader
              title="Holdings"
              action={
                <T role="label" color={colors.inkFaint}>
                  {positions.length}
                </T>
              }
            />
            <View style={styles.positions}>
              {positions.map((position) => (
                <PositionCard key={position.mint} position={position} onSell={() => setSelling(position)} />
              ))}
            </View>
          </View>
        </>
      )}

      {data && data.rehearsals.lots > 0 && positions.length > 0 ? (
        <Card flat style={styles.rehearsal}>
          <IconPlate name="play" tone="neutral" size={40} />
          <View style={styles.rehearsalCopy}>
            <T role="label">
              {data.rehearsals.lots} devnet {data.rehearsals.lots === 1 ? 'rehearsal' : 'rehearsals'}
            </T>
            <T role="caption" color={colors.inkFaint}>
              No money moved and no asset was received, so they are not counted above.
            </T>
          </View>
        </Card>
      ) : null}

      <Card tone="grape" style={styles.privacy}>
        <IconPlate name="eyeOff" tone="grape" style={{ backgroundColor: colors.surface }} />
        <View style={styles.privacyCopy}>
          <T role="label" color={colors.ink}>
            Only you see this
          </T>
          <T role="caption" color={colors.grape}>
            Your circle sees weeks kept. Never amounts, holdings or performance.
          </T>
        </View>
      </Card>

      <SellSheet position={selling} onClose={() => setSelling(null)} />
    </Screen>
  )
}

function PositionCard({ position, onSell }: { position: Position; onSell: () => void }) {
  const { colors } = useAppTheme()
  const styles = useStyles()
  const gain = position.pnlUsd
  const gainColour = gain === null ? colors.inkMuted : gain >= 0 ? colors.kiwiDeep : colors.coralDeep

  return (
    <Card style={styles.position}>
      <Row style={styles.positionTop}>
        <AssetLogo asset={position} size={46} letters={1} role="subheading" background={colors.kiwiTint} />
        {/* Quantity and average cost are stacked rather than joined by a middot:
            on one line the longer of the two wrapped, leaving the cards uneven. */}
        <View style={styles.positionCopy}>
          <T role="label">{position.symbol}</T>
          <T role="caption" color={colors.inkFaint}>
            {position.quantity === null
              ? `${position.lots} ${position.lots === 1 ? 'purchase' : 'purchases'}`
              : `${quantity(position.quantity)} units`}
          </T>
          {position.avgCostUsd !== null ? (
            <T role="caption" color={colors.inkFaint}>
              avg {usd(position.avgCostUsd)}
            </T>
          ) : null}
        </View>
        <View style={styles.positionValue}>
          <T role="statSmall">{usd(position.valueUsd ?? position.costUsd)}</T>
          {position.pnlPct !== null ? (
            <T role="caption" color={gainColour}>
              {signedPct(position.pnlPct)}
            </T>
          ) : (
            <T role="caption" color={colors.inkFaint}>
              invested
            </T>
          )}
        </View>
      </Row>

      {/*
        Realised P&L only appears once something has actually been sold. Showing a
        "$0.00 realised" line on every untouched position would imply a loss.
      */}
      {position.sells > 0 ? (
        <Row style={styles.realised}>
          <T role="caption" color={colors.inkFaint}>
            Sold {position.soldQuantity === null ? '' : `${quantity(position.soldQuantity)} · `}
            realised
          </T>
          <T role="caption" color={position.realisedUsd >= 0 ? colors.kiwiDeep : colors.coralDeep}>
            {signedUsd(position.realisedUsd)}
          </T>
        </Row>
      ) : null}

      {/*
        Selling is deliberately quiet: a secondary button under the numbers, never
        a primary action competing with the week's promise. The product is about
        putting money in — getting it out has to be possible, not encouraged.
      */}
      {position.open ? <Button label="Sell" variant="secondary" tone="neutral" onPress={onSell} /> : null}
    </Card>
  )
}

function Empty({ rehearsals }: { rehearsals: number }) {
  const { colors } = useAppTheme()
  const styles = useStyles()
  return (
    <Card style={styles.empty}>
      <Illustration name="shelf" width={244} label="An empty shelf" />
      <T role="heading" center>
        Nothing here yet
      </T>
      <T role="body" center>
        {rehearsals > 0
          ? 'Your devnet rehearsals do not buy anything real. Holdings appear after a live purchase settles.'
          : 'Your first kept week will show up here once it settles on-chain.'}
      </T>
      {rehearsals > 0 ? <Chip label={`${rehearsals} rehearsed`} tone="neutral" /> : null}
      <T role="caption" center color={colors.inkFaint}>
        Verified on-chain before it counts.
      </T>
    </Card>
  )
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    header: { minHeight: 56 },
    headerCopy: { flex: 1, gap: space[1] },
    loading: { paddingVertical: space[12], alignItems: 'center' },

    hero: { gap: space[4] },
    heroTop: { justifyContent: 'space-between' },
    heroCopy: { flex: 1, gap: space[1] },
    heroFoot: { alignItems: 'center', gap: space[2] },
    heroCost: { flex: 1 },

    section: { gap: space[3] },
    positions: { gap: space[2] },
    realised: { justifyContent: 'space-between' },
    position: { paddingVertical: space[4] },
    positionTop: { gap: space[3] },
    positionCopy: { flex: 1, gap: 2 },
    positionValue: { alignItems: 'flex-end', gap: 2 },

    empty: { alignItems: 'center', gap: space[3], paddingVertical: space[6] },

    rehearsal: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
    rehearsalCopy: { flex: 1, gap: 2 },

    privacy: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
    privacyCopy: { flex: 1, gap: 2 },
  }),
)
