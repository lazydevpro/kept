# KEPT backend

## Demo data

Fills the local database with a realistic account so every screen has something
to show. Sign in on the app first, then:

```bash
npm run db:seed:demo                 # newest profile
node ./scripts/seed-demo.mjs <userId>  # a specific one — see /v1/me
```

Twelve weeks of promises with two misses and the current week left open, ten
verified purchases, a four-person circle, and a verified wallet. Re-run to reset.

Everything it writes is ordinary data through the ordinary API — there is no mock
layer in the app. The mints are **real mainnet mints at their real 9 decimals**,
so the portfolio prices them against live Jupiter quotes; only the purchases
themselves are synthetic, because a real holding needs a real on-chain buy.

The Cloudflare Worker behind the app. Three environments: `local` (wrangler dev and the tests), `staging` (devnet, `neon-reserve-api-staging.lazydevpro.workers.dev`) and `production` (mainnet, `kept-api.lazydevpro.workers.dev`).

## Services

- D1 stores identity, privacy, goals, promises, circles, invitations, reactions, wallet links, orders, and contribution state.
- A Durable Object provides one hibernating WebSocket room per circle. Important data is always persisted in D1.
- A second Durable Object, `RateLimiter`, counts sign-ins per address and Jupiter-backed quotes per user — exactly, which Cloudflare's Rate Limiting binding did not (see `src/rate-limiter.ts`).
- A Queue verifies Solana transactions and sends opt-in push notifications.
- Better Auth supplies anonymous onboarding, a one-year session, and sign-in with a linked wallet (`src/wallet-sign-in.ts`) so an account survives a reinstall.
- Cron: nightly reminders and holdings backfill; every five minutes, re-verification of purchases still pending after two minutes.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

Set `BETTER_AUTH_SECRET` in `.dev.vars` to a random value containing at least 32 characters. The other secrets are optional locally. Do not commit `.dev.vars`.

Quality checks:

```bash
npm run check                 # types, typecheck, format, tests
npx wrangler deploy --dry-run
```

`npm run format` writes; `npm run format:check` is the gate inside `check`.

Prettier here is **80 columns, semicolons, double quotes** — deliberately not the
120/no-semi/single-quote style of `mobile/` and `web/`. Those values were measured
from the Worker rather than chosen: every import in `src/` is double-quoted, a
thousand statements end in a semicolon, and the 95th-percentile line is 79
characters. Restyling to match the other workspaces would rewrite most of the
Worker to settle a question nobody asked. See `prettier.config.mjs`.

`wrangler.jsonc` and `migrations/` are excluded — Wrangler owns the first and
Prettier has no SQL parser for the second.

The test suite runs against local Workers runtime bindings and applies the D1 migrations in isolation.

## Deploying

```bash
npm run deploy:staging      # check → migrate staging D1 → deploy
npm run deploy:production   # check → migrate production D1 → deploy
```

A bare `npm run deploy` refuses: without `--env` it would publish the `local` config.

Secrets, per environment (`npx wrangler secret put <NAME> --env <env>`):

| Secret               |                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BETTER_AUTH_SECRET` | Required. 32+ random characters, different per environment.                                                                                                                          |
| `JUPITER_API_KEY`    | Required to trade on mainnet. From [developers.jup.ag](https://developers.jup.ag/portal); the free key is 1 req/s. Without it, buys and sells refuse with `provider_not_configured`. |
| `PRIVATE_RPC_URL`    | Strongly recommended on mainnet. A paid RPC URL (Helius, Triton…) — the public endpoint rate-limits the `getTransaction` calls verification rests on.                                |
| `EXPO_ACCESS_TOKEN`  | Optional, for push.                                                                                                                                                                  |

Production's D1 (`kept-production`) and queue (`kept-jobs`) exist. Staging's are `neon-reserve-staging` and `neon-reserve-jobs-staging`.

## Trading boundary

`GET /v1/trades/assets` resolves current Solana token addresses from the xStocks public asset API and Tessera's T-Tokens from its public catalogue, falling back to the three verified mints (T-OpenAI, T-Kalshi, T-SpaceX) when that API is down. `POST /v1/trades/order` requires the buyer to have accepted the current terms (`src/lib/terms.ts`) — selling never does — and validates that metadata before requesting a Jupiter Swap V2 transaction. The mobile wallet signs the transaction; `POST /v1/trades/execute` submits it to Jupiter. A successful response still enters the contribution-verification queue before it affects goals or social activity.

This flow is mainnet-only because both xStocks and Tessera T-Tokens are unavailable on Solana devnet. Local requests return a clear `mainnet_required` error instead of simulating a purchase. Tessera orders require an explicit high-risk acknowledgment and make no claim that a T-Token is company equity.

`GET /v1/trades/sell-quote` and `POST /v1/trades/sell-order` are the way back out, priced in asset units rather than dollars. A sell is refused unless the caller holds that much — checked against `lib/holdings.ts`, the same module the portfolio reads, so the two can never disagree. Sells are mainnet-only for a different reason than buys: a devnet rehearsal signs a memo and receives no asset, so there is nothing on that cluster to dispose of.

Sells land in `contributions` next to buys, separated by `direction`. Two conventions matter and migration 0010 spells them out: the units column is always a positive magnitude, and `input_amount_usdc_base_units` means _spent_ on a buy and _received_ on a sell. Any query that means "money in" must say `direction = 'buy'` — the widget's does, with a test that fails loudly if it stops.

Verification mirrors: a buy must increase the linked wallet's balance of the mint, a sell must decrease it. A sell never closes a weekly promise and never reaches a circle feed.
