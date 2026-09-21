# KEPT — the landing page

Status: **spec agreed, not started.** Reference the user brought: [gokiwi.in](https://gokiwi.in).

## 1. Problem

KEPT has no public face. The app explains itself well once you are inside it, but there is
nothing to send someone — a hackathon judge, a friend, a Seeker owner — that makes the idea
land in thirty seconds.

## 2. Audience

One page, two readers, in this order:

1. **A person who might use it.** Wants to feel the idea, not read the architecture.
2. **A hackathon judge.** Wants to know what is real, what is on-chain, and where the code is.

Consumer story carries the page; the technical section sits at §5 and the footer, where it
answers the judge without interrupting anyone else.

## 3. What the reference actually does

Measured, not eyeballed — the page was read in a browser and its DOM and network log inspected.

| Technique | How it is built there |
|---|---|
| Word-by-word manifesto | `EverydayMoreSection`, 2080px tall (2.6vh), one paragraph split into 32 `<span>`s; each gains a `wordActive` class as scroll passes, `#CDD3D6` → `#194965`. Discrete toggles, not interpolation. |
| Pinned hero animation | `ScrollSequenceSection`, 1920px tall, `position: sticky` viewport wrapping a `<canvas>` scrubbing a PNG sequence at `/render/0001.png`…, with a **separate** `/render-mobile/` set. |
| Mixed-typeface headline | Sora + *Flowers of Nineties* italic inside one line — "1.5 million people ***love us***". Used ~6 times; does most of the personality work. |
| Atmosphere | Claymorphic 3D props over two-layer cloud parallax (`clouds-bg.png` + `clouds-fg.png`). |

Nine sections: hero → manifesto → canvas sequence → benefits → 7-card grid → video → social
proof → bank logos → press logos → dark footer. A sticky QR "Get App" card rides the whole page.

**Weakness we should beat:** the page pulled **8.5 MB across 166 images** on first load. Our
budget is **< 1 MB**, and the story is better for it.

## 4. The concept

> **Scroll is time. Scrolling the page is living a year of the habit.**

The reference's hero object is a credit card, so it flies around. KEPT's hero object is *a
promise kept across 52 weeks*, so the scrollbar becomes the calendar. Every section hangs off
that, and it is honest — it is literally what the app does.

This is the difference between a well-made page and one worth submitting anywhere. Sticky
canvas + word reveal + card grid is the current house style; the idea has to be ours.

## 5. Sections

| # | Section | Scroll height | Interaction |
|---|---|---|---|
| 0 | Preloader | — | Pinky-promise mark draws itself (SVG path), ~900ms, skippable, runs once per session |
| 1 | Hero — "Promises ***compound***." | 1.0vh | Three rings draw 0→value on load; cursor-reactive gradient mesh in kiwi/grape/coral; magnetic CTA |
| 2 | Manifesto | 2.6vh pinned | Word reveal, **interpolated** with a soft leading edge rather than class toggles; the three brand words snap to their own hue |
| 3 | **A year in one scroll** ⭐ | 3.5vh pinned | The centerpiece — see §6 |
| 4 | How it works | 1.4vh | Promise → Invest → Circle, drag-scrubbable horizontally; reuses `mobile/assets/3d/` so site and app share art exactly |
| 5 | Real assets, real chain | 1.6vh | Live Jupiter ticker + a working quote calculator (§7) |
| 6 | Privacy | 0.9vh | Toggle swapping one card between *what you see* and *what they see* — balances blur, ring stays |
| 7 | The collection | 1.2vh | The 12 awards unlock as you scroll, each a tactile pop |
| 8 | On your home screen | 1.0vh | Android widget render with a light/dark flip — both colour sets already exist |
| 9 | Footer | 0.8vh | Dark, oversized KEPT wordmark, the promise mark, GitHub |

**Persistent chrome:** floating pill nav; a thin left rail reading "week 14 / 52" that tracks
scroll depth, so the concept is restated every second the reader is on the page.

### Copy

Voice per `docs/design/kept-design-system.md` §10 — warm, plain, short. Numbers headline,
words caption. Never celebrate portfolio size.

**Hero.** "Promises *compound*." / "Invest a little every week, with people who notice."

**Manifesto** (§2, revealed word by word):

> Most investing apps ask what you're worth.
> This one asks whether you **showed up**.
> Twenty dollars a week. A **promise** you made out loud.
> And **four people** who notice when you keep it.

Hue mapping follows the design system: "showed up" and "promise" → kiwi, "four people" → coral.

**Section 6.** "Your circle sees the ring. Not the number."
**Section 7.** "Twelve awards. None of them for being rich."
**Section 9.** "Promises compound."

## 6. The centerpiece (§3)

Pin for 3.5 viewports. Scroll drives a week counter from 1 to 52, and with it:

- the **promise ring** fills and resets each week — the sawtooth is the whole point;
- the **goal ring** creeps up monotonically;
- the **circle ring** pulses when a friend reacts;
- contributions stack into a small area chart underneath;
- overlay cards fade in at the beats.

The beats:

| Week | Card |
|---|---|
| 1 | You promised $20 a week. The ring starts empty. |
| 6 | You missed one. The ring resets. The money doesn't. |
| 13 | A quarter in. Maya noticed. |
| 26 | Halfway — $520 invested, across six names. |
| 40 | Your longest run yet: fourteen weeks. |
| 52 | Fifty-two promises. Forty-nine kept. Nobody ever saw your balance. |

**Why this beats the reference's canvas:** same pinned-scrub feeling, but built from **SVG +
`requestAnimationFrame` driven by one simulated dataset** — so the numbers are internally
consistent, the payload is ~0 KB, it stays sharp at any DPI, and it resizes. The reference
spends 8.5 MB to rotate a card; this tells the entire product story for nothing.

Ring geometry is ported from the app's ring component so the site and the product draw the
same arcs — not re-derived by eye.

## 7. Live data — backend work required

The interactive quote is the strongest proof in the page: type `$25`, see the real SPYx you
would receive, priced through Jupiter.

**This does not work against the API as it stands.** `backend/src/app.ts:59` mounts
`app.use("/v1/*", authenticated)` above `app.route("/v1/trades", …)`, so `/v1/trades/quote`
and `/v1/trades/asset` require a session — even though neither handler reads `userId`.

Fix: mount a **public, unauthenticated read group above that middleware**, reusing the same
helpers:

- `GET /public/prices?symbols=…` → thin wrapper over the existing catalog quote path
- `GET /public/quote?outputMint=…&amountUsdc=…` → the existing keyless Jupiter quote

Both write nothing and touch no user row. CORS currently allows a single `APP_ORIGIN`
(`backend/src/app.ts:29-37`); the site origin has to be added. Rate-limit the public group
separately — it is the only unauthenticated surface on the Worker.

Rejected alternative: having the marketing page open an anonymous Better Auth session. It sets
cookies on every visitor, is worse for privacy, and a static page should not need one.

## 8. Technical design

**Workspace.** New `web/` beside `mobile/` and `backend/`. Next.js, `output: 'export'`, served
from Cloudflare Workers Assets on the same account as the Worker. No server cost.

**Motion.** GSAP ScrollTrigger for pinning, Lenis for smoothing. ScrollTrigger handles pin
spacing and scrub correctly; hand-rolled scroll listeners do not.

**Tokens.** Ported from `mobile/constants/theme.ts` into CSS custom properties — one generated
file, not hand-copied hexes, so the site cannot drift from the app.

**Type.** Sora (display) and Inter (body) as in the app, plus **Instrument Serif italic** as a
web-only editorial face for the mixed-typeface headlines. This is the reference's single best
trick and the app has no serif. Web only — `docs/design/kept-design-system.md` §5 is unchanged,
because the app has no editorial moments to spend it on.

**Art.** The 20 3D objects in `mobile/assets/3d/` are reused directly, so the page and the
product are visibly the same thing. No new illustration commissioned.

## 9. Acceptance criteria

Testable, and all of them gate "done":

1. **Weight** — < 1 MB transferred on first load at 1440px, images included.
2. **Lighthouse** — ≥ 95 Performance, 100 Accessibility, on a throttled mobile run.
3. **Frame rate** — no scroll section drops below 55fps in a DevTools performance trace on a
   mid-tier laptop. Transforms and opacity only; no layout thrash.
4. **Reduced motion** — with `prefers-reduced-motion: reduce`, every pinned section collapses
   to a static, fully legible block. No content is reachable only by animating.
5. **Keyboard** — the whole page is navigable, focus is always visible, and no scroll-driven
   section traps focus.
6. **No-JS** — headings, copy and links render and read correctly with JavaScript disabled.
7. **Live section degrades** — if the public API is unreachable, §5 shows the last-known
   figures with a plain "prices unavailable" note, never a spinner or an error.
8. **Honest** — no claim on the page that the product does not do. Anything simulated is
   labelled as an illustration.

## 10. Phases

Each is independently verifiable.

1. **Foundation** — `web/` workspace, static export, generated token file, fonts, Lenis +
   ScrollTrigger, reduced-motion harness, deploy. *Verify: empty page deploys, Lighthouse 100.*
2. **The spine** — hero, manifesto, footer. *Verify: word reveal scrubs at 60fps; reduced
   motion shows a static paragraph.*
3. **The centerpiece** — §3. *Verify: 52 weeks scrub cleanly; the numbers reconcile; arcs match
   the app's ring component.*
4. **Product sections** — §4, §6, §7, §8.
5. **Live data** — public route group, CORS, rate limit, then §5. *Verify: a real quote returns
   against the deployed Worker; the offline path renders.*
6. **Polish** — preloader, magnetic cursor, OG image, meta. *Verify: the full acceptance list.*

## 11. Non-goals

- No email capture or waitlist — there is nothing to mail yet.
- No analytics, no third-party tags. The reference loads eleven; that is most of its weight and
  all of its privacy cost.
- No blog, no help centre, no multi-page site. One page.
- The app's design system is not changed. The serif is a web-only addition.
