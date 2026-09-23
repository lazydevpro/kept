import bs58 from "bs58";
import { Hono } from "hono";
import { z } from "zod";
import { ApiError, id } from "../lib/http";
import { parseJson } from "../lib/validation";
import { walletSigned } from "../lib/wallet-signature";
import type { AppEnv, Variables } from "../types";

export const walletRoutes = new Hono<{
  Bindings: AppEnv;
  Variables: Variables;
}>();

walletRoutes.post("/challenge", async (c) => {
  const body = await parseJson(
    c,
    z.object({ address: z.string().min(32).max(44) }),
  );
  try {
    if (bs58.decode(body.address).length !== 32) throw new Error("bad key");
  } catch {
    throw new ApiError(422, "Enter a valid Solana wallet address.");
  }
  const challengeId = id("challenge");
  const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
  // One message for both uses: linking this wallet, and signing in with it on a
  // device where it is already linked (`src/wallet-sign-in.ts`). The reader is
  // asked to sign once whichever it turns out to be.
  const message = [
    "Use this wallet with KEPT.",
    "",
    `Wallet: ${body.address}`,
    `Challenge: ${challengeId}`,
    `Expires: ${expiresAt}`,
    "",
    "This signature does not authorize a transaction.",
  ].join("\n");
  await c.env.DB.prepare(
    "INSERT INTO wallet_challenges (id, user_id, address, message, expires_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(challengeId, c.get("userId"), body.address, message, expiresAt)
    .run();
  return c.json({ challengeId, message, expiresAt }, 201);
});

walletRoutes.post("/verify", async (c) => {
  const body = await parseJson(
    c,
    z.object({
      challengeId: z.string().min(8),
      signature: z.string().min(40).max(256),
    }),
  );
  const challenge = await c.env.DB.prepare(
    "SELECT * FROM wallet_challenges WHERE id = ? AND user_id = ? AND consumed_at IS NULL",
  )
    .bind(body.challengeId, c.get("userId"))
    .first();
  if (!challenge || String(challenge.expires_at) <= new Date().toISOString()) {
    throw new ApiError(
      422,
      "This wallet challenge expired. Request a new one.",
    );
  }
  if (
    !walletSigned(
      String(challenge.address),
      String(challenge.message),
      body.signature,
    )
  )
    throw new ApiError(422, "The wallet signature could not be verified.");
  const existing = await c.env.DB.prepare(
    "SELECT id, user_id FROM wallet_connections WHERE address = ?",
  )
    .bind(challenge.address)
    .first();
  if (existing?.user_id === c.get("userId")) {
    await c.env.DB.prepare(
      "UPDATE wallet_challenges SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
      .bind(challenge.id)
      .run();
    return c.json({
      wallet: { id: existing.id, address: challenge.address, verified: true },
    });
  }
  if (existing) {
    /*
     * The wallet is someone's — almost always the reader's own earlier account,
     * from before a reinstall or a new phone. The challenge is deliberately NOT
     * consumed: the app offers to switch to that account and completes it at
     * `/api/auth/sign-in/wallet` with the signature it already has.
     */
    throw new ApiError(
      409,
      "This wallet is already linked to another KEPT account.",
      "wallet_linked_elsewhere",
    );
  }
  const walletId = id("wallet");
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(
        "UPDATE wallet_challenges SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?",
      ).bind(challenge.id),
      c.env.DB.prepare(
        "INSERT INTO wallet_connections (id, user_id, address, verified_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
      ).bind(walletId, c.get("userId"), challenge.address),
    ]);
  } catch {
    // Lost a race with another link of the same wallet.
    throw new ApiError(
      409,
      "This wallet is already linked to another KEPT account.",
      "wallet_linked_elsewhere",
    );
  }
  return c.json(
    { wallet: { id: walletId, address: challenge.address, verified: true } },
    201,
  );
});

/**
 * Unlink. Purchases already made from the wallet stay in the portfolio — they
 * happened — but nothing new can be bought or sold through it, and it can be
 * linked to a different account afterwards.
 */
walletRoutes.delete("/:address", async (c) => {
  const result = await c.env.DB.prepare(
    "DELETE FROM wallet_connections WHERE user_id = ? AND address = ?",
  )
    .bind(c.get("userId"), c.req.param("address"))
    .run();
  if (!result.meta.changes) throw new ApiError(404, "Wallet not found.");
  return c.body(null, 204);
});
