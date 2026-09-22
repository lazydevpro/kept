import { useState } from 'react'
import { Alert, StyleSheet, TextInput, View } from 'react-native'
import { AppHeader } from '@/components/app-header'
import { Button, Card, Chip, IconButton, PressableCard, Row, Screen, SectionHeader, Sheet, T } from '@/components/ui'
import { radii, space, type } from '@/constants/theme'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { IconPlate } from '@/design/icons'
import { Illustration } from '@/design/illustrations'
import { RingGlyph } from '@/features/progress/rings'
import { useNudge } from '@/features/awards/awards-api'
import {
  readReactions,
  useCircle,
  useCircleFeed,
  useCircleLive,
  useCircles,
  useCreateCircle,
  useMe,
  useShareInvite,
  useToggleReaction,
  type ReactionEmoji,
} from '@/features/social/social-api'

const REACTIONS: ReactionEmoji[] = ['👏', '💜', '🔥', '🙌']
/** The feed fetches 50. More than this on one screen stops being encouragement. */
const FEED_LIMIT = 10

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function CircleScreen() {
  const { colors } = useAppTheme()
  const styles = useStyles()
  const me = useMe()
  const circles = useCircles()

  // Which circle is open is now explicit. It used to be hardcoded to the first
  // one, so a second circle could be created and then never reached again.
  const [openId, setOpenId] = useState<string | null>(null)
  const all = circles.data?.circles ?? []
  const circleId = all.some((entry) => entry.id === openId) ? (openId as string) : all[0]?.id

  const circle = useCircle(circleId)
  const feed = useCircleFeed(circleId)
  useCircleLive(circleId)
  const createCircle = useCreateCircle()
  const shareInvite = useShareInvite(circleId)
  const toggleReaction = useToggleReaction(circleId)
  const nudge = useNudge(circleId)

  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')

  const myId = me.data?.profile.id
  const members = circle.data?.members ?? []
  const showedUp = members.filter((member) => member.showedUp).length
  const circleProgress = members.length ? showedUp / members.length : 0
  const posts = (feed.data?.posts ?? []).slice(0, FEED_LIMIT)

  const nameValid = name.trim().length >= 2 && name.trim().length <= 48

  const createNamed = async () => {
    if (!nameValid) return
    try {
      const created = await createCircle.mutateAsync({ name: name.trim() })
      setOpenId(created.id)
      setNaming(false)
      setName('')
    } catch (error) {
      Alert.alert('Could not create the circle', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const invite = async () => {
    try {
      await shareInvite.mutateAsync()
    } catch (error) {
      Alert.alert('Could not share an invite', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const primaryAction = () => (circleId ? invite() : setNaming(true))

  const sendNudge = async (memberId: string, displayName: string) => {
    try {
      await nudge.mutateAsync(memberId)
      Alert.alert('Nudge sent', `${displayName} knows you are cheering them on.`)
    } catch (error) {
      // "Already nudged this week" is a rule, not a failure — say so plainly.
      Alert.alert('Not sent', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const nameSheet = (
    <Sheet
      visible={naming}
      onClose={() => setNaming(false)}
      eyebrow="A private circle"
      title="Name your circle"
      footer={
        <Button
          label={createCircle.isPending ? 'Creating…' : 'Create circle'}
          onPress={createNamed}
          disabled={!nameValid || createCircle.isPending}
        />
      }
    >
      <T role="body" color={colors.inkMuted}>
        Only people you invite can see it. They see that you kept your week — never how much.
      </T>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Slow Money Club"
        placeholderTextColor={colors.inkFaint}
        maxLength={48}
        autoFocus
        accessibilityLabel="Circle name"
        style={[type.heading, styles.nameInput, { color: colors.ink }]}
      />
    </Sheet>
  )

  /* ── Nobody here yet. One illustration, one sentence, one button. ──
     Keyed off the circles list, not `circle.isPending`: a disabled query reports `pending`
     forever, so gating on it meant the empty state could never render. */
  const settled = !circles.isPending && (!circleId || !circle.isPending)
  if (settled && members.length === 0) {
    return (
      <>
        <Screen>
          <AppHeader eyebrow="Private circle" title="Your circle" />
          <Card style={styles.empty}>
            <Illustration name="together" width={268} label="Two people keeping a promise together" />
            <T role="heading" center>
              Better with one other person
            </T>
            <T role="body" center>
              They see that you kept it. Never how much.
            </T>
            <Button
              label={circleId ? 'Invite a friend' : 'Create my circle'}
              icon="personAdd"
              onPress={primaryAction}
              disabled={shareInvite.isPending || createCircle.isPending}
              style={styles.emptyButton}
            />
          </Card>
        </Screen>
        {nameSheet}
      </>
    )
  }

  return (
    <>
      <Screen>
        <AppHeader eyebrow="Private circle" title={circle.data?.circle.name ?? 'Your circle'} />

        {/* ── More than one circle? Say so, and let them be reached. ── */}
        {all.length > 1 ? (
          <Row gap={space[2]} style={styles.switcher}>
            {all.map((entry) => (
              <Chip
                key={entry.id}
                label={entry.name}
                tone={entry.id === circleId ? 'kiwi' : 'neutral'}
                onPress={() => setOpenId(entry.id)}
              />
            ))}
          </Row>
        ) : null}

        {/* ── The week, in one number. ── */}
        <Card tone="coral" style={styles.summary}>
          <View style={styles.summaryCopy}>
            <T role="display" color={colors.ink}>
              {showedUp}/{members.length}
            </T>
            <T role="body" color={colors.coralDeep}>
              kept their promise
            </T>
          </View>
          <RingGlyph size={84} promise={circleProgress} goal={circleProgress} circle={circleProgress} label="" />
        </Card>

        {/* ── Everyone, as rings rather than numbers. ── */}
        <View style={styles.section}>
          <SectionHeader
            title="This week"
            action={<IconButton name="personAdd" label="Invite a friend" onPress={primaryAction} tone="kiwi" />}
          />
          <View style={styles.people}>
            {members.map((member) => {
              // Identity, not position. Members come back ordered by join date, so
              // keying "You" off the first row labelled whoever founded the circle
              // — correct only for the founder, and wrong for everyone they invite.
              const isYou = member.id === myId
              return (
                <Card key={member.id} style={styles.person}>
                  <View style={[styles.avatar, isYou && styles.avatarYou]}>
                    <T role="label" color={isYou ? colors.ink : colors.inkMuted}>
                      {initials(member.displayName)}
                    </T>
                  </View>
                  <View style={styles.personCopy}>
                    <Row gap={space[2]}>
                      <T role="label">{member.displayName}</T>
                      {isYou ? <Chip label="You" tone="kiwi" /> : null}
                    </Row>
                    <T role="caption" color={member.showedUp ? colors.kiwiDeep : colors.inkFaint}>
                      {member.showedUp ? 'Kept this week' : 'Still open'}
                    </T>
                  </View>
                  {/* A nudge only makes sense pointed at an open week, and only
                      at someone else — the server enforces both, and hiding it
                      otherwise keeps the row from offering a dead action. */}
                  {!isYou && !member.showedUp ? (
                    <IconButton
                      name="bell"
                      label={`Nudge ${member.displayName}`}
                      tone="sun"
                      on="card"
                      disabled={nudge.isPending}
                      onPress={() => sendNudge(member.id, member.displayName)}
                    />
                  ) : null}
                  <RingGlyph
                    size={64}
                    promise={member.showedUp ? 1 : 0}
                    goal={member.goalProgress}
                    circle={circleProgress}
                    label={`${member.displayName}: ${member.showedUp ? 'kept' : 'open'}, goal ${Math.round(member.goalProgress * 100)} percent`}
                  />
                </Card>
              )
            })}
          </View>
        </View>

        {/* ── Encouragement. The whole feed, not just the newest line. ── */}
        <View style={styles.section}>
          <SectionHeader title="Encouragement" action={<Chip label="Private" icon="lock" tone="neutral" />} />
          {posts.length ? (
            <View style={styles.feedList}>
              {posts.map((post) => {
                const tally = readReactions(post.reactions, myId)
                return (
                  <Card key={post.id} style={styles.feed}>
                    <Row gap={space[3]}>
                      <IconPlate name="heart" tone="coral" size={40} />
                      <View style={styles.personCopy}>
                        <T role="label">{post.display_name}</T>
                        <T role="caption" color={colors.inkFaint}>
                          {new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(post.created_at))}
                        </T>
                      </View>
                    </Row>
                    <T role="body" color={colors.ink}>
                      {post.body}
                    </T>
                    <Row gap={space[2]}>
                      {REACTIONS.map((emoji) => {
                        const mine = tally[emoji]?.mine ?? false
                        const count = tally[emoji]?.count ?? 0
                        return (
                          <PressableCard
                            key={emoji}
                            accessibilityLabel={`${mine ? 'Remove' : 'Add'} ${emoji} reaction`}
                            disabled={toggleReaction.isPending}
                            onPress={() => toggleReaction.mutate({ postId: post.id, emoji, mine })}
                            style={[styles.reaction, mine && styles.reactionMine]}
                          >
                            <T role="label">
                              {emoji}
                              {count ? ` ${count}` : ''}
                            </T>
                          </PressableCard>
                        )
                      })}
                    </Row>
                  </Card>
                )
              })}
            </View>
          ) : (
            <Card style={styles.quiet}>
              <Illustration name="quiet" width={200} label="A quiet ledge with a plant" />
              <T role="body" center>
                Encouragement shows up here when someone keeps a promise.
              </T>
            </Card>
          )}
        </View>

        <Button
          label={shareInvite.isPending ? 'Preparing invite…' : 'Invite another friend'}
          icon="link"
          variant="secondary"
          onPress={primaryAction}
          disabled={shareInvite.isPending}
        />

        <Button
          label="Start another circle"
          icon="personAdd"
          variant="ghost"
          onPress={() => setNaming(true)}
          disabled={createCircle.isPending}
        />
      </Screen>
      {nameSheet}
    </>
  )
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    empty: { alignItems: 'center', gap: space[4], paddingVertical: space[6] },
    emptyButton: { alignSelf: 'stretch', marginTop: space[2] },
    switcher: { flexWrap: 'wrap' },
    summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[4] },
    summaryCopy: { flex: 1, gap: space[1] },
    section: { gap: space[3] },
    people: { gap: space[3] },
    person: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[4] },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSunken,
    },
    avatarYou: { backgroundColor: colors.kiwi },
    personCopy: { flex: 1, gap: 2 },
    feedList: { gap: space[3] },
    feed: { gap: space[3] },
    reaction: {
      minWidth: 52,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceSunken,
      shadowOpacity: 0,
      elevation: 0,
    },
    /** Your own cheer reads as pressed, so a second tap is obviously an undo. */
    reactionMine: { backgroundColor: colors.kiwiTint, borderWidth: 2, borderColor: colors.kiwi },
    quiet: { alignItems: 'center', gap: space[3], paddingVertical: space[5] },
    nameInput: {
      minHeight: 56,
      paddingHorizontal: space[4],
      borderRadius: radii.lg,
      borderWidth: 2,
      borderColor: colors.hairlineStrong,
      backgroundColor: colors.surfaceSunken,
      outlineStyle: 'none' as never,
    },
  }),
)
