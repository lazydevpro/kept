# TODO

Spec: [docs/design/kept-design-system.md](docs/design/kept-design-system.md)

## Done — KEPT UI rebuild #design

- [x] Design tokens: KEPT palette (light-first), Sora + Inter type scale, spacing/radii/shadow #design
- [x] Level 1 + Level 2 icon set as custom SVG, Ionicons retired from the product surface #design
- [x] Level 3 3D object registry over the bundled Fluent assets #design
- [x] 2D flat SVG illustrations for empty states, the invite screen and the circle #design
- [x] UI primitives: Screen, Card, Button, Chip, Stat, ListRow, Sheet, SectionHeader #design
- [x] Rings rebuilt to Apple Fitness quality; one SVG implementation for native and web #design
- [x] Week, Circle, Goal, Invest, Awards, Onboarding, Join screens #screens
- [x] Invest risk copy moved out of the shelf and into a disclosure sheet #screens
- [x] Floating tab bar #screens
- [x] User-facing rename Neon Reserve → KEPT #brand
- [x] Typecheck, lint, and a screen-by-screen visual pass in light and dark #verify

- [x] App icon, adaptive icons, favicon and splash in the KEPT identity, generated from
      vector sources by `mobile/scripts/build-brand-assets.py` #brand

## Done — private portfolio #portfolio

- [x] Migration 0006: `verified_amount_base_units` + `asset_decimals` on contributions,
      both filled by the verification job from the confirmed transaction #backend
- [x] `GET /v1/portfolio` — holdings, cost basis, live value and P&L, owner-only #backend
- [x] Jupiter Price v3 lookup, mainnet + API key only; degrades to cost basis otherwise #backend
- [x] Portfolio screen, reachable from the Week money tile and the Invest shelf #screens
- [x] Sandbox rehearsals reported separately and excluded from holdings #backend

## Done — notifications & reminders #notifications

- [x] Reminder fired on every nightly cron run: the window is two days wide and the cron is
      daily, so each week's nudge went out twice. Migration 0008 adds `weekly_promises.reminded_at`;
      covered by a regression test #backend
- [x] `sendPush` batched to 100 per request — Expo rejects more, so >100 tokens failed outright #backend
- [x] Dead tokens now disabled: Expo returns 200 with per-ticket errors, so `DeviceNotRegistered`
      devices were retried forever. Ticket statuses are read and those tokens set `enabled = 0` #backend
- [x] Reminder fan-out split at 500 users per queued message #backend
- [x] `enablePushNotifications` returns why it failed instead of a bare boolean, so a build that
      cannot do push no longer tells the user they declined #mobile

## Done — market data #markets

- [x] Public markets showed "Soon" forever: the xStocks catalog is paginated (100 a page,
      ~930 total) and the backend read only page 0. SPYx, QQQx and TSLAx are all on later
      pages, so they looked permanently unavailable #backend
- [x] Catalog pages now fetched in parallel batches and cached in-isolate for an hour —
      upstream is ~2.5s a page, so ten sequential fetches blew the request timeout #backend
- [x] `GET /v1/trades/catalog` — the full universe, searchable, paginated, with live prices.
      No wallet required; only the page being viewed is priced #backend
- [x] Live prices on the Invest shelf and a "Browse all markets" screen with search #screens
- [x] Shared `lib/prices.ts` so the portfolio and the catalog quote identically #backend
- [x] `search` icon added to the Level 1 set #design
- [x] Catalog leads with 34 recognisable tickers instead of opening on Airtel Africa and
      Alcoa; while searching, relevance (exact symbol → prefix → contains) outranks that list #backend
- [x] Browse list is infinite-scroll — `Screen` gained `onEndReached` and the catalog uses
      `useInfiniteQuery`, so pages append instead of asking for a Next button #screens
- [x] `Chip` gained `iconSide`, matching `Button`, so forward arrows trail the label #design

## Done — buying from the catalogue, and real asset artwork #markets

- [x] Tapping an asset in Browse all did nothing. The buy flow lived inside the Invest
      screen, wired to that screen's own `selected` state, so catalogue rows had nothing
      to open. Extracted to `features/trade/purchase-sheet.tsx`; both screens now open the
      same review, risk acknowledgement and confirmation #screens
- [x] `useWalletLink` extracted alongside it — connect and verify were about to be written
      twice, once per screen #mobile
- [x] The sheet resets its quote and its Tessera acknowledgement when the asset changes, so
      a stale route or a stale tick cannot carry across to the next asset #mobile
- [x] Real logos everywhere. `InvestableAsset.logo` had been returned by the API all along
      and simply never rendered — every screen drew initials over the top of it. New
      `AssetLogo` renders xStocks' PNGs, routes Tessera's SVGs through `SvgUri` (`<Image>`
      cannot decode SVG on native), and falls back to the initials plate #design
