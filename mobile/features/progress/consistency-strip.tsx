import { StyleSheet, View } from 'react-native'
import { space } from '@/constants/theme'
import { makeThemedStyles, useAppTheme } from '@/components/theme-provider'
import { T } from '@/components/ui'

/**
 * Twelve weeks, one column each. Kept weeks are solid kiwi; the current week is outlined
 * so it reads as "open" rather than "failed" — the difference between a habit tracker that
 * encourages and one that scolds.
 */
export function ConsistencyStrip({ weeks = [], columns = 12 }: { weeks?: boolean[]; columns?: number }) {
  const styles = useStyles()
  const { colors } = useAppTheme()
  const padded = [...Array(Math.max(0, columns - weeks.length)).fill(false), ...weeks.slice(-columns)] as boolean[]
  const currentIndex = padded.length - 1

  return (
    <View style={styles.wrap}>
      <View style={styles.strip}>
        {padded.map((kept, index) => (
          <View
            key={index}
            style={[
              styles.cell,
              kept && styles.cellKept,
              !kept && index === currentIndex && styles.cellOpen,
              index === currentIndex && styles.cellCurrent,
            ]}
          />
        ))}
      </View>
      <View style={styles.labels}>
        <T role="caption" color={colors.inkFaint}>
          12 weeks ago
        </T>
        <T role="caption" color={colors.inkFaint}>
          This week
        </T>
      </View>
    </View>
  )
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: space[2] },
    strip: { flexDirection: 'row', gap: space[1] + 2 },
    cell: { flex: 1, height: 44, borderRadius: 8, backgroundColor: colors.surfaceSunken },
    cellKept: { backgroundColor: colors.kiwi },
    cellOpen: { borderWidth: 2, borderColor: colors.kiwi, borderStyle: 'dashed', backgroundColor: 'transparent' },
    cellCurrent: { height: 52, marginTop: -4 },
    labels: { flexDirection: 'row', justifyContent: 'space-between' },
  }),
)
