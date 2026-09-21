import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { AppHeader } from '@/components/app-header'
import { Button, Card, IconButton, PressableCard, Row, Screen, SectionHeader, Stat, T } from '@/components/ui'
import { radii, space } from '@/constants/theme'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { Icon } from '@/design/icons'
import { Object3D } from '@/design/objects'
import { ConsistencyStrip } from '@/features/progress/consistency-strip'
import { Rings } from '@/features/progress/rings'
import { useRingReveal } from '@/features/progress/use-ring-reveal'
import { useMe } from '@/features/social/social-api'
import { WeekShareCard, useWeekShare } from '@/features/share/week-share-card'
import { useWidgetSnapshot } from '@/features/widget/widget-sync'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Eight bars of recent weekly contributions. No axis, no labels — it is a texture. Each bar
 * keeps a visible track so an empty month reads as "nothing yet" rather than as a broken chart.
 */
function Sparkbars({ values, muted = false }: { values: number[]; muted?: boolean }) {
  const styles = useStyles()
  const bars = values.length ? values.slice(-8) : Array(8).fill(0)
  const peak = Math.max(1, ...bars)
  return (
    <View style={styles.bars}>
      {bars.map((value, index) => (
        <View key={index} style={styles.barTrack}>
          <View
            style={[styles.barFill, muted && styles.barFillMuted, { height: `${Math.max((value / peak) * 100, 10)}%` }]}
          />
        </View>
      ))}
    </View>
  )
}

