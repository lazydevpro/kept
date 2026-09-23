// `wrangler deploy` with no --env would publish the top-level config — the
// `local` environment, pointed at devnet with local-only CORS — as a live worker.
// There is no reason to ever want that, so the bare command refuses.
throw new Error(
  "Choose an environment: `npm run deploy:staging` or `npm run deploy:production`.",
);
