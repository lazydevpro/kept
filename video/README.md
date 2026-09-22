# video — the films

Two films in one Remotion project.

|                      | What                                         | Plan                                                 |
| -------------------- | -------------------------------------------- | ---------------------------------------------------- |
| **The product film** | ~58s, pure motion graphics, live market data | [`../docs/product-film.md`](../docs/product-film.md) |
| **The troop film**   | ~28s, cut from one generated clip            | [`../docs/launch-film.md`](../docs/launch-film.md)   |

The product film is the launch asset — it explains the mechanic. The troop film is social
marketing: a parable with a punchline that shows no product until its last seven seconds.

## Run it

```bash
npm install
npm run dev              # Remotion Studio
npm run render           # everything → out/
npm run render Product   # one composition
```

| Composition                                     | Output                                         |
| ----------------------------------------------- | ---------------------------------------------- |
| `Product` / `ProductVertical` / `ProductSquare` | `out/kept-product-{16x9,9x16,1x1}.mp4`         |
| `ProductShort`                                  | `out/kept-product-30s.mp4` — scenes 1, 3, 5, 8 |
| `Launch` / `LaunchVertical` / `LaunchSquare`    | `out/kept-troop-{16x9,9x16,1x1}.mp4`           |

Alternate aspects are not crops. Each is the same component laid out at a different frame
size, so type rescales and content re-centres instead of being sliced.

## The product film

Everything on screen is the product. `<Rings>` is the real component from
`web/components/rings.tsx`, aliased through `remotion.config.ts`; every figure comes from
`web/lib/year.ts`; the palette is the generated token file. Nothing is a mock-up.

**Prices are fetched at render time.** `calculateProductMetadata` awaits `fetchQuotes()` from
`web/lib/prices.ts`, so each render carries that morning's real market data and the chip reads
`Live · 22 September`. `fetchQuotes` never rejects — it falls back to captured prices and flags
them stale — so a flaky network degrades the label rather than failing the render.

**Scene 3 is the film.** Week 6, eight seconds, most of them still: the ring climbs to 45%,
stops dead for a full second, then empties — while the bar strip keeps its five green bars.
_Miss one, and the ring resets. The money doesn't._ If the edit runs long, take it from
`year`. Never from here. It is the one scene in `CUTDOWN`.

**The look.** Ink for the first half, cream from partway through scene 4 — the lights come up
when other people arrive. One transition in the whole film, a ring arc sweeping the frame.
Three animation moves: arc draw, rise-and-settle, count. Bounce happens exactly once, on the
week-52 total.

### Things that cost time here

- **Rings take props, not `set()`.** The imperative API exists for the website, where scroll
  outruns React. Remotion re-renders every frame anyway, and calling `set()` during render
  mutates the DOM only for React to reconcile it straight back — the rings draw empty on every
  frame. See the note at the top of `src/product/scenes.tsx`.
- **`<Rings mode>` was added for this film.** The component hardcoded `lightColors`, so on ink
  the three tracks rendered as pale tints and read as _full_ rather than empty. The app has
  always shipped a dark track set; the site is light-only so it never surfaced. `mode` defaults
  to light, so nothing on the site changed.
- **Neither type nor ring size can be a flat fraction of `width`.** Portrait needs a bigger
  share of a narrower frame. See `useScale` and `useRingPx` in `src/product/kit.tsx`.

Retiming is `src/product/film.ts` — scene durations, the cutdown list, and where the palette
lifts. No component needs touching.

## The troop film

Generated footage carries the gag; Remotion carries every word and the product. The copy stays
deadpan — epic primate cinema, flat captions about a twenty-dollar weekly habit. The contrast
is the joke, and it is the only version where clicking through does not find a product that
contradicts the ad. Nothing says ape. Nothing winks.

The ending is not a joke: two pinkies hooking, which is literally KEPT's mark. The last seven
seconds dissolve live pinkies → `promise.svg` → the three rings.

Everything is in `src/edit.ts`: shot in/out points, speeds, captions, timings.

### Things that cost time here

- **Scene-detect boundaries are not the beats.** The stick breaks at 2.500s and the fists go up
  at 7.200s, both _mid-shot_. An earlier cut trusted the detector and put both punchlines on
  the wrong picture.
- **`trimBefore` and `trimAfter` do not measure the same thing.** `trimBefore` is a source
  frame; `trimAfter` caps composition frames. With `playbackRate` below 1 the obvious values
  leave a black tail on every shot. See the note above `ShotClip`.

The Gemini watermark is left in deliberately. A top-anchored 2.39:1 crop would remove it at the
cost of 185 rows from a 720p source; the resolution is worth more.

## Sound

Both films use placeholder audio — the troop film runs its source ambience underneath, and the
product film is silent.

The score in [`../docs/launch-film.md`](../docs/launch-film.md) §2 replaces both: fifty-two
recordings of one ceramic cup on a wooden table. It fits the product film best, because there
every ring closure is a literal event to strike on — and week 6 becomes the strike that does
not come.
