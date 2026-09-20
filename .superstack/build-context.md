# Build context — Neon Reserve

## Stack

- Starter: official Solana `kit-expo-minimal` template generated with `create-solana-dapp` 4.8.5.
- Client: Expo 55, React Native 0.83, React 19, TypeScript, Expo Router.
- Solana: `@solana/kit` 6 and `@wallet-ui/react-native-kit` 4 with Mobile Wallet Adapter.
- Data: TanStack Query for RPC and server state.
- Motion: Reanimated 4 for future state transitions; current shell keeps motion restrained.
- Visualization: React Native Skia 2 for native progress rings.
- Typography: Inter and JetBrains Mono through Expo Google Fonts.
- Backend: Cloudflare Worker with Hono, D1, Durable Objects, Queues, Cron, Better Auth, and Zod.
- Trading: a compact xStocks shelf plus a separate Tessera private-markets lane, sharing a Jupiter Swap V2 order/execute boundary.
- Target: Android custom development build, with Solana Mobile as the primary device family and standard Android as a supported target.

## Architecture

- `app/`: route-level screens and four-tab navigation.
- `components/`: shared product primitives and wallet-aware header.
- `features/progress/`: signature rings and consistency visualization.
- `features/session/`, `features/social/`, and `features/trade/`: authentication bootstrap, private-circle data, and on-chain order execution.
- `modules/neon-widget/`: native Android progress widget rendered with rounded SweepGradient arcs.
- `features/account/` and `features/network/`: retained Solana template capabilities.
- `constants/`: identity, network configuration, and semantic theme tokens.
- `../backend/src/routes/`: authenticated profile, goal, circle, invite, wallet, contribution, widget, media, and trade APIs.
- `../backend/src/circle-room.ts` and `jobs.ts`: real-time presence/events plus transaction, push, and share-card background work.

## Product boundary

The complete loop is: start a goal → create or join a trusted circle → connect and cryptographically link a wallet → choose a deliberately small public or private-market asset → review the instrument and execution terms → approve it in the wallet → independently verify the confirmed transaction → fill rings → update the home widget → share progress without exposing balances. Live execution remains gated behind explicit mainnet and provider configuration because these assets do not exist on devnet.

## Environment and services

- Default network: Solana devnet; testnet remains available in the underlying provider.
- Wallet method: Mobile Wallet Adapter.
- Backend staging: deployed to `neon-reserve-api-staging.lazydevpro.workers.dev` with an isolated D1 database, queue, Durable Object, daily cron, observability, and a strong Worker secret.
- Public web/deep-link fallback: deployed to `neon-reserve-web.lazydevpro.workers.dev`.
- Execution: current xStocks public asset metadata and Jupiter Swap V2 order/execute, gated behind `JUPITER_API_KEY` and mainnet. Tessera T-OpenAI and T-Kalshi use official verified Token-2022 mints, are marked as loan participation rights (not company equity), and require an explicit risk acknowledgment before the API creates an order.
- Market data: deliberately no paid Pyth dependency. The app gets an executable quote only at the explicit review step, avoiding a real-time market-data bill for a habit-first experience.
- RPC recommendation: Helius for production; no API key or MCP is configured yet.

## Build status

- Project scaffolded: yes.
- Brand system applied: yes.
- Native product shell: yes.
- Local backend and migrations: yes.
- Anonymous authentication and persistent social API: yes.
- Real-time circle room, background queue, R2 share cards, and Cron: yes.
- Native Android home-screen widget: yes; Expo prebuild verified.
- Live trading code path: yes; activation pending mainnet/provider credentials.
- Automated Worker tests: 7 passing, including anonymous-session/profile, forged-room-ticket, official Tessera catalog, and server-enforced Tessera risk acknowledgment coverage.
- Mobile typecheck, lint, format, and Expo prebuild: passing.
- Native APK compile: passing for arm64/Android 24–36; devnet debug APK built and checksummed on 2026-09-15.
- Physical Solana Mobile test: pending.
- Mainnet readiness: no; devnet prototype only.

## Production readiness review — 2026-09-15

- `mobile.platform`: react-native
- `mobile.wallet_method`: mwa
- `mobile.scaffold_repo`: solana-kit-expo-minimal
- `mobile.physical_device_tested`: false
- `review.security_score`: B
- `review.quality_score`: B
- `review.ready_for_mainnet`: false
- `review.staging_ready`: true
- `review.findings`:
  - severity: High
    category: Release credentials
    description: Expo/EAS is not logged in, so managed release signing, EAS project ID, and Android FCM credentials cannot be provisioned or verified.
    fix: Log into EAS, initialize the project, create managed Android credentials, add FCM V1 credentials, then build the production profile.
  - severity: High
    category: Wallet correctness
    description: The native devnet build compiles, but Mobile Wallet Adapter signing and the signed devnet rehearsal have not run on a physical Solana phone.
    fix: Install the arm64 APK on a connected phone, link a devnet wallet, sign a rehearsal purchase, and verify that the queued contribution closes the promise and updates the widget.
  - severity: High
    category: Regulated assets
    description: Mainnet xStocks purchasing must not be enabled without provider credentials, a dedicated RPC, regional eligibility/KYC decisions, and controlled buy/sell testing.
    fix: Keep `SOLANA_CLUSTER=devnet` until compliance scope is decided; then configure Jupiter and RPC secrets only in the production Worker and run capped mainnet transactions.
  - severity: Medium
    category: Deep links
    description: HTTPS invite fallback and custom-scheme routing work, but Android verified App Links require the production signing SHA-256 and `assetlinks.json`.
    fix: Publish `/.well-known/assetlinks.json` after the release key exists, then enable `autoVerify` and test cold/warm launches.
  - severity: Medium
    category: Notifications
    description: Notification routing, token registration, queue dispatch, and weekly scheduling are implemented; delivery and invalid-token cleanup remain unverified without Expo/FCM credentials.
    fix: Configure EAS/FCM, send a real push to the phone, verify tap routing, and add receipt reconciliation before public scale.
  - severity: Medium
    category: Testing
    description: Typecheck, lint, web export, native compilation, live Cloudflare smoke tests, and five Worker integration tests pass, but the critical wallet path lacks automated/device E2E coverage.
    fix: Add a staging wallet E2E test and a physical-device release checklist to CI/release operations.

## Onboarding product review — 2026-09-20

- The previous settings-heavy treatment has been replaced with a spacious, Acorns-inspired guided flow where the ring remains the dominant product visual.
- The onboarding ring advances between pages to communicate setup momentum. The interactive week preview visibly closes Promise; final in-product ring state still comes from verified data.
- Flow: one-line value proposition → compact reason choice → weekly amount/day → interactive week preview → friend/solo choice → First Step plan award.
- Default sharing to progress-only and defer wallet education, widget setup, advanced privacy, and investing mechanics to contextual first-use guidance.
- “First Step” recognizes turning an intention into a concrete plan. It does not claim an investment or completed promise; contribution/streak awards still require verified behavior.
- Notification permission is never requested automatically. The OS prompt is only reached after the user explicitly chooses the reminder action.
- The visual direction is Soft Consumer with Acorns-like restraint: ring first, one short prompt, one primary decision, minimal card nesting, and no decorative color beyond semantic ring states.
- “Preview app” exits without marking onboarding complete, while final completion saves and syncs the chosen plan with an inline retry state.
- Primary activation metric: a new user creates a promise and either sends/joins a circle invite or connects a wallet in the first session. Retention validation requires a first verified contribution by day 7 and a second by day 14.
- Full research and proposed copy: `outputs/onboarding-research-redesign.md` — kept locally, not in the repo.
