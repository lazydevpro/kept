import { app } from "./app";
import { CircleRoom } from "./circle-room";
import { processQueue, queueHoldingsBackfill, runWeeklyReminder } from "./jobs";
import type { AppEnv, Job } from "./types";

export { CircleRoom };

export default {
  fetch: app.fetch,
  queue(batch: MessageBatch<Job>, env: AppEnv, context: ExecutionContext) {
    context.waitUntil(processQueue(batch, env));
  },
  scheduled(
    _controller: ScheduledController,
    env: AppEnv,
    context: ExecutionContext,
  ) {
    context.waitUntil(
      Promise.all([runWeeklyReminder(env), queueHoldingsBackfill(env)]),
    );
  },
} satisfies ExportedHandler<AppEnv, Job>;
