# KEPT — _Promises compound._

KEPT is a private social investing habit app for Solana Mobile. People set a consistency goal, invest from a self-custodial wallet, and share progress with a trusted circle without exposing balances or holdings by default.

> The project directory, Cloudflare resources and Android package still use the original
> `neon-reserve` / `neonreserve` identifiers. Those are wire identifiers — the URL scheme,
> the deployed worker hostnames and the on-chain memo prefix — and renaming them would break
> deployed infrastructure, so only the user-facing name changed.

## Workspace

- `mobile/` — Expo/React Native app, Mobile Wallet Adapter, SVG progress rings, and native Android home-screen widget.
- `backend/` — Cloudflare Worker API using D1, Durable Objects, Queues, Better Auth, and scheduled jobs.
- `web/` — the landing page, `/terms`, `/privacy` and the `/join` invite page, on Cloudflare Pages.
- `docs/design/` — the KEPT design system, the source of truth for the interface.
- `docs/private-markets.md` — Tessera and PreStocks compared, down to the mint extensions.

Where things run:

| | |
|---|---|
| Site | <https://keptapp.pages.dev> — Cloudflare Pages, `cd web && npm run deploy` |
| API, staging (devnet) | <https://neon-reserve-api-staging.lazydevpro.workers.dev> — `cd backend && npm run deploy:staging` |
| API, production (mainnet) | `https://kept-api.lazydevpro.workers.dev` — `cd backend && npm run deploy:production` |
| App builds | `mobile/eas.json`: `preview` → staging on devnet, `production` → production on mainnet |

CI (`.github/workflows/ci.yml`) runs every workspace's gates on each push; deploys stay manual.

## Local start

Start the backend first:

```bash
cd backend
npm install
cp .dev.vars.example .dev.vars
# Put a random 32+ character value in BETTER_AUTH_SECRET.
npm run db:migrate:local
npm run dev
```

Then run the Android development build:

```bash
cd ../mobile
npm install
npm run android
```

An Android emulator reaches the local Worker at `http://10.0.2.2:8787`. For a physical Solana phone, copy `mobile/.env.example` to `.env` and replace the URL with the computer's LAN address.

## Safe defaults

- Local chain is Solana devnet.
- Live xStocks purchases are rejected unless the backend is explicitly configured for `mainnet-beta` and given a Jupiter API key.
- Social posts and widgets expose progress only unless the user changes privacy settings.
- A submitted signature remains pending until a queue consumer checks the confirmed Solana transaction and linked wallet.
- Auth identities and Solana wallets are separate and linked using an expiring signed-message challenge.

See [backend/README.md](./backend/README.md) and [mobile/README.md](./mobile/README.md) for details.
