import { Hono } from "hono";
import { z } from "zod";
import { ApiError, id } from "../lib/http";
import { parseJson } from "../lib/validation";
import type { AppEnv, Variables } from "../types";

const goalInput = z.object({
  title: z.string().trim().min(2).max(80),
  targetType: z
    .enum(["weekly_consistency", "streak", "contribution_count"])
    .default("weekly_consistency"),
  targetValue: z.number().int().min(1).max(365),
  visibility: z
    .enum(["private", "progress_only", "amounts"])
    .default("progress_only"),
});

export const goalRoutes = new Hono<{
  Bindings: AppEnv;
  Variables: Variables;
}>();

goalRoutes.get("/", async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT g.*,
      COUNT(w.id) AS promise_count,
      SUM(CASE WHEN w.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS promises_kept
     FROM goals g LEFT JOIN weekly_promises w ON w.goal_id = g.id
     WHERE g.user_id = ? GROUP BY g.id ORDER BY g.created_at DESC`,
  )
    .bind(c.get("userId"))
    .all();
  return c.json({ goals: result.results });
});

goalRoutes.post("/", async (c) => {
  const body = await parseJson(c, goalInput);
  const goalId = id("goal");
  await c.env.DB.prepare(
    "INSERT INTO goals (id, user_id, title, target_type, target_value, visibility) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(
      goalId,
      c.get("userId"),
      body.title,
      body.targetType,
      body.targetValue,
      body.visibility,
    )
    .run();
  return c.json({ id: goalId }, 201);
});

goalRoutes.patch("/:goalId", async (c) => {
  const body = await parseJson(
    c,
    goalInput
      .partial()
      .extend({ status: z.enum(["active", "paused", "completed"]).optional() }),
  );
  const existing = await c.env.DB.prepare(
    "SELECT * FROM goals WHERE id = ? AND user_id = ?",
  )
    .bind(c.req.param("goalId"), c.get("userId"))
    .first();
  if (!existing) throw new ApiError(404, "Goal not found.");
  await c.env.DB.prepare(
    `UPDATE goals SET title = ?, target_type = ?, target_value = ?, visibility = ?, status = ? WHERE id = ? AND user_id = ?`,
  )
    .bind(
      body.title ?? existing.title,
      body.targetType ?? existing.target_type,
      body.targetValue ?? existing.target_value,
      body.visibility ?? existing.visibility,
      body.status ?? existing.status,
      existing.id,
      c.get("userId"),
    )
    .run();
  return c.json({ updated: true });
});

goalRoutes.post("/:goalId/promises", async (c) => {
  const body = await parseJson(
    c,
    z.object({
      weekStart: z.iso.date(),
      dueAt: z.iso.datetime(),
      targetCents: z.number().int().positive().optional(),
    }),
  );
  const goal = await c.env.DB.prepare(
    "SELECT id FROM goals WHERE id = ? AND user_id = ?",
  )
    .bind(c.req.param("goalId"), c.get("userId"))
    .first();
  if (!goal) throw new ApiError(404, "Goal not found.");
  const promiseId = id("promise");
  await c.env.DB.prepare(
    "INSERT INTO weekly_promises (id, goal_id, user_id, week_start, due_at, target_cents) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(
      promiseId,
      goal.id,
      c.get("userId"),
      body.weekStart,
      body.dueAt,
      body.targetCents ?? null,
    )
    .run();
  return c.json({ id: promiseId }, 201);
});
