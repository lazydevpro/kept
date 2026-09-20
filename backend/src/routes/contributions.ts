import { Hono } from "hono";
import { z } from "zod";
import { ApiError, id } from "../lib/http";
import { parseJson } from "../lib/validation";
import type { AppEnv, Job, Variables } from "../types";

export const contributionRoutes = new Hono<{
  Bindings: AppEnv;
  Variables: Variables;
}>();

contributionRoutes.get("/", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT id, goal_id, signature, asset_symbol, asset_mint, amount_base_units, status, failure_reason, occurred_at, created_at FROM contributions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
  )
    .bind(c.get("userId"))
    .all();
  return c.json({ contributions: result.results });
});

contributionRoutes.post("/", async (c) => {
  const body = await parseJson(
    c,
    z.object({
      signature: z.string().min(32).max(128),
      walletAddress: z.string().min(32).max(44),
      assetMint: z.string().min(32).max(44),
      goalId: z.string().optional(),
      assetSymbol: z.string().trim().min(2).max(12).optional(),
      amountBaseUnits: z.string().regex(/^\d+$/).optional(),
    }),
  );
  const wallet = await c.env.DB.prepare(
    "SELECT id FROM wallet_connections WHERE user_id = ? AND address = ? AND verified_at IS NOT NULL",
  )
    .bind(c.get("userId"), body.walletAddress)
    .first();
  if (!wallet)
    throw new ApiError(
      403,
      "Verify this wallet before recording its contributions.",
    );
  if (body.goalId) {
    const goal = await c.env.DB.prepare(
      "SELECT id FROM goals WHERE id = ? AND user_id = ?",
    )
      .bind(body.goalId, c.get("userId"))
      .first();
    if (!goal) throw new ApiError(404, "Goal not found.");
  }
  const contributionId = id("contribution");
  try {
    await c.env.DB.prepare(
      `INSERT INTO contributions (id, user_id, goal_id, wallet_address, signature, asset_symbol, asset_mint, amount_base_units)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        contributionId,
        c.get("userId"),
        body.goalId ?? null,
        body.walletAddress,
        body.signature,
        body.assetSymbol ?? null,
        body.assetMint,
        body.amountBaseUnits ?? null,
      )
      .run();
  } catch {
    throw new ApiError(409, "This transaction has already been submitted.");
  }
  await c.env.JOBS.send({
    kind: "verify_contribution",
    contributionId,
  } satisfies Job);
  return c.json(
    { contribution: { id: contributionId, status: "pending" } },
    202,
  );
});

contributionRoutes.get("/:contributionId", async (c) => {
  const contribution = await c.env.DB.prepare(
    "SELECT id, goal_id, signature, asset_symbol, asset_mint, amount_base_units, status, failure_reason, occurred_at, created_at FROM contributions WHERE id = ? AND user_id = ?",
  )
    .bind(c.req.param("contributionId"), c.get("userId"))
    .first();
  if (!contribution) throw new ApiError(404, "Contribution not found.");
  return c.json({ contribution });
});
