# KEPT — the product film

A ~52-second motion-graphics film. No footage, no people, no stock anything. Every frame is
drawn by the same components the app and the landing page draw, so the film cannot show a
product that does not exist.

Companion pieces: [launch-film.md](launch-film.md) (scripts), [launch-film-prompts.md](launch-film-prompts.md)
(generated footage), `video/` (the troop film, already built).

---

## 1. The idea

**A year, in fifty seconds.**

The landing page's centrepiece is *scroll is time* — scrolling it lives a year of the habit.
A film is the same idea with the scrollbar removed: time drives itself. That makes this the
one format where KEPT's core mechanic can simply be **shown** rather than described, and the
mechanic is the hard part to explain in a sentence:

> The promise ring fills and **resets** every week. The goal ring never resets.

Everything else in the product follows from that, and no amount of copy lands it the way
twelve seconds of a sawtooth does.

## 2. Why it can be honest

Four things already exist that most product films have to fake:

| Asset | What it gives the film |
|---|---|
| `web/components/rings.tsx` | The real ring geometry, already driveable imperatively at 60fps |
| `web/lib/year.ts` | 52 weeks of internally consistent data — three misses, $980, a 14-week run |
| `web/lib/prices.ts` | Real market data, keyless and CORS-open |
| `web/public/3d/*`, `promise.svg`, the token file | The app's own art and palette |

**The prices should be fetched at render time.** Remotion can `delayRender()` while
`fetchQuotes()` resolves, so every render of this film carries that day's actual numbers and
the chip reads *Live · 22 September*. A product film whose market data is real on the morning
it ships is a genuinely unusual thing to be able to say, and it costs one function call
because `lib/prices.ts` is already written.

## 3. The look

**Ink for the first half, cream for the second.** The film opens dark and alone; the lights
come up the moment other people arrive (scene 4). Both palettes ship — `app/tokens.css` scopes
dark to `[data-theme="dark"]` and the Android widget carries both at exact parity — so this is
using the brand, not inventing a mood. It also solves the practical problem: the rings glow on
ink, and the product UI reads better on cream.

**One transition, and it is the brand's own.** Scenes change behind a sweeping ring arc — the
ring wipes the frame. No fades, no slides, no light leaks. A film with one signature transition
looks authored; a film with five looks like a template.

**Three animation moves, used everywhere:**

1. **Arc draw** — anything circular, always the same easing.
2. **Rise and settle** — every text and card entrance. Spring, `damping: 200`, no bounce, 4-frame stagger between siblings.
3. **Count** — numbers always count up. A number that cuts to its final value reads as a slide.

Bounce appears exactly once, on the week-52 total. It is a reward, not a default.

**Type** — Sora for everything, Instrument Serif italic for the accent word, same as everywhere
else. Numbers are tabular.

## 4. The film

| # | Time | On screen | Copy |
|---|---|---|---|
| 1 | 0:00–0:05 | Ink. A single kiwi arc draws from 12 o'clock and closes. `$20` counts up beside it. | A promise. Twenty dollars, every week. |
| 2 | 0:05–0:14 | The promise ring fills and snaps empty, four times, accelerating. A bar drops into a strip below for each kept week. Week counter ticks. | Keep it, and the ring closes. |
| 3 | **0:14–0:22** | **Week 6.** The ring fills to 45% and stops dead. Everything holds — no motion anywhere for a full second. Then the ring empties. The strip keeps its five green bars and gains one coral. | Miss one, and the ring resets. → *The money doesn't.* |
| 4 | 0:22–0:30 | Three small ring glyphs slide in around the hero ring. Two close. One doesn't. The `bell` object pops; the third closes. **Palette lifts to cream here.** | Four people see the ring close. |
| 5 | 0:30–0:40 | Hard acceleration. Weeks 7→52. Goal ring climbs and never drops. The 52-bar strip fills left to right, three coral bars among them. Running total counts to `$980`. | *(counter only, then)* 52 promises · 49 kept · $980 in |
| 6 | 0:40–0:47 | The total resolves into six asset rows, staggered in, **live prices**. Chip: `Live · <today>`. | Tokenised equities and private-market names. Settled on Solana, from your own wallet. |
| 7 | 0:47–0:52 | One card. Three rows fly out; the ring grows into the space they leave. | Your circle sees the ring. Not the number. |
| 8 | 0:52–0:58 | Rings contract into the promise mark, mark resolves to the wordmark. | Promises *compound.* · keptapp.pages.dev |

**Scene 3 is the film.** Eight seconds, most of it still, on the one idea nobody else in this
category will say out loud. If the edit is running long, cut from scene 5, never from 3.

## 5. Sound

The same score as the rest of the campaign — fifty-two recordings of one ceramic cup set on a
wooden table — and it fits here better than it fits live action, because in this film there is
a literal event to strike on: **every ring closure is a cup.**

- Scenes 1–2: single, dry, spaced.
- Scene 3: the strike that does not come. Silence where week 6 should have landed, held
  uncomfortably long.
- Scenes 4–5: the strikes multiply and interlock until they are a rhythm.
- Scene 8: four pitches together as a chord.

No music bed underneath. The cups are the score.

## 6. Build

Lives in the existing `video/` workspace as a second composition set — the Remotion project,
the `@/` alias into `web/`, the font loading and the three-aspect render script are all built.

**Reused unchanged:** `Rings`, `lightColors`/`darkColors`, `year.ts`, `prices.ts`, the 3D
objects, `promise.svg`, `fonts.ts`, `scripts/render.mjs`.

**New:**

- `src/product/` — one component per scene, eight of them
- `RingWipe` — the transition, driven by the same arc maths as `Rings`
- `Counter` — spring-driven tabular number, used by every figure in the film
- `calculateMetadata` on the composition, to `delayRender` for the price fetch

**Deliverables:** 16:9, 9:16 and 1:1 as before, plus a **30-second cutdown** — scenes 1, 3, 5,
8 only. Scene 3 survives every cut.

## 7. What would make it bad

Worth writing down, because these are the defaults:

- **A different transition per scene.** One wipe, everywhere.
- **Everything arriving at once.** Stagger siblings by 4 frames, always.
- **Numbers that cut instead of count.**
- **Linear interpolation.** Spring or eased, never `ease: 'none'` on anything a viewer looks at.
- **Filling scene 5 with more information because there is time.** The acceleration is the
  content; adding labels to it makes it a dashboard.
- **Softening scene 3.** The silence is the point and it will feel too long in the edit. It is
  not too long.