- [x] Tessera's assets gained their icon URLs, taken from Jupiter's token record #backend
- [x] Private markets is no longer a hardcoded pair. Tessera **does** publish a catalogue —
      `rest-api.tessera.pe/v1/public/token-details` — the earlier check looked at
      `api.tesseralab.co`, which is the lab's corporate site, not the product API. Reading
      the real one added T-SpaceX; the two original mints stay as an offline fallback so the
      lane degrades instead of emptying #backend
- [x] The three T-Tokens lead `FEATURED`. Alphabetically they landed ~800 rows into a
      931-asset list despite being the most recognisable names in it #backend
- [x] Portfolio positions carry artwork too. The portfolio only stores a mint, so it asks
      Jupiter for icons by mint (`lib/tokens.ts`) rather than making a cold portfolio read
      pay for a ten-page catalogue walk #backend
- [x] The portfolio was **not** using the shared `lib/prices.ts` despite the note above
      claiming it did — it had its own copy, which put every mint in one URL with no
      chunking. Now on `fetchQuotes` with the rest #backend

## Done — the buy ticket #trade

- [x] The review sheet was a summary of the promise — "Weekly promise $25", "Circle sees
      progress only" — none of which is what anyone weighs up before spending money. It is
      now a small terminal: price, movement across 5m/1h/6h/24h, a typed amount, and a live
      quote showing what that amount buys and what each unit really costs #screens
- [x] The amount is free, $1–$10,000, with presets. It was pinned at $25 in the client even
      though the server has always accepted a range — the weekly promise is a habit, not a
      price list #screens
- [x] `GET /v1/trades/asset` — price, four change windows, liquidity, 24h volume, holders,
      decimals. Catalog answers for identity and structure, Jupiter for the market #backend
- [x] `GET /v1/trades/quote` — a preview that persists nothing and needs no wallet, so an
      amount can be priced while someone is still deciding whether to connect one. `/order`
      required a verified wallet, which made it useless for trying numbers #backend
- [x] `Sheet` gained `leading` and `footer`, a height cap, a scrollable body and keyboard
      avoidance. The ticket is far taller than the confirmations it was built for, and the
      button that spends the money must never scroll away #design
- [x] Tessera's risk acknowledgement rides in the pinned footer — below the fold it left the
      button asking for something the reader could not see #screens
- [x] `minWidth: 0` on the amount field: react-native-web gives `<input>` an intrinsic width
      flex will not shrink, which pushed the "USDC" suffix out of the field #design
- [x] `DetailTable` retired — the old sheet was its only caller #cleanup

## Done — social audit #social

- [x] The circle roster labelled **the wrong person "You"**. Members come back ordered by
      join date and the row keyed the badge off `index === 0`, so it marked whoever founded
      the circle — right for the founder, wrong for everyone they ever invite. Now keyed off
      the signed-in profile id #screens
- [x] A friend's goal ring could overstate them. The target was read from their newest
      active goal while the completed count summed promises across *every* active goal, and
      nothing stops a user keeping two. Reproduced at 83% where the truth was 25%; both
      halves now hang off the same goal #backend
- [x] The share sheet still offered to share a "Neon Reserve" circle — the one piece of copy
      that leaves the app and lands in someone else's messages #mobile
- [x] Regression test for the invariant the product rests on: a non-member gets 403 on a
      circle, its feed and its live-room ticket, and the circle never appears in their list #verify

Verified working end to end: invite create → preview → accept (idempotent for an existing
member, 404 for a bogus or spent token), the join screen, reactions (422 on an unknown
emoji, 404 on an unknown post, 403 from outside the circle), and the Durable Object live
room — a reaction posted over HTTP arrives on the socket as `reaction.added`.

## Done — awards beyond the streak #awards

- [x] Awards were derived from one number, the week streak, so the only way to earn anything
      was to never miss. That rewards whoever was already consistent and says nothing about
      building the habit *with* people, which is the part of this product that is novel #screens
- [x] `GET /v1/awards` — four counters: week streak, friends, nudges sent, perfect months.
      The streak walk is the same one the Week screen uses, and both endpoints were checked
      to agree rather than assumed to #backend
- [x] Perfect months: a finished calendar month with at least one promise due and none
      missed. Deliberately not the streak — a streak ends for good, a month can be perfect
      again after a bad one. In-progress months are excluded so a good first week cannot
      hand out the award early. Cross-checked against the raw promise rows #backend
- [x] Nudges are a real action, not just a counter: `POST /v1/circles/:id/members/:id/nudge`,
      migration 0009. One per person per week (the UNIQUE key is the rate limit), only into
      an open promise, only inside the circle, never at yourself. Posts to the feed and sends
      a best-effort push, so a nudge still lands for someone with notifications off #backend
