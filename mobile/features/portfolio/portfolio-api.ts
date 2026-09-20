import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api'

/**
 * The owner's own portfolio. Private by construction — the backend computes
 * holdings only for the calling user, and nothing here is reachable from the
 * circle endpoints. Friends continue to see progress only.
 *
 * Every money field except `costUsd` is nullable, and that is the point: live
 * prices exist only on mainnet with a Jupiter key, so devnet and price outages
 * degrade to cost basis rather than inventing a number. Render the nulls as
 * "not available", never as zero.
 */
export interface Position {
  mint: string
  symbol: string
  /** Empty when the token has no published artwork — draw initials instead. */
  logo: string
  decimals: number | null
  baseUnits: string
  quantity: number | null
  lots: number
  costUsd: number
  avgCostUsd: number | null
  priceUsd: number | null
  valueUsd: number | null
  pnlUsd: number | null
  pnlPct: number | null
  firstAt: string | null
  lastAt: string | null
}

export interface Portfolio {
  cluster: string
  priced: boolean
  pricedAt: string | null
  totals: {
    positions: number
    costUsd: number
    valueUsd: number | null
    pnlUsd: number | null
    pnlPct: number | null
  }
  positions: Position[]
  /** Devnet rehearsals: no money moved, no asset received. Never holdings. */
  rehearsals: { lots: number; notionalUsd: number }
}

export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: () => apiRequest<{ portfolio: Portfolio }>('/v1/portfolio'),
    staleTime: 60_000,
    retry: 1,
  })
}

export function usd(value: number) {
  // Pinned to en-US: the device locale renders USD as "US$100.00" outside the US,
  // and these amounts are always dollars regardless of where the phone is.
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  })
}

export function signedUsd(value: number) {
  return `${value >= 0 ? '+' : '−'}${usd(Math.abs(value))}`
}

export function signedPct(value: number) {
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(1)}%`
}

/** Tokenised equities carry long fractional tails; four places is plenty. */
export function quantity(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 })
}
