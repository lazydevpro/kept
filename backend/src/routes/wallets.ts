import { ed25519 } from "@noble/curves/ed25519.js";
import bs58 from "bs58";
import { Hono } from "hono";
import { z } from "zod";
import { ApiError, id } from "../lib/http";
import { parseJson } from "../lib/validation";
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
  const message = [
    "Link this wallet to KEPT.",
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
      // Mobile Wallet Adapter hands back the SIGNED PAYLOAD — the challenge message with
      // the 64-byte signature appended — not a bare signature. That is ~376 base64
      // characters for our message, so a 256 cap rejected every real wallet before the
      // verification below ever ran, and the handler's own slice(-64) was unreachable.
      signature: z.string().min(40).max(2048),
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
  // Base64 only carries "=" when the byte length is not a multiple of three, so picking
  // the encoding by looking for padding sent unpadded base64 down the base58 path, where
  // it either threw or decoded to nonsense. Decode both ways and let the signature check
  // be the thing that decides.
  const decoded = [
    () =>
      Uint8Array.from(atob(body.signature), (character) =>
        character.charCodeAt(0),
      ),
    () => bs58.decode(body.signature),
  ].flatMap((decode) => {
    try {
      return [decode()];
    } catch {
      return [];
    }
  });

  const message = new TextEncoder().encode(String(challenge.message));
  const publicKey = bs58.decode(String(challenge.address));
  const valid = decoded
    // A signed payload is the message with the signature appended; a bare signature is
    // the 64 bytes on their own. Wallets return both shapes.
    .flatMap((payload) =>
      payload.length === 64
        ? [payload]
        : [payload.slice(0, 64), payload.slice(-64)],
    )
    .some((signature) => {
      try {
        return ed25519.verify(signature, message, publicKey);
      } catch {
        return false;
      }
    });
  if (!valid)
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
    throw new ApiError(409, "That wallet is already linked to an account.");
  }
  return c.json(
    { wallet: { id: walletId, address: challenge.address, verified: true } },
    201,
  );
});