export default function WeekScreen() {
  const { colors } = useAppTheme()
  const styles = useStyles()
  const router = useRouter()
  const me = useMe()
  const widget = useWidgetSnapshot()

  const snapshot = widget.data?.snapshot
  const summary = snapshot?.summary
  const targets = {
    promise: snapshot?.rings.consistency ?? 0,
    goal: snapshot?.rings.goal ?? 0,
    circle: snapshot?.rings.circle ?? 0,
  }
  const rings = useRingReveal(targets)

  const streak = summary?.consistency.streak ?? 0
  const kept = targets.promise >= 1
  const members = summary?.circle.members ?? 0
  const showedUp = summary?.circle.showedUp ?? 0
  const awardWeeks = summary?.awardWeeks ?? 0
  const firstName = me.data?.profile.displayName.split(' ')[0]

  // Devnet rehearsals spend nothing, so they are never added to real money. When
  // there is no live spend but there are rehearsals — the normal state on devnet —
  // the tile shows the rehearsed figure and says so, rather than a bare $0.
  const liveUsd = summary?.contributions.monthUsd ?? 0
  const rehearsedUsd = summary?.contributions.rehearsedMonthUsd ?? 0
  const rehearsing = liveUsd === 0 && rehearsedUsd > 0
  const monthUsd = rehearsing ? rehearsedUsd : liveUsd
  const monthBars = rehearsing
    ? (summary?.contributions.rehearsedRecentUsd ?? [])
    : (summary?.contributions.recentUsd ?? [])

  // The card is captured from a fixed off-screen layout rather than from the hero below,
  // so what gets posted is the same on every phone. `targets` rather than `rings`: the
  // reveal animation is mid-flight on first paint and would export half-drawn arcs.
  const shareData = { rings: targets, streak, goalWeeks: summary?.goal.target ?? 12 }
  const { cardRef, share, sharing } = useWeekShare(shareData)

  return (
    <Screen>
      <AppHeader
        eyebrow={new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(
          new Date(),
        )}
        title="This week"
      />

      {/* ── The rings. Everything else on this screen is a footnote to them. ── */}
      <Card style={styles.hero}>
        <Row style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <T role="subheading">{firstName ? `${greeting()}, ${firstName}` : greeting()}</T>
            <T role="caption" color={colors.inkFaint}>
              {kept ? 'This week is already kept' : 'One promise left to keep'}
            </T>
          </View>
          <IconButton name="share" label="Share this progress" onPress={share} disabled={sharing} on="card" />
        </Row>

        <View style={styles.ringStage}>
          <Rings size={236} {...rings} label={`Promise, goal and circle progress. ${streak} week streak.`}>
            <T role="stat" center>
              {streak}
            </T>
            <T role="caption" color={colors.inkFaint} center>
              {streak === 1 ? 'week' : 'weeks'}
            </T>
          </Rings>
        </View>

        <Row style={styles.legend} gap={space[2]}>
          <LegendItem color={colors.kiwi} label="Promise" value={kept ? 'Kept' : 'Open'} />
          <LegendItem color={colors.grape} label="Goal" value={`${Math.round(targets.goal * 100)}%`} />
          <LegendItem color={colors.coral} label="Circle" value={members ? `${showedUp}/${members}` : '—'} />
        </Row>
      </Card>

      {/* ── The one action. ── */}
      {kept ? (
        <Card tone="kiwi" style={styles.promise}>
          <Object3D name="check" size={52} />
          <View style={styles.promiseCopy}>
            <T role="subheading" color={colors.ink}>
              Promise kept
            </T>
            <T role="caption" color={colors.kiwiDeep}>
              {summary?.latest ? `${summary.latest.symbol} · amount private` : 'Amount private'}
            </T>
          </View>
        </Card>
      ) : (
        <PressableCard
          tone="kiwi"
          accessibilityLabel="Keep this week's promise"
          onPress={() => router.push('/(tabs)/invest')}
          style={styles.promise}
        >
          <Object3D name="seedling" size={52} />
          <View style={styles.promiseCopy}>
            <T role="subheading" color={colors.ink}>
              Keep this week
            </T>
            <T role="caption" color={colors.kiwiDeep}>
              Takes about a minute
            </T>
          </View>
          <View style={styles.promiseGo}>
            <Icon name="arrowRight" size={20} color={colors.ink} />
          </View>
        </PressableCard>
      )}

      {/* ── Showing up. ── */}
      <View style={styles.section}>
        <SectionHeader
          title="Showing up"
          action={
            <T role="label" color={colors.kiwiDeep}>
              {summary?.consistency.kept ?? 0}/{summary?.consistency.total ?? 12}
            </T>
          }
        />
        <Card>
          <ConsistencyStrip weeks={summary?.consistency.weeks} />
        </Card>
      </View>

      {/* ── Two tiles: what went in, what it earned. ── */}
      <Row style={styles.tiles} gap={space[3]}>
        {/* "Where did it go?" is the natural next question, so the money tile is
            the way into the portfolio rather than a fifth tab. */}
        <PressableCard
          accessibilityLabel="View your portfolio"
          onPress={() => router.push('/portfolio')}
          style={styles.tile}
        >
          <Stat
            label={rehearsing ? 'Rehearsed this month' : 'Put in this month'}
            value={`$${monthUsd}`}
            tone={rehearsing ? 'neutral' : 'kiwi'}
            role="stat"
          />
          <Sparkbars values={monthBars} muted={rehearsing} />
          <Row gap={space[1]}>
            <T role="caption" color={colors.inkFaint}>
              Portfolio
            </T>
            <Icon name="chevronRight" size={14} color={colors.inkFaint} />
          </Row>
        </PressableCard>

        <PressableCard accessibilityLabel="View all awards" onPress={() => router.push('/awards')} style={styles.tile}>
          <View style={styles.awardArt}>
            <Object3D name={awardWeeks ? 'trophy' : 'target'} size={64} />
          </View>
          <View style={styles.awardCopy}>
            <T role="label">{awardWeeks ? `Steady ${awardWeeks}` : 'First award'}</T>
            <T role="caption" color={colors.inkFaint}>
              {awardWeeks ? 'Latest award' : 'Keep one week'}
            </T>
          </View>
        </PressableCard>
      </Row>

      {/* ── The circle, as a nudge rather than a feed. ── */}
      <PressableCard
        accessibilityLabel="Open your circle"
        onPress={() => router.push('/(tabs)/circle')}
        style={styles.circleRow}
      >
        <Object3D name="handshake" size={44} />
        <View style={styles.promiseCopy}>
          <T role="label">{members ? `${showedUp} of ${members} kept it` : 'Start your circle'}</T>
          <T role="caption" color={colors.inkFaint}>
            {members ? 'Progress only — never amounts' : 'Better with one other person'}
          </T>
        </View>
        <Icon name="chevronRight" size={18} color={colors.inkFaint} />
      </PressableCard>

      {!members ? (
        <Button
          label="Invite someone"
          icon="personAdd"
          variant="secondary"
          onPress={() => router.push('/(tabs)/circle')}
        />
      ) : null}

      <WeekShareCard data={shareData} cardRef={cardRef} />
    </Screen>
  )
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  const styles = useStyles()
  const { colors } = useAppTheme()
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <T role="caption" color={colors.inkFaint}>
        {label}
      </T>
      <T role="label" color={colors.ink}>
        {value}
      </T>
    </View>
  )
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    hero: { gap: space[4], paddingBottom: space[4] },
    heroTop: { justifyContent: 'space-between' },
    heroCopy: { flex: 1, gap: 2 },
    ringStage: { alignItems: 'center', paddingVertical: space[2] },
    legend: { justifyContent: 'space-between' },
    legendItem: { flex: 1, alignItems: 'center', gap: 3 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    promise: { flexDirection: 'row', alignItems: 'center', gap: space[4], paddingVertical: space[4] },
    promiseCopy: { flex: 1, gap: 2 },
    promiseGo: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.kiwi,
    },
    section: { gap: space[3] },
    tiles: { alignItems: 'stretch' },
    tile: { flex: 1, gap: space[3], justifyContent: 'space-between', minHeight: 176 },
    bars: { height: 56, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
    barTrack: {
      flex: 1,
      height: '100%',
      justifyContent: 'flex-end',
      borderRadius: 5,
      backgroundColor: colors.surfaceSunken,
    },
    barFill: { width: '100%', borderRadius: 5, backgroundColor: colors.kiwi },
    barFillMuted: { backgroundColor: colors.hairlineStrong },
    awardArt: { alignItems: 'center', paddingTop: space[2] },
    awardCopy: { gap: 2 },
    circleRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], borderRadius: radii.xl },
  }),
)