- [x] Six new awards across three groups — Together (1, 3 friends), Encouragement (1, 10
      nudges), Whole months (1, 3 perfect months) — and the collection is grouped by what
      each one recognises rather than shown as one ladder of six week-badges #design
- [x] The header no longer claims "Latest award": nothing records when an award was earned,
      and across four metrics the last in the list is not the newest #design
- [x] The nudge button only appears on a member who is not you and whose week is still open,
      so the row never offers a dead action. `IconButton` gained `disabled` #screens
- [x] Regression test drives the whole path — real invite, real goal and promise, then the
      rate limit, the self-nudge refusal and the award counters #verify

## Now — blocked on hardware or accounts I do not have

- [ ] Push is OFF in local builds: `extra.eas.projectId` is missing from app.json, so
      `getExpoPushTokenAsync` cannot run. EAS builds get it injected; local ones need
      `npx eas init`. Needs the project owner's EAS account #notifications
- [ ] End-to-end reminder delivery is unverified — it needs a real device, an EAS project id
      and `EXPO_ACCESS_TOKEN` on the Worker. Everything up to the Expo API call is tested #verify

- [ ] Verify on a real Android device / Solana Seeker — everything so far was checked on the
      Expo web build. There is no Android SDK on this machine (no `ANDROID_HOME`, no
      `local.properties`, no platform-tools), so the widget rewrite below is **unverified by
      compilation**: its XML is well-formed and every `@color`/`@string`/`R.color` reference
      resolves, but nothing has built it. The adaptive icon and splash have only been checked
      in a simulated launcher mask #verify

- [x] Backfill for pre-0006 holdings: migration 0007 adds `holdings_checked_at`, the daily
      cron queues a bounded batch, and `backfill_holdings` re-reads each transaction from the
      RPC. Rows the RPC can no longer serve are stamped once rather than retried nightly #portfolio
- [x] Widget summary separates live money from devnet rehearsals. `monthUsd`/`recentUsd` are
      live only; `rehearsedMonthUsd`/`rehearsedRecentUsd` are reported alongside. The Week
      tile relabels itself to "Rehearsed this month" when there is no live spend #backend

## Done — clearing the backlog #cleanup

- [x] Reactions toggle. `DELETE /v1/circles/:id/posts/:id/reactions` takes back only your
      own; the chip renders yours as pressed so a second tap is obviously an undo. Covered
      by a test #social
- [x] CORS `allowMethods` did not include DELETE, so the new route was refused in any
      browser before it reached the handler. Found by calling it, not by reading it #backend
- [x] Encouragement shows the feed, capped at 10, instead of only the newest post #screens
- [x] Circles are named on create instead of everyone getting "Slow Money Club", and a
      switcher appears once there is more than one — previously a second circle was created
      silently and then unreachable, because the screen only ever opened `circles[0]` #screens
- [x] Android widget rebuilt in the KEPT identity: `values/colors.xml` +
      `values-night/colors.xml` mirroring the theme tokens, a light card with the app's 24dp
      radius and hairline, "KEPT" in kiwi, and the rings redrawn with the app's own
      geometry, per-ring tinted tracks and gradients. The old widget also drew goal and
      circle **the wrong way round**, so the same week looked different in the two places #widget
- [x] Retired the unused Solana-template scaffolding — all of `features/account/*`, the
      `network-feature-*` screens and `constants/app-styles.ts`. 15 files; `network-provider`
      and `use-network` stay, they are load-bearing #cleanup
- [x] Wire identifiers decided. The `neonreserve:v1:` memo prefix is now `kept:v1:` — safe,
      because verification compares the on-chain memo against the `verification_reference`
      stored on the row, never against a literal, so rows written under the old prefix keep
      verifying. The URL scheme, Android package and Cloudflare resource names stay: they
      identify installs and a live D1 holding real rows, so changing them is a coordinated
      deploy-and-migrate, not a code change. Do it at a real release #brand
- [x] Web auth: the concern was that the session token sat in `localStorage`. It does not —
      checked the live page and the only keys are `kept:theme` and the onboarding flags. The
      session is the httpOnly cookie; the `cookie` header `apiRequest` builds is one browsers
      forbid and drop. The shim is now in-memory so a token cannot be left behind even if
      that changes upstream; verified the session survives a full reload #security

## Next

- [ ] Integrate PreStocks, or decide not to — see
      [docs/private-markets.md](docs/private-markets.md). Eight more pre-IPO names and the
      larger bounty, but its mints carry a live `scaledUiAmountConfig` multiplier (1.4861347
      since 17 Jul 2026) that would make our quantity, cost basis and P&L wrong by a third;
      a 1% transfer fee the issuer has already doubled once; and `permanentDelegate`,
      `freezeAuthority` and `pausableConfig` all on one issuer key, which the
      "self-custodial" wallet copy would have to be honest about #markets
