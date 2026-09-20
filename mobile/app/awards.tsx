import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Card, Chip, IconButton, Row, Screen, T } from '@/components/ui'
import { space } from '@/constants/theme'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { Object3D, type ObjectName } from '@/design/objects'
import { useWidgetSnapshot } from '@/features/widget/widget-sync'

const AWARDS: { weeks: number; title: string; object: ObjectName }[] = [
  { weeks: 1, title: 'First promise', object: 'seedling' },
  { weeks: 4, title: 'First month', object: 'plant' },
  { weeks: 8, title: 'Steady eight', object: 'fire' },
  { weeks: 12, title: 'Quarter rhythm', object: 'chartUp' },
  { weeks: 26, title: 'Half a year', object: 'star' },
  { weeks: 52, title: 'A full year', object: 'trophy' },
]

export default function AwardsScreen() {
  const { colors } = useAppTheme()
  const styles = useStyles()
  const router = useRouter()
  const widget = useWidgetSnapshot()
  const streak = widget.data?.snapshot.summary?.consistency.streak ?? 0

  const unlocked = AWARDS.filter((award) => streak >= award.weeks)
  const latest = unlocked[unlocked.length - 1]
  const next = AWARDS.find((award) => streak < award.weeks)

  return (
    <Screen>
      <Row style={styles.header}>
        <IconButton name="chevronLeft" label="Back" onPress={() => router.back()} />
        <View style={styles.headerCopy}>
          <T role="eyebrow" color={colors.inkFaint}>
            Consistency only
          </T>
          <T role="title">Awards</T>
        </View>
      </Row>

      {/* ── The one you are wearing, or the one you are walking toward. ── */}
      <Card tone="sun" style={styles.featured}>
        <Object3D name={latest?.object ?? next?.object ?? 'target'} size={84} />
        <View style={styles.featuredCopy}>
          <T role="eyebrow" color={colors.sunDeep}>
            {latest ? 'Latest award' : 'Next award'}
          </T>
          <T role="title" color={colors.ink}>
            {latest?.title ?? next?.title ?? 'First promise'}
          </T>
          <T role="bodySmall" color={colors.sunDeep}>
            {latest
              ? `${latest.weeks} week${latest.weeks === 1 ? '' : 's'} in a row`
              : `${(next?.weeks ?? 1) - streak} to go`}
          </T>
        </View>
      </Card>

      <Row style={styles.collectionHeader}>
        <T role="heading">Collection</T>
        <T role="label" color={colors.inkFaint}>
          {unlocked.length} of {AWARDS.length}
        </T>
      </Row>

      <View style={styles.grid}>
        {AWARDS.map((award) => {
          const isUnlocked = streak >= award.weeks
          return (
            // Locked cards stay crisp — only the object dims. Fading the whole card made a
            // fresh account look like a disabled screen.
            <Card key={award.weeks} style={styles.award}>
              <Object3D name={award.object} size={72} style={!isUnlocked && styles.lockedObject} />
              <View style={styles.awardCopy}>
                <T role="label" center color={isUnlocked ? colors.ink : colors.inkMuted}>
                  {award.title}
                </T>
                <T role="caption" color={colors.inkFaint} center>
                  {award.weeks} week{award.weeks === 1 ? '' : 's'}
                </T>
              </View>
              {!isUnlocked ? <Chip label="Locked" icon="lock" tone="neutral" /> : <Chip label="Earned" tone="kiwi" />}
            </Card>
          )
        })}
      </View>

      <T role="caption" center color={colors.inkFaint}>
        Awards celebrate showing up — never portfolio size.
      </T>
    </Screen>
  )
}

const useStyles = makeThemedStyles(() =>
  StyleSheet.create({
    header: { minHeight: 56 },
    headerCopy: { flex: 1, gap: space[1] },
    featured: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
    featuredCopy: { flex: 1, gap: space[1] },
    collectionHeader: { justifyContent: 'space-between' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
    award: { width: '47.6%', flexGrow: 1, alignItems: 'center', gap: space[3], paddingVertical: space[5] },
    lockedObject: { opacity: 0.32 },
    awardCopy: { gap: 2 },
  }),
)
