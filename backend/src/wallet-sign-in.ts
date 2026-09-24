import type { BetterAuthPlugin } from "better-auth";
import {
  APIError,
  createAuthEndpoint,
  sessionMiddleware,
} from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import { walletSigned } from "./lib/wallet-signature";

/**
 * Sign in with the wallet, so an account survives the device it was made on.
 *
 * Every account starts anonymous: a session token in the keychain and nothing
 * else. That token was the ONLY way back in, so a reinstall, a new phone or a
 * lapsed session left the account unreachable for good — and because a wallet
 * can belong to exactly one account, the wallet went down with it. Someone who
 * came back after a quiet month found an empty app and a wallet KEPT refused to
 * link ("already linked to an account").
 *
 * The wallet is the one identity a KEPT user is guaranteed to still have. So a
 * challenge signed by a linked wallet is accepted as a login to the account that
 * wallet is linked to.
 *
 * ── Why it reuses the link challenge ──
 *
 * The challenge comes from `POST /v1/wallets/challenge`, the same one linking
 * uses, and is bound to the session that asked for it. When linking fails
 * because the wallet already belongs to another account, the challenge is left
 * unconsumed — so the app can offer "switch to that account" and complete it with
 * the signature it already holds. One wallet prompt, not two.
 *
 * ── The account left behind ──
 *
 * Its session is revoked. If it is anonymous and holds nothing — no goal, no
 * circle, no wallet, no purchases — it is deleted rather than left as litter.
 * One that holds anything is kept: it is not ours to throw away.
 */
export function walletSignIn(db: D1Database) {
  return {
    id: "kept-wallet-sign-in",
    endpoints: {
      signInWallet: createAuthEndpoint(
        "/sign-in/wallet",
        {
          method: "POST",
          body: z.object({
            challengeId: z.string().min(8).max(80),
            // A Mobile Wallet Adapter signed payload is ~376 characters of base64.
            signature: z.string().min(40).max(2048),
          }),
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const current = ctx.context.session;
          const challenge = await db
            .prepare(
              "SELECT id, address, message, expires_at FROM wallet_challenges WHERE id = ? AND user_id = ? AND consumed_at IS NULL",
            )
            .bind(ctx.body.challengeId, current.user.id)
            .first<{
              id: string;
              address: string;
              message: string;
              expires_at: string;
            }>();
          if (!challenge || challenge.expires_at <= new Date().toISOString()) {
            throw new APIError("UNPROCESSABLE_ENTITY", {
              code: "challenge_expired",
              message: "This wallet challenge expired. Request a new one.",
            });
          }
          if (
            !walletSigned(
              challenge.address,
              challenge.message,
              ctx.body.signature,
            )
          ) {
            throw new APIError("UNPROCESSABLE_ENTITY", {
              code: "signature_invalid",
              message: "The wallet signature could not be verified.",
            });
          }

          const owner = await db
            .prepare(
              "SELECT user_id FROM wallet_connections WHERE address = ? AND verified_at IS NOT NULL",
            )
            .bind(challenge.address)
            .first<{ user_id: string }>();
          if (!owner) {
            // Not consumed: the app falls back to linking the wallet to the
            // current account with the same signature.
            throw new APIError("NOT_FOUND", {
              code: "wallet_not_linked",
              message: "No KEPT account uses this wallet yet.",
            });
          }

          await db
            .prepare(
              "UPDATE wallet_challenges SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?",
            )
            .bind(challenge.id)
            .run();

          if (owner.user_id === current.user.id) {
            return ctx.json({ switched: false, user: current.user });
          }

          const user = await ctx.context.internalAdapter.findUserById(
            owner.user_id,
          );
          if (!user) {
            throw new APIError("NOT_FOUND", {
              code: "wallet_not_linked",
              message: "No KEPT account uses this wallet yet.",
            });
          }
          const session = await ctx.context.internalAdapter.createSession(
            user.id,
          );
          await setSessionCookie(ctx, { session, user });

          await ctx.context.internalAdapter.deleteSession(
            current.session.token,
          );
          if ((current.user as { isAnonymous?: boolean }).isAnonymous) {
            await discardIfEmpty(db, current.user.id);
          }

          return ctx.json({ switched: true, token: session.token, user });
        },
      ),
    },
  } satisfies BetterAuthPlugin;
}

async function discardIfEmpty(db: D1Database, userId: string) {
  const holds = await db
    .prepare(
      `SELECT
         EXISTS(SELECT 1 FROM goals WHERE user_id = ?1)
      OR EXISTS(SELECT 1 FROM circle_members WHERE user_id = ?1)
      OR EXISTS(SELECT 1 FROM wallet_connections WHERE user_id = ?1)
      OR EXISTS(SELECT 1 FROM contributions WHERE user_id = ?1) AS holds`,
    )
    .bind(userId)
    .first<{ holds: number }>();
  if (holds?.holds) return;
  await db.prepare('DELETE FROM "user" WHERE id = ?').bind(userId).run();
}
