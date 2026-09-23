export type PrivacyMode = "progress_only" | "amounts" | "holdings";

export interface Secrets {
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_CLIENT_SECRET?: string;
  EXPO_ACCESS_TOKEN?: string;
  JUPITER_API_KEY?: string;
  /** A paid RPC URL, which carries its provider's key. See `lib/solana.ts`. */
  PRIVATE_RPC_URL?: string;
}

export type AppEnv = Env & Secrets;

export interface Variables {
  userId: string;
}

export interface VerificationJob {
  kind: "verify_contribution";
  contributionId: string;
}

export interface PushJob {
  kind: "send_push";
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface ShareCardJob {
  kind: "generate_share_card";
  postId: string;
}

/** Fills holdings columns for a contribution verified before migration 0006. */
export interface HoldingsBackfillJob {
  kind: "backfill_holdings";
  contributionId: string;
}

export type Job =
  VerificationJob | PushJob | ShareCardJob | HoldingsBackfillJob;
