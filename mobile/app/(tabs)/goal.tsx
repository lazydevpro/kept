import { StyleSheet, View } from 'react-native'
import { AppHeader } from '@/components/app-header'
import { Button, Card, Chip, Row, Screen, SectionHeader, T } from '@/components/ui'
import { radii, space } from '@/constants/theme'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { Icon, IconPlate } from '@/design/icons'
import { Object3D } from '@/design/objects'
import { ConsistencyStrip } from '@/features/progress/consistency-strip'
import { useCreateStarterGoal, useGoals } from '@/features/social/social-api'
import { useWidgetSnapshot } from '@/features/widget/widget-sync'

export default function GoalScreen() {
  const { colors } = useAppTheme()
  const styles = useStyles()
  const goals = useGoals()
  const createGoal = useCreateStarterGoal()
  const widget = useWidgetSnapshot()

  const goal = goals.data?.goals[0]
  const target = Math.max(1, Number(goal?.target_value ?? 12))
  const kept = Number(goal?.promises_kept ?? 0)
  const percent = Math.min(100, Math.round((kept / target) * 100))
  const remaining = Math.max(0, target - kept)
  const summary = widget.data?.snapshot.summary

  const milestones = Array.from(new Set([1, Math.min(4, target), Math.min(8, target), target]))
    .sort((a, b) => a - b)
    .map((week) => ({
      week,
      title: week === target ? 'Goal reached' : week === 1 ? 'First promise' : `${week}-week rhythm`,
      done: kept >= week,
    }))

  return (
    <Screen>
      <AppHeader eyebrow="Personal goal" title={goal?.title ?? 'Build my reserve'} />

      {/* ── One number, one bar. ── */}
      <Card style={styles.hero}>
        <Row style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <T role="display" color={colors.grape}>
              {percent}%
            </T>
            <T role="body">
              {kept} of {target} weeks kept
            </T>
          </View>
          <Object3D name="target" size={72} />
        </Row>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(percent, 2)}%` }]} />
        </View>

        <Row style={styles.heroFoot}>
          <Chip label={kept > 0 ? 'In motion' : 'Ready to start'} tone={kept > 0 ? 'kiwi' : 'neutral'} />
          <T role="caption" color={colors.inkFaint}>
            {remaining === 0 ? 'Complete' : `${remaining} to go`}
          </T>
        </Row>

        {!goal ? (
          <Button
            label={createGoal.isPending ? 'Starting…' : 'Start a 12-week goal'}
            onPress={() => createGoal.mutate()}
            disabled={createGoal.isPending}
          />
        ) : null}
      </Card>

      {/* ── The path. ── */}
      <View style={styles.section}>
        <SectionHeader title="Milestones" />
        <Card style={styles.milestones}>
          {milestones.map((milestone, index) => (
            <View key={milestone.week} style={styles.milestone}>
              <View style={styles.rail}>
                <View style={[styles.node, milestone.done && styles.nodeDone]}>
                  {milestone.done ? (
                    <Icon name="check" size={14} color={colors.ink} />
                  ) : (
                    <T role="caption" color={colors.inkFaint}>
                      {index + 1}
                    </T>
                  )}
                </View>
                {index < milestones.length - 1 ? (
                  <View style={[styles.line, milestone.done && styles.lineDone]} />
                ) : null}
              </View>
              <View style={styles.milestoneCopy}>
                <T role="label" color={milestone.done ? colors.ink : colors.inkMuted}>
                  {milestone.title}
                </T>
                <T role="caption" color={colors.inkFaint}>
                  {milestone.done
                    ? 'Done'
                    : `${milestone.week - kept} promise${milestone.week - kept === 1 ? '' : 's'} away`}
                </T>
              </View>
            </View>
          ))}
        </Card>
      </View>

      {/* ── Showing up. ── */}
      <View style={styles.section}>
        <SectionHeader
          title="Showing up"
          action={
            <T role="label" color={colors.kiwiDeep}>
              {summary?.consistency.streak ?? 0} weeks
            </T>
          }
        />
        <Card>
          <ConsistencyStrip weeks={summary?.consistency.weeks} />
        </Card>
      </View>

      <Card tone="grape" style={styles.privacy}>
        <IconPlate name="eyeOff" tone="grape" style={{ backgroundColor: colors.surface }} />
        <View style={styles.privacyCopy}>
          <T role="label" color={colors.ink}>
            Progress only
          </T>
          <T role="caption" color={colors.grape}>
            Friends see percentages. Never amounts or holdings.
          </T>
        </View>
      </Card>
    </Screen>
  )
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    hero: { gap: space[4] },
    heroTop: { justifyContent: 'space-between' },
    heroCopy: { flex: 1, gap: space[1] },
    track: { height: 14, borderRadius: radii.pill, backgroundColor: colors.trackGrape, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.grape },
    heroFoot: { justifyContent: 'space-between' },
    section: { gap: space[3] },
    milestones: { paddingVertical: space[5] },
    milestone: { minHeight: 64, flexDirection: 'row', gap: space[4] },
    rail: { width: 30, alignItems: 'center' },
    node: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSunken,
    },
    nodeDone: { backgroundColor: colors.kiwi },
    line: { width: 2, flex: 1, borderRadius: 1, backgroundColor: colors.hairline },
    lineDone: { backgroundColor: colors.kiwi },
    milestoneCopy: { flex: 1, gap: 2, paddingTop: space[1] },
    privacy: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
    privacyCopy: { flex: 1, gap: 2 },
  }),
)
