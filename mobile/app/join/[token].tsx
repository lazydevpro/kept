import { useMutation, useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Button, Card, Row, Screen, T } from '@/components/ui'
import { space } from '@/constants/theme'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { IconPlate } from '@/design/icons'
import { Illustration } from '@/design/illustrations'
import { apiRequest } from '@/lib/api'

interface InvitePreview {
  circle: { id: string; name: string; description: string | null; memberCount: number }
}

export default function JoinCircleScreen() {
  const { colors } = useAppTheme()
  const styles = useStyles()
  const { token } = useLocalSearchParams<{ token: string }>()
  const router = useRouter()

  const preview = useQuery({
    queryKey: ['invite', token],
    queryFn: () => apiRequest<InvitePreview>(`/v1/invites/${token}`),
    enabled: Boolean(token),
    retry: false,
  })
  const accept = useMutation({
    mutationFn: () => apiRequest<{ circleId: string }>(`/v1/invites/${token}/accept`, { method: 'POST' }),
    onSuccess: () => router.replace('/circle'),
  })

  return (
    <Screen>
      <Row style={styles.brand}>
        <T role="eyebrow" color={colors.inkFaint}>
          You have been invited
        </T>
      </Row>

      {preview.isPending ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.kiwiDeep} size="large" />
        </View>
      ) : preview.isError ? (
        <Card style={styles.card}>
          <Illustration name="quiet" width={220} label="An empty ledge" />
          <T role="title" center>
            This invite has expired
          </T>
          <T role="body" center>
            Ask your friend for a fresh link.
          </T>
          <Button label="Open KEPT" variant="secondary" onPress={() => router.replace('/')} />
        </Card>
      ) : (
        <Card style={styles.card}>
          <Illustration name="invite" width={252} label="Someone handing over an invitation" />
          <T role="title" center>
            Join {preview.data?.circle.name}
          </T>
          <T role="body" center>
            {preview.data?.circle.description ?? 'A small circle building a weekly habit together.'}
          </T>

          <Row gap={space[3]} style={styles.privacy}>
            <IconPlate name="eyeOff" tone="grape" size={40} />
            <T role="bodySmall" style={styles.privacyCopy}>
              They will see that you kept your week. Never your balance or holdings.
            </T>
          </Row>

          <Button
            label={accept.isPending ? 'Joining…' : `Join ${preview.data?.circle.memberCount ?? 0} others`}
            onPress={() => accept.mutate()}
            disabled={accept.isPending}
            style={styles.action}
          />
          {accept.error ? (
            <T role="caption" center color={colors.coralDeep}>
              {accept.error.message}
            </T>
          ) : null}
        </Card>
      )}
    </Screen>
  )
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    brand: { minHeight: 44, justifyContent: 'center' },
    loading: { paddingTop: space[12] },
    card: { alignItems: 'center', gap: space[4], marginTop: space[6], paddingVertical: space[6] },
    privacy: { alignItems: 'center', backgroundColor: colors.surfaceSunken, borderRadius: 20, padding: space[3] },
    privacyCopy: { flex: 1 },
    action: { alignSelf: 'stretch' },
  }),
)
