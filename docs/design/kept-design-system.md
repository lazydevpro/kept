# KEPT — Design System

> **KEPT** · _Promises compound._
> A private social investing habit app. You make one small weekly promise, you keep it,
> and a handful of people you trust see that you kept it — never how much.

This document is the source of truth for the visual language. If it and the code disagree,
the code is wrong.

| Layer | File |
| --- | --- |
| Colour, type, spacing, radii, elevation, motion | `mobile/constants/theme.ts` |
| Level 1 + 2 icons | `mobile/design/icons.tsx` |
| Level 3 objects | `mobile/design/objects.tsx` + `mobile/assets/3d/` |
| 2D illustration scenes | `mobile/design/illustrations.tsx` |
| UI primitives | `mobile/components/ui.tsx` |
| The rings | `mobile/features/progress/rings.tsx` |

---

## 1. Why the UI was rebuilt

The previous interface failed in three specific ways:

| Problem | Symptom | Fix |
| --- | --- | --- |
| Text as the primary medium | Every card carried a title, a subtitle, a caption and a disclaimer. Six paragraphs on one screen. | One idea per card. Numbers and imagery carry the meaning; prose is a caption, never the subject. |
| Generic iconography | Stock Ionicons in grey circles, identical at every level of importance. | Three deliberate icon levels (line / duotone / 3D object) with different jobs. |
| No visual identity | Blue-grey dark surfaces, four unrelated accent hues, nothing memorable. | One signature element (the rings), one dominant hue (kiwi), colour used as meaning. |

## 2. Brand

**Name** — KEPT. Always uppercase in the wordmark, sentence case in prose.

**Tagline** — _Promises compound._ Double meaning is the point: habits compound, and so
does the money. Store subtitle: _Invest a little every week, with people who notice._

**Voice** — Warm, plain, short. No hype, no "unlock your financial future". The app is
calm about money and playful about the habit. Never celebrate portfolio size; only
celebrate showing up.

## 3. The mark

A **pinky promise**, large, with a small kiwi ring floating just above the interlock. The
literal gesture the product is named after: two people, one promise, nothing written down.
Line art in `mobile/assets/brand/promise.svg`.

**The ring replaces the sparkles.** The supplied artwork has three sparkle marks above the
interlocked pinkies; the mark drops them and puts the ring in their place. The ring *is* the
spark. Keeping both put two competing accents in the same small area. The source file is
left untouched — `glyph()` takes a `sparks` flag and the mark passes `False`.

**One gradient paints the whole lockup**, via a mask over a full-canvas rect. Filling each
shape with `url(#lit)` instead gives every path its own gradient box, so the ring and the
hands each restart the ramp and the light doesn't agree between them.

**The splash uses a darker ramp** than the icon. It has no ink field behind it and a single
image has to sit on cream in light mode and ink in dark; the icon ramp's light end has almost
no contrast against cream.

**The lockup is a stack** — ring, gap, hands — centred as a whole. Centring the hands alone
leaves the mark sitting low, which is invisible on a square icon and obvious inside a
circular launcher mask.

**The artwork's bounds are measured, not estimated.** `PROMISE_BBOX` is the `getBBox()` of
the hands path alone: `13.87, 48.05, 322.61, 191.02`. An earlier hand-estimated top of `30`
was the *sparkle* top, and since the sparkles aren't drawn it padded ~18 units of phantom
space above the hands and threw the whole stack off centre. If the artwork is ever replaced,
re-measure rather than eyeball.

The line art is dilated by stroking each filled path in its own fill colour. The artwork is
fills rather than strokes, so weight cannot be added any other way, and it needs weight to
survive at launcher sizes.

### The ring alone

`WITH_PROMISE = False` in the build script falls back to the plain closed band — a single
thick kiwi circle, lit from the top left by one linear gradient. Worth knowing if the mark
is ever revisited:

- **Lighting a closed band.** For a point at angle *t*, a linear ramp along direction *d*
  evaluates to cos(*t* − *d*) — exactly the per-segment "light from one side" cosine, but
  smooth. Drawing it as ~72 tinted arc segments produced visible radial banding at 1024px.
  The in-app rings *do* have to segment, because their colour is keyed to **progress** rather
  than to a light source (§8). The mark has no progress to show.
