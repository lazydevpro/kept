import { Hono } from "hono";
import type { AppEnv, Variables } from "../types";

/**
 * The four numbers every award is earned from.
 *
 * Awards used to be derived from one figure — the week streak — which meant the
 * only way to earn anything was to never miss. That rewards the person who was
 * already consistent and says nothing to anyone building the habit with other
 * people, which is the part of this product that is actually novel.
 *
 * Counters live here; the thresholds and the copy live with the screen that
 * renders them. Nothing here exposes money, and nothing here is readable by
 * anyone but the owner — a circle still sees progress only.
 */
export const awardRoutes = new Hono<{
  Bindings: AppEnv;
  Variables: Variables;
}>();

interface Counters {
  week_streak: number;
  friends: number;
  nudges_sent: number;
  perfect_months: number;
}

awardRoutes.get("/", async (c) => {
  const userId = c.get("userId");

  const [promises, friends, nudges, months] = await c.env.DB.batch([
    // Newest first: the streak walks back from now and stops at the first miss.
    c.env.DB.prepare(
      `SELECT completed_at, due_at FROM weekly_promises
       WHERE user_id = ? ORDER BY week_start DESC LIMIT 60`,
    ).bind(userId),
    // Everyone who shares a circle with you, counted once however many circles
    // you share — three circles with the same friend is still one friend.
    c.env.DB.prepare(
      `SELECT COUNT(DISTINCT other.user_id) AS friends
       FROM circle_members mine
       JOIN circle_members other ON other.circle_id = mine.circle_id
       WHERE mine.user_id = ? AND other.user_id != ?`,
    ).bind(userId, userId),
    c.env.DB.prepare(
      "SELECT COUNT(*) AS nudges_sent FROM nudges WHERE from_user_id = ?",
    ).bind(userId),
    /**
     * A calendar month with at least one promise due and none missed.
     *
     * Deliberately not the streak: a streak is unforgiving and ends for good,
     * while a month can be perfect again after a bad one. Only months that have
     * finished are counted, so a good first week does not hand out the award
     * before the month is over.
     */
    c.env.DB.prepare(
      `SELECT COUNT(*) AS perfect_months FROM (
         SELECT substr(week_start, 1, 7) AS month
         FROM weekly_promises
         WHERE user_id = ? AND substr(week_start, 1, 7) < strftime('%Y-%m', 'now')
         GROUP BY month
         HAVING SUM(CASE WHEN completed_at IS NULL THEN 1 ELSE 0 END) = 0
       )`,
    ).bind(userId),
  ]);

  // Same walk the Week screen uses: an open current week is skipped rather than
  // treated as a miss, otherwise the streak reads zero until you invest.
  let weekStreak = 0;
  for (const row of promises.results as Array<Record<string, unknown>>) {
    if (!row.completed_at) {
      const stillOpen = row.due_at ? new Date(String(row.due_at)) > new Date() : false;
      if (stillOpen) continue;
      break;
    }
    weekStreak += 1;
  }

  const first = <T>(result: { results: unknown[] }, key: string) =>
    Number((result.results[0] as Record<string, unknown>)?.[key] ?? 0) as T;

  return c.json({
    counters: {
      weekStreak,
      friends: first<number>(friends, "friends"),
      nudgesSent: first<number>(nudges, "nudges_sent"),
      perfectMonths: first<number>(months, "perfect_months"),
    } satisfies Record<string, number>,
  });
});

export type { Counters };
