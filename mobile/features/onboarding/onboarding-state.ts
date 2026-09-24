import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiRequest } from '@/lib/api'

const DRAFT_KEY = 'kept:onboarding:draft'
const COMPLETE_KEY = 'kept:onboarding:complete'

export type GoalChoice = 'reserve' | 'habit' | 'future' | 'exploring'
export type PrivacyChoice = 'progress_only' | 'amounts' | 'holdings'

export type OnboardingDraft = {
  version: 3
  step: number
  goalChoice: GoalChoice | null
  goalTitle: string
  goalWeeks: 4 | 12
  weeklyAmount: number
  reminderDay: number
  promiseCommitted: boolean
  previewCompleted: boolean
  privacyMode: PrivacyChoice
  inviteAfterSetup: boolean | null
  /** What the circle calls you. Optional — the server falls back to "Member" and four characters. */
  displayName: string
  reminderChoice: 'enabled' | 'skipped' | 'unavailable' | null
}

export const defaultOnboardingDraft: OnboardingDraft = {
  version: 3,
  step: 0,
  goalChoice: null,
  goalTitle: '',
  goalWeeks: 12,
  weeklyAmount: 25,
  reminderDay: 4,
  promiseCommitted: false,
  previewCompleted: false,
  privacyMode: 'progress_only',
  inviteAfterSetup: null,
  displayName: '',
  reminderChoice: null,
}

export async function loadOnboardingDraft() {
  const saved = await AsyncStorage.getItem(DRAFT_KEY)
  if (!saved) return defaultOnboardingDraft
  try {
    const parsed = JSON.parse(saved) as Partial<OnboardingDraft>
    if (parsed.version !== 3) return defaultOnboardingDraft
    return { ...defaultOnboardingDraft, ...parsed }
  } catch {
    return defaultOnboardingDraft
  }
}

export async function saveOnboardingDraft(draft: OnboardingDraft) {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export async function isOnboardingComplete() {
  return (await AsyncStorage.getItem(COMPLETE_KEY)) === 'true'
}

/** Onboarding describes an account. When the account goes, so does it. */
export async function resetOnboarding() {
  await AsyncStorage.multiRemove([DRAFT_KEY, COMPLETE_KEY])
}

/** A restored account already has its goal and circle; there is nothing to set up. */
export async function markOnboardingComplete() {
  await AsyncStorage.setItem(COMPLETE_KEY, 'true')
}

/** Welcome, why, rhythm, try it, name, circle, ready. */
export const ONBOARDING_LAST_STEP = 6

export async function completeOnboarding(draft: OnboardingDraft) {
  await Promise.all([
    AsyncStorage.setItem(COMPLETE_KEY, 'true'),
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, step: ONBOARDING_LAST_STEP })),
  ])
}

export async function syncOnboardingDraft(draft: OnboardingDraft) {
  const displayName = draft.displayName.trim()
  await apiRequest('/v1/me', {
    method: 'PATCH',
    body: JSON.stringify({
      privacyMode: draft.privacyMode,
      ...(displayName.length >= 2 ? { displayName } : {}),
    }),
  })

  const goal = await apiRequest<{ id: string }>('/v1/goals', {
    method: 'POST',
    body: JSON.stringify({
      title: draft.goalTitle,
      targetType: 'weekly_consistency',
      targetValue: draft.goalWeeks,
      visibility: draft.privacyMode === 'progress_only' ? 'progress_only' : 'amounts',
    }),
  })

  const now = new Date()
  const due = new Date(now)
  const desiredJsDay = (draft.reminderDay + 1) % 7
  const dayDelta = (desiredJsDay - now.getDay() + 7) % 7
  due.setDate(now.getDate() + dayDelta)
  due.setHours(18, 0, 0, 0)

  const weekStart = new Date(due)
  weekStart.setDate(due.getDate() - ((due.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)

  await apiRequest(`/v1/goals/${goal.id}/promises`, {
    method: 'POST',
    body: JSON.stringify({
      weekStart: weekStart.toISOString().slice(0, 10),
      dueAt: due.toISOString(),
      targetCents: draft.weeklyAmount * 100,
    }),
  })
}