- **The lap, rejected.** The band once ran 388° to pass over its own tail. At a fixed radius
  an overlap cannot read as a crossing — the head sat on the band as a lump and the mark read
  as two shapes. Cutting a gap around the head detached it into a floating pill.
- **The notch, rejected.** Opening the band removed the lump but cost the closed silhouette.
  It did teach one thing: round caps reach half the band width past each arc endpoint, so
  below about 28° the two caps *overlap* and the notch collapses into a pinched dent.

Sources live in `mobile/assets/brand/*.svg` and rasterise via
`python3 scripts/build-brand-assets.py` (needs `rsvg-convert`). Nothing is hand-edited in
the PNGs — change the script, re-run it.

| Asset | Notes |
| --- | --- |
| `icon.png` 1024 | Full-bleed ink field; iOS applies its own corner mask |
| `android-icon-{background,foreground}.png` | Ink field + mark inside the 66% safe zone, with margin |
| `android-icon-monochrome.png` | The same geometry in white — the launcher tints this layer flat, which the mark already is |
| `splash-icon.png` | Mark only, transparent. One asset works on the cream and the ink splash background |
| `favicon.png` 48 | The icon, rasterised small |

No type is baked into any asset. At Expo's ~220pt splash width a wordmark would be too
small to read, and Android 12+ frequently substitutes the app icon anyway.

## 4. Colour

Light is the primary mode. Dark ships as a faithful counterpart, not an afterthought.

### Brand hues

| Token | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `kiwi` | `#A3E635` | `#B8F04A` | The promise ring, primary actions, the brand |
| `kiwiDeep` | `#4D7C0F` | `#84CC16` | Kiwi on light surfaces where contrast must hold |
| `grape` | `#7C5CFF` | `#9B7DFF` | The goal ring, progress toward a target |
| `coral` | `#FF6B4A` | `#FF8566` | The circle ring, people, warmth |
| `sky` | `#38BDF8` | `#56CCFA` | Information, neutral emphasis |
| `sun` | `#FFD447` | `#FFDE6B` | Awards, milestones, celebration |

Three ring hues, three meanings, no overlap. A colour never appears decoratively in a
place where it would imply one of those three meanings.

**The one exception is the Portfolio screen**, where `kiwiDeep` marks a gain and `coralDeep`
a loss. Coral means "circle" everywhere else, but no circle data appears on that screen, and
a loss needs to read as a loss. Do not carry this pairing anywhere a circle is present.

### Surfaces

| Token | Light | Dark |
| --- | --- | --- |
| `background` | `#FBFBF4` warm cream | `#0C0F0A` |
| `surface` | `#FFFFFF` | `#161A12` |
| `surfaceSunken` | `#F3F4EA` | `#10140D` |
| `ink` | `#0B0F0A` | `#F5F7F0` |
| `inkMuted` | `#5A6155` | `#A3AC9A` |
| `inkFaint` | `#8A9283` | `#6F7A66` |

The background is **warm** (`#FBFBF4`), not blue-grey. It is the single change that moves
the app from "fintech dashboard" to "something a person enjoys opening".

### Tint pairs

Every hue has a `*Tint` surface (~8% in light, ~14% in dark) used for icon plates,
illustration blocks and selected states. Never place body text on a tint below 14pt.

## 5. Type

**Sora** for display, headings and numerals — the same face the reference brand uses.
Geometric, slightly quirky, excellent at large sizes.
**Inter** for body and UI labels — invisible, which is the job.
**JetBrains Mono** is retained only for wallet addresses and transaction hashes.

