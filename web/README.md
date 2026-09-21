# web — the KEPT landing page

One page. The spec, section by section, is [`docs/plans/landing-page.md`](../docs/plans/landing-page.md);
this file covers how to run it and the two or three things about it that are not obvious.

Next.js with `output: 'export'` — static HTML served from Cloudflare Workers Assets. There is no
server. The one piece of live data the page will eventually show comes from the existing Worker
in `backend/`, not from here.

## Run it

```bash
npm install
npm run dev
```

`http://localhost:3000`. `/foundation` is a living reference for the tokens, the type scale and
the motion harness — `noindex`, but part of the build, so it cannot drift out of date.

To serve the real production output through the real Workers Assets runtime:

```bash
npm run preview
```

`http://localhost:8788`. Then, in another terminal, check it against the spec's §9 budget:

```bash
npm run audit
```

That runs Lighthouse throttled-mobile and exits non-zero if any threshold is missed. `npm run
audit -- --desktop` for the desktop profile.

Lighthouse cannot see criteria 4 and 5, so those have their own check:

```bash
npm run check:motion
```

It loads the built page twice with `prefers-reduced-motion` emulated each way, scrolls with real
wheel events, and asserts what actually moved — then tabs through and checks the focus order and
rings. Run both after any section lands.

`npm run deploy` is deliberately blocked — see `scripts/deploy-guard.mjs`. No Cloudflare account
is connected to this repo.

## Design tokens are generated, not written

`npm run tokens` imports `mobile/constants/theme.ts` and writes two files:

- `app/tokens.css` — CSS custom properties, light on `:root`, dark on `[data-theme="dark"]`
- `lib/tokens.generated.ts` — the same values, typed, for the few places JavaScript needs one

Both are committed and both carry a "do not edit" banner. `npm run dev` and `npm run build` run
the generator first, so a palette change in the app reaches the site on the next build.

Two things follow from this:

- **Never type a hex into this codebase.** If a colour is missing, add it to the app's theme.
- The app's type scale is in there too, and it **stops at 40px** — it was drawn for a phone.
  The site adds four fluid editorial sizes above it in `app/globals.css` (`--display-1` …
  `--lede`). Use the app's scale for anything card-shaped and the editorial scale for headlines.

Instrument Serif is the one face the app does not have. It is loaded **italic only**, because it
exists for the accent word inside a sans headline (`<em className="serif">`) and nothing else.

## Motion

`lib/motion.ts` is the only door. Every scroll-driven section goes through `useMotionScene`,
which runs its callback inside a `gsap.matchMedia` gated on `(prefers-reduced-motion:
no-preference)`. There is no path in this codebase that animates on scroll for a reader who
asked not to be animated at, and that is structural rather than something each section has to
remember.

The rule it imposes on section authors:

> **Markup must be complete and legible before the animation runs.** Animate from one readable
> state to another. Never from `opacity: 0`, never from a value that hides content.

A section that is blank until GSAP touches it is blank forever with motion off — and blank in
the no-JS snapshot, which §9 also requires to read correctly.

`components/smooth-scroll.tsx` wires Lenis into GSAP's ticker so both run on one rAF loop; two
loops means two ideas of "now" and pinned sections jitter. Under reduced motion it sets up
nothing at all and the browser scrolls natively.

`components/scroll-rail.tsx` is the exception that proves the rule: it does **not** go through
the harness, because a progress indicator that stops indicating is just broken. It writes a
custom property once per frame and lets CSS composite it.
