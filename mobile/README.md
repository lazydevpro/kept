# Neon Reserve mobile

Neon Reserve is a private social investing habit app: set a weekly promise, invest through your own Solana wallet, and share progress—not balances—with a trusted circle.

## Included product flow

- Four native product tabs: Today, Circle, Goal, and Invest.
- Signature concentric progress rings rendered with React Native Skia.
- Neon Reserve dark theme with Inter and JetBrains Mono.
- Solana Mobile Wallet Adapter connection on devnet.
- Current xStocks asset metadata resolved by the backend and a Mobile Wallet Adapter signing flow for Jupiter Swap V2.
- A deliberately small xStocks shelf and a separate Tessera private-markets lane for T-OpenAI, T-Kalshi and T-SpaceX, with the T-Token structure and transfer fee disclosed before a wallet handoff.
- Anonymous Better Auth onboarding, profile privacy, persisted goals, weekly promises, and private circles.
- Expiring deep-link invites with a join screen and native sharing.
- Cryptographic wallet ownership verification before investments can be associated with a person.
- A native Android home-screen widget that stores progress-only ring data on-device.
- Queued transaction verification before rings or social posts are updated.

Live xStocks execution is intentionally unavailable on devnet. The review flow becomes executable only after the backend is explicitly switched to mainnet and configured with a Jupiter API key.

The product does not depend on a paid market-data feed for its primary experience. Execution quotes are requested only at the explicit review step. Tessera T-Tokens are high-risk loan participation rights—not company equity—and require a mainnet wallet plus an explicit acknowledgment.

## Run on Android

This project uses native modules, so use a custom development build rather than Expo Go.

```bash
npm install
npm run android
```

For an already-installed development build:

```bash
npm run dev
```

The Android home-screen widget is a local Expo module in `modules/neon-widget`; Expo Go cannot load it. A full native build requires Android SDK 36 and JDK 17 or newer.

### Weekly reminders need an EAS project id

Push registration calls `getExpoPushTokenAsync({ projectId })`. EAS injects that id into
its own builds, but a local `npm run android` build reads it from `extra.eas.projectId` in
`app.json` — which is **not set**, so reminders silently stay off locally.

```bash
npx eas init   # writes extra.eas.projectId into app.json
```

Without it the app is fully usable and onboarding says so plainly ("Reminders aren't
available in this build") rather than implying the user declined. Delivery also needs
`EXPO_ACCESS_TOKEN` on the Worker for authenticated sends.

## Quality checks

```bash
npx tsc --noEmit
npm run lint:check
npm run format:check
npm run doctor
npx expo export --platform android --output-dir dist
```

See [brand.md](./brand.md) for the visual system and [../.superstack/build-context.md](../.superstack/build-context.md) for architecture and implementation status.

## Release APK

```bash
npm run release:apk
```

Builds a mainnet APK pointed at the production API, signs it with the release key and checks both. The key is **not** in the repo: it lives in `~/.kept/android/` (`kept-release.jks`, `keystore.properties`). Back it up — every future release must be signed with it or phones refuse the update. Upload it to EAS with `npx eas-cli credentials -p android` so cloud builds (`npm run build:production`) sign with the same key.

Its SHA-256 fingerprint is published in `web/public/.well-known/assetlinks.json`, which is what lets invite links on `keptapp.pages.dev/join/…` open the app directly.