| Role | Face | Size / line | Tracking |
| --- | --- | --- | --- |
| `display` | Sora ExtraBold | 40 / 44 | −1.2 |
| `title` | Sora Bold | 28 / 34 | −0.5 |
| `heading` | Sora SemiBold | 20 / 25 | −0.3 |
| `stat` | Sora Bold | 34 / 36 | −1.4 |
| `body` | Inter Regular | 15 / 22 | 0 |
| `label` | Inter SemiBold | 13 / 17 | −0.1 |
| `caption` | Inter Medium | 12 / 16 | 0 |
| `eyebrow` | Inter Bold | 11 / 13 | +1.2, uppercase |

Numbers are always Sora, never mono. Mono numerals read as "data"; this app's numbers are
achievements.

## 6. Iconography — three levels

Taken directly from the reference's `LEVEL 1 / 2 / 3` system. Each level has one job and
they are never mixed inside a single row.

**Level 1 — line.** 24px, 2px stroke, round caps and joins, drawn on a 24-unit grid.
Navigation, inline affordances, list chevrons. Custom set in `design/icons.tsx`; no
Ionicons anywhere in the product surface.

**Level 2 — duotone plate.** A Level 1 glyph in a hue, on a 44×44 rounded-square plate of
that hue's tint. Section leaders and row avatars. The plate is what gives the UI its
rhythm — it repeats at a fixed size so the eye can scan.

**Level 3 — 3D object.** A rendered, glossy object with a soft cast shadow. Reserved for
moments: the hero of an empty state, an award, a celebration, the one action on a screen.
**At most one per card**, and never two competing to be the same moment — a screen may carry
several only when each owns a distinct section, as the Week screen does (the promise, the
award, the circle). Sourced from Microsoft's Fluent Emoji 3D set (MIT), bundled locally in
`assets/3d/` so the app works offline.

## 7. Illustration

Flat 2D vector scenes, no outlines, built from the brand palette plus skin tones. Shapes
are simple and rounded; characters are stylised with no facial detail beyond the essentials.
They appear only where there is nothing else to show — empty states, onboarding, the
invite screen. An illustration is never decoration next to content that already works.

Authored as inline SVG in `design/illustrations.tsx` so they follow the theme and cost
nothing in bundle size.

## 8. The rings

The signature element, and the thing that must be perfect. Modelled on Apple Fitness:

- Three concentric arcs — **Promise** (kiwi, outer), **Goal** (grape, middle),
  **Circle** (coral, inner).
- The track is the ring's **own hue at low luminance**, not neutral grey. This is what
  makes Apple's rings read as a single object rather than three progress bars.
- Colour advances **around** the dial rather than being fixed in space. SVG has no conic
  gradient, so each arc is drawn as ~6° round-capped segments whose colour is interpolated
  by absolute angle, with a 0.8° overlap so antialiasing never leaves a seam.
- Both gradient stops are **vivid**. A dark first stop makes an 8% ring look muddy, which
  is the most common way these get built wrong.
- Round caps, and the leading cap casts a soft radial shadow onto the track just ahead of
  it. That contact shadow is what sells the overlap once a ring passes 100%.
- Entrance: each arc sweeps over 1.18s with a 70ms stagger and a gentle overshoot. The same
  hook drives step-to-step changes in onboarding. Respects reduce-motion.

One implementation serves native and web — `react-native-svg` renders on both, so the rings
cannot drift between platforms the way the previous Skia + CSS pair did.

## 9. Layout & motion

- **Spacing** on a 4pt grid: `1`=4 `2`=8 `3`=12 `4`=16 `5`=20 `6`=24 `8`=32 `10`=40.
- **Radii**: `sm` 12, `md` 18, `lg` 24, `xl` 32, `pill` 999. Cards are `xl`. Big radii are
  a large part of the reference's warmth.
- **Elevation** is a soft ambient shadow, never a border. Borders only separate rows
  inside a card.
- **Touch targets** are never below 44×44.
- **Motion**: 180ms for state, 320ms for entrance, spring for anything the finger caused.
  Press feedback is `scale: 0.97` plus opacity, on every pressable.

## 10. Copy rules

1. A card has **one** sentence of supporting copy, or none.
2. Risk and legal text lives in a disclosure sheet, not inline on the shelf.
3. Never explain the mechanic twice on the same screen.
4. Numbers are the headline. Words are the caption.
