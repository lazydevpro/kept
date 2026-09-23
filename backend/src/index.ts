import { app } from "./app";
import { CircleRoom } from "./circle-room";
import {
  processQueue,
  queueHoldingsBackfill,
  runWeeklyReminder,
  sweepPendingContributions,
} from "./jobs";
import { RateLimiter } from "./rate-limiter";
import type { AppEnv, Job } from "./types";

export { CircleRoom, RateLimiter };

/**
 * The nightly jobs ride on one tick of the five-minute cron: 01:15 UTC.
 *
 * They had a cron of their own, and production's deploy failed on it — Workers
 * Free allows five cron triggers per ACCOUNT, shared by every worker on it, and
 * two per environment spent them. One schedule per environment is the budget.
 *
 * Keyed off `scheduledTime`, the tick's nominal time, not the wall clock when the
 * handler happens to run, so a late invocation still counts as its own tick and
 * no tick can count twice.
 */
export function isNightlyTick(scheduledTime: number) {
  const at = new Date(scheduledTime);
  return at.getUTCHours() === 1 && at.getUTCMinutes() === 15;
}

export default {
  fetch: app.fetch,
  /*
   * Awaited, not handed to `waitUntil`. A queue batch whose handler has returned
   * counts as acknowledged, so `message.retry()` called afterwards from a
   * background promise was racing the implicit ack — and "not confirmed yet" is
   * exactly the case that needs the retry to stick.
   */
  async queue(batch: MessageBatch<Job>, env: AppEnv) {
    await processQueue(batch, env);
  },
  scheduled(
    controller: ScheduledController,
    env: AppEnv,
    context: ExecutionContext,
  ) {
    context.waitUntil(sweepPendingContributions(env));
    if (isNightlyTick(controller.scheduledTime)) {
      context.waitUntil(
        Promise.all([runWeeklyReminder(env), queueHoldingsBackfill(env)]),
      );
    }
  },
} satisfies ExportedHandler<AppEnv, Job>;
