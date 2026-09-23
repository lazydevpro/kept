import type { AppEnv } from "../types";

/**
 * The RPC endpoint to talk to.
 *
 * `PRIVATE_RPC_URL` is a secret because a paid provider's URL carries its API key
 * (Helius, Triton and QuickNode all put it in the path or query). When it is not
 * set, the public cluster URL from `wrangler.jsonc` is used — fine on devnet, and
 * not fine on mainnet at any volume: the public endpoint rate-limits
 * `getTransaction`, which is the call every purchase's verification rests on.
 */
export function rpcUrl(env: AppEnv): string {
  return env.PRIVATE_RPC_URL || env.SOLANA_RPC_URL;
}
