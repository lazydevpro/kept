import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Card, Chip, IconButton, Row, Screen, SectionHeader, T } from '@/components/ui'
import { space } from '@/constants/theme'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { Object3D } from '@/design/objects'
import {
  AWARDS,
  isEarned,
  nextAward,
  useAwards,
  type Award,
  type AwardCounters,
  type AwardMetric,
} from '@/features/awards/awards-api'

/**
 * Grouped so the collection reads as four things you can be good at rather than
 * one long ladder. A single flat grid made the six week-badges look like the
 * whole game, which is exactly the impression the new awards exist to correct.
 */
const GROUPS: { metric: AwardMetric; title: string; caption: string }[] = [
  { metric: 'weekStreak', title: 'Showing up', caption: 'Weeks kept in a row' },
  { metric: 'perfectMonths', title: 'Whole months', caption: 'A month with nothing missed' },
  { metric: 'friends', title: 'Together', caption: 'People keeping it with you' },
  { metric: 'nudgesSent', title: 'Encouragement', caption: 'Nudges you sent a friend' },
]

export default function AwardsScreen() {
  const { colors } = useAppTheme()
  const styles = useStyles()
  const router = useRouter()
  const awards = useAwards()
  const counters = awards.data?.counters

  const earned = AWARDS.filter((award) => isEarned(award, counters))
  const latest = earned[earned.length - 1]
  const next = nextAward(counters)

  return (
    <Screen>
      <Row style={styles.header}>
        <IconButton name="chevronLeft" label="Back" onPress={() => router.back()} />
        <View style={styles.headerCopy}>
          <T role="eyebrow" color={colors.inkFaint}>
            Progress only
          </T>
          <T role="title">Awards</T>
        </View>
      </Row>

      {/* ── The one you are wearing, or the one you are closest to. ── */}
      <Card tone="sun" style={styles.featured}>
        <Object3D name={latest?.object ?? next?.award.object ?? 'target'} size={84} />
        <View style={styles.featuredCopy}>
          {/* Not "latest": nothing records when an award was earned, and with
              four metrics the last one in the list is not the newest either. */}
          <T role="eyebrow" color={colors.sunDeep}>
            {latest ? 'Earned' : 'Closest award'}
          </T>
          <T role="title" color={colors.ink}>
            {latest?.title ?? next?.award.title ?? 'First promise'}
          </T>
          <T role="bodySmall" color={colors.sunDeep}>
            {latest ? latest.unit(latest.threshold) : next ? `${next.left} to go` : 'Every award earned'}
          </T>
        </View>
      </Card>

      {/* Once something is earned, the next one along is the useful thing to
          show — otherwise the header is a trophy you are already holding. */}
      {latest && next ? (
        <Card flat style={styles.nextUp}>
          <Object3D name={next.award.object} size={40} />
          <View style={styles.featuredCopy}>
            <T role="label">Next: {next.award.title}</T>
            <T role="caption" color={colors.inkFaint}>
              {next.left} more · {next.award.unit(next.award.threshold)}
            </T>
          </View>
        </Card>
      ) : null}

      <Row style={styles.collectionHeader}>
        <T role="heading">Collection</T>
        <T role="label" color={colors.inkFaint}>
          {earned.length} of {AWARDS.length}
        </T>
      </Row>

      {GROUPS.map((group) => (
        <View key={group.metric} style={styles.group}>
          <SectionHeader
            title={group.title}
            action={
              <T role="caption" color={colors.inkFaint}>
                {counters?.[group.metric] ?? 0}
              </T>
            }
          />
          <T role="caption" color={colors.inkFaint}>
            {group.caption}
          </T>
          <View style={styles.grid}>
            {AWARDS.filter((award) => award.metric === group.metric).map((award) => (
              <AwardCard key={award.id} award={award} counters={counters} />
            ))}
          </View>
        </View>
      ))}

      <T role="caption" center color={colors.inkFaint}>
        Awards celebrate showing up and who you show up with — never portfolio size.
      </T>
    </Screen>
  )
}

function AwardCard({ award, counters }: { award: Award; counters: AwardCounters | undefined }) {
  const { colors } = useAppTheme()
  const styles = useStyles()
  const unlocked = isEarned(award, counters)
  return (
    // Locked cards stay crisp — only the object dims. Fading the whole card made a
    // fresh account look like a disabled screen.
    <Card style={styles.award}>
      <Object3D name={award.object} size={72} style={!unlocked && styles.lockedObject} />
      <View style={styles.awardCopy}>
        <T role="label" center color={unlocked ? colors.ink : colors.inkMuted}>
          {award.title}
        </T>
        <T role="caption" color={colors.inkFaint} center>
          {award.unit(award.threshold)}
        </T>
      </View>
      {unlocked ? <Chip label="Earned" tone="kiwi" /> : <Chip label="Locked" icon="lock" tone="neutral" />}
    </Card>
  )
}

const useStyles = makeThemedStyles(() =>
  StyleSheet.create({
    header: { minHeight: 56 },
    headerCopy: { flex: 1, gap: space[1] },
    featured: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
    featuredCopy: { flex: 1, gap: space[1] },
    nextUp: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
    collectionHeader: { justifyContent: 'space-between' },
    group: { gap: space[2] },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3], marginTop: space[1] },
    award: { width: '47.6%', flexGrow: 1, alignItems: 'center', gap: space[3], paddingVertical: space[5] },
    lockedObject: { opacity: 0.32 },
    awardCopy: { gap: 2 },
  }),
)
