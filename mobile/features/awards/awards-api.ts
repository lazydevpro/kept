import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api'
import type { ObjectName } from '@/design/objects'

/**
 * Awards are earned from four counters, not one.
 *
 * The collection used to key entirely off the week streak, so the only way to
 * earn anything was to never miss — which rewards the already-consistent and
 * says nothing about building the habit alongside other people. Friends, nudges
 * and perfect months each recognise something the streak cannot.
 */
export interface AwardCounters {
  weekStreak: number
  friends: number
  nudgesSent: number
  /** Finished calendar months in which no due promise was missed. */
  perfectMonths: number
}

export type AwardMetric = keyof AwardCounters

export interface Award {
  id: string
  metric: AwardMetric
  threshold: number
  title: string
  object: ObjectName
  /** Reads under the title on the card, and in the "next award" line. */
  unit: (n: number) => string
}

const weeks = (n: number) => `${n} week${n === 1 ? '' : 's'}`
const people = (n: number) => `${n} friend${n === 1 ? '' : 's'}`
const nudges = (n: number) => `${n} nudge${n === 1 ? '' : 's'}`
const months = (n: number) => `${n} perfect month${n === 1 ? '' : 's'}`

/**
 * Ordered by metric, then by threshold, which is the order the grid renders.
 * Thresholds must stay ascending within a metric — `nextAward` relies on it.
 */
export const AWARDS: Award[] = [
  { id: 'week-1', metric: 'weekStreak', threshold: 1, title: 'First promise', object: 'seedling', unit: weeks },
  { id: 'week-4', metric: 'weekStreak', threshold: 4, title: 'First month', object: 'plant', unit: weeks },
  { id: 'week-8', metric: 'weekStreak', threshold: 8, title: 'Steady eight', object: 'fire', unit: weeks },
  { id: 'week-12', metric: 'weekStreak', threshold: 12, title: 'Quarter rhythm', object: 'chartUp', unit: weeks },
  { id: 'week-26', metric: 'weekStreak', threshold: 26, title: 'Half a year', object: 'star', unit: weeks },
  { id: 'week-52', metric: 'weekStreak', threshold: 52, title: 'A full year', object: 'trophy', unit: weeks },

  { id: 'friend-1', metric: 'friends', threshold: 1, title: 'Not alone', object: 'people', unit: people },
  { id: 'friend-3', metric: 'friends', threshold: 3, title: 'Small circle', object: 'handshake', unit: people },

  { id: 'nudge-1', metric: 'nudgesSent', threshold: 1, title: 'First nudge', object: 'bell', unit: nudges },
  { id: 'nudge-10', metric: 'nudgesSent', threshold: 10, title: 'Good neighbour', object: 'gift', unit: nudges },

  { id: 'month-1', metric: 'perfectMonths', threshold: 1, title: 'Perfect month', object: 'calendar', unit: months },
  { id: 'month-3', metric: 'perfectMonths', threshold: 3, title: 'Three perfect months', object: 'rocket', unit: months },
]

export const isEarned = (award: Award, counters: AwardCounters | undefined) =>
  (counters?.[award.metric] ?? 0) >= award.threshold

/**
 * The closest award still to come — fewest remaining, not first in the list.
 * Ordering by list position would always point at the 52-week badge for someone
 * one nudge away from their next one.
 */
export function nextAward(counters: AwardCounters | undefined) {
  const remaining = AWARDS.filter((award) => !isEarned(award, counters)).map((award) => ({
    award,
    left: award.threshold - (counters?.[award.metric] ?? 0),
  }))
  return remaining.sort((a, b) => a.left - b.left)[0]
}

export function useAwards() {
  return useQuery({
    queryKey: ['awards'],
    queryFn: () => apiRequest<{ counters: AwardCounters }>('/v1/awards'),
    staleTime: 60_000,
    retry: 1,
  })
}

/** Nudge a circle member whose week is still open. */
export function useNudge(circleId?: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => {
      if (!circleId) throw new Error('Join a circle first.')
      return apiRequest<{ nudged: boolean }>(`/v1/circles/${circleId}/members/${memberId}/nudge`, {
        method: 'POST',
      })
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['circle-feed', circleId] })
      client.invalidateQueries({ queryKey: ['awards'] })
    },
  })
}
