import { requireNativeModule } from 'expo-modules-core'
import { Platform } from 'react-native'

export interface WidgetSnapshot {
  title: string
  message: string
  rings: { consistency: number; circle: number; goal: number }
  updatedAt: string
  summary?: {
    goal: { title: string; complete: number; target: number }
    circle: { members: number; showedUp: number }
    consistency: { kept: number; total: number; streak: number; weeks: boolean[] }
    /**
     * `monthUsd` and `recentUsd` are LIVE money only. Devnet rehearsals move no
     * funds, so they are reported separately and must never be added to these.
     */
    contributions: {
      monthUsd: number
      recentUsd: number[]
      rehearsedMonthUsd: number
      rehearsedRecentUsd: number[]
    }
    latest: { amountUsd: number; symbol: string; occurredAt: string; mode: string } | null
    awardWeeks: number
  }
}

interface NeonWidgetNativeModule {
  updateProgress(snapshot: WidgetSnapshot): Promise<void>
}

const nativeModule = Platform.OS === 'android' ? requireNativeModule<NeonWidgetNativeModule>('NeonWidget') : null

export function updateNeonWidget(snapshot: WidgetSnapshot) {
  return nativeModule?.updateProgress(snapshot) ?? Promise.resolve()
}
