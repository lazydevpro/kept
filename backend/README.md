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


An account-neutral Cloudflare Worker backend designed to run entirely in local emulation until a Cloudflare account is deliberately selected.

## Services

- D1 stores identity, privacy, goals, promises, circles, invitations, reactions, wallet links, orders, and contribution state.
- A Durable Object provides one hibernating WebSocket room per circle. Important data is always persisted in D1.
- A Queue verifies Solana transactions, generates R2 share cards, and sends opt-in push notifications.
- R2 stores generated share cards and future avatar uploads.
- Better Auth supplies anonymous mobile onboarding and optional Google/Apple upgrades.
- A weekly Cron trigger queues gentle promise reminders.

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
npm run types
npm run typecheck
npm test
npx wrangler deploy --dry-run
```

The test suite runs against local Workers runtime bindings and applies the D1 migrations in isolation.

## Connecting a different Cloudflare account later

Only after switching to the intended account:

1. Authenticate Wrangler in that account.
2. Create one D1 database, one R2 bucket, and one Queue using the logical names in `wrangler.jsonc`.
3. Add the returned D1 `database_id` to the D1 binding. Add an `account_id` only if your environment requires it.
4. Add secrets with Wrangler: `BETTER_AUTH_SECRET`, `JUPITER_API_KEY`, and any optional social-login or Expo push credentials.
5. Change `ENVIRONMENT` to `production`, `SOLANA_CLUSTER` to `mainnet-beta`, and `SOLANA_RPC_URL` to a production RPC.
6. Apply migrations remotely, choose a route or workers.dev hostname, then replace the deployment guard in `scripts/deploy-guard.mjs` only when ready.

There are deliberately no real account IDs, resource IDs, tokens, routes, or deployed hostnames in this repository.

## Trading boundary

`GET /v1/trades/assets` resolves current Solana token addresses from the xStocks public asset API and supplies the verified official Tessera mints for T-OpenAI and T-Kalshi. `POST /v1/trades/order` validates that metadata before requesting a Jupiter Swap V2 transaction. The mobile wallet signs the transaction; `POST /v1/trades/execute` submits it to Jupiter. A successful response still enters the contribution-verification queue before it affects goals or social activity.

This flow is mainnet-only because both xStocks and Tessera T-Tokens are unavailable on Solana devnet. Local requests return a clear `mainnet_required` error instead of simulating a purchase. Tessera orders require an explicit high-risk acknowledgment and make no claim that a T-Token is company equity.
