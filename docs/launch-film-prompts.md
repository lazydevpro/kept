# KEPT — generation prompts

Production companion to [launch-film.md](launch-film.md). Veo 3.1 for footage, Remotion for
everything with type in it.

Specs verified against the [Gemini API Veo docs](https://ai.google.dev/gemini-api/docs/veo) and
the [official Veo 3.1 prompting guide](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1),
September 2026.

---

## 1. What Veo makes and what Remotion makes

| Piece | Tool | Why |
|---|---|---|
| Hero film — 28 live-action clips | **Veo 3.1** | People, rooms, weather, a year passing |
| Hero film — week supers, end cards | **Remotion** | Veo cannot render clean type. Nothing in frame is text. |
| Hero film — the ring at 1:20 | **Remotion** | It is our actual `rings.tsx` component. Never let a model imitate the product. |
| Teaser — "The Sound" | **Remotion, entirely** | Black screen, a counter, a wordmark. No footage at all. |
| Product film | **Remotion, entirely** | It is UI. Rendering it from `web/components/rings.tsx` and `web/lib/year.ts` makes the film *be* the product. |
| Cutdowns | **Both** | Re-cut hero clips, re-key type in Remotion per aspect ratio |

**Only the hero film and its cutdowns need generation.** Two of the four pieces are pure code.

---

## 2. Three constraints that changed the plan

**The child is out.** Veo forces `personGeneration: "allow_adult"` whenever reference images
are used, and reference images are the only reliable way to hold a character across 28 clips.
So character **C's granddaughter cannot be generated.** The scene is rewritten: C is alone in
the doorway, and the child is implied by dressing — a small pair of sandals by the door, a
second cup already on the step. It is a better shot anyway; the warmth now comes from her face
instead of from a prop human.

**Eight seconds is the ceiling, and eight is mandatory.** `durationSeconds` must be `"8"` when
using reference images, 1080p or 4K. Every clip is generated at 8s and cut down to the 1–5s it
needs. Extension exists (+7s, up to 20×) but drops you to 720p, so we do not use it.

**The film's own rules are, by luck, exactly what Veo is good at.** No screens, no numbers, no
text in frame — which removes the two things generative video reliably fails at. Locked-off
camera at seated eye height — which is the most stable thing you can ask for. And the single
most important shot in the film, the empty driver's seat, contains no person at all, so it
carries no consistency risk.

---

## 3. Generation settings

```
model:            veo-3.1-generate-preview
durationSeconds:  "8"          // mandatory with referenceImages
resolution:       "1080p"
aspectRatio:      "16:9"       // 9:16 pass for cutdowns, re-framed not cropped
personGeneration: "allow_adult"
referenceImages:  [character, location]   // max 3, character ALWAYS first
```

Order matters — earlier reference images win when elements compete, so the character plate is
always index 0.

Generate each shot **four times** and pick in the edit. Budget for it; it is cheaper than a
reshoot and there is no reshoot.

---

## 4. The style block

Paste this verbatim at the end of **every** hero-film prompt. Consistency comes from never
editing it.

> Shot on 35mm anamorphic film, 2.39:1, visible fine grain and gentle halation in the
> highlights. Locked-off camera on a tripod at seated eye height, no camera movement
> whatsoever. Natural practical light only, motivated by windows, lamps or streetlight. Warm,
> desaturated, slightly muted colour with cream highlights and deep soft shadows. Unhurried,
> observational, documentary stillness. Nobody speaks. No on-screen text, no graphics, no
> visible phone screens. Ambient noise: room tone appropriate to the location. No music.

Two lines in there are load-bearing:

- *"no visible phone screens"* — every character handles a phone, and a Veo-invented UI would
  contradict the product in the one place it matters.
- *"No music"* — the score is fifty-two recordings of a ceramic cup and it is composed in post.
  Veo's native audio is used for room tone only.

---

## 5. Character bible

Locked descriptions. Copy the block into the prompt verbatim every single time — paraphrasing
is how a face drifts.

**A — the nurse**
> A Filipina woman in her late forties, warm brown skin, tired kind eyes with deep laugh
> lines, black hair streaked with grey pulled into a low bun, small silver studs. Wearing
> faded teal hospital scrubs.

**B — the driver**
> A Nigerian man in his mid thirties, dark brown skin, close-cropped hair, a short beard, a
> small scar through his left eyebrow. Wearing a plain olive-green polo shirt.

**C — the grandmother**
> An Indian woman in her early sixties, deep brown skin, silver hair in a single plait over
> one shoulder, reading glasses pushed up on her head, gold hoop earrings. Wearing a soft
> cotton saree in faded ochre.

**D — the picker**
> A white British man in his early twenties, pale freckled skin, ginger hair cut short,
> slight build. Wearing a high-visibility orange work vest over a grey hoodie.

### Reference stills — Gemini 2.5 Flash Image

Three per character, generated **before any video**. Keep lighting and lens identical across
the three so the model is not guessing which variable matters.

For each character, run these with `[CHARACTER]` replaced by the block above:

```
1. Front portrait, head and shoulders, of [CHARACTER]. Neutral expression, looking
   directly into the lens. Even soft frontal light. Plain mid-grey seamless background.
   Shot on 85mm, shallow depth of field. Photographic, natural skin texture, no retouching,
   no makeup, documentary portrait.

2. Three-quarter profile portrait, head and shoulders, of [CHARACTER]. Same neutral
   expression, same soft frontal light, same plain mid-grey seamless background, same 85mm
   lens. Photographic, natural skin texture, documentary portrait.

3. Waist-up shot of [CHARACTER], arms relaxed at their sides, showing the full wardrobe
   clearly. Even soft light, plain mid-grey seamless background, 50mm. Photographic,
   natural fabric texture, documentary portrait.
```

Pick the two strongest per character and reuse those two forever.

---

## 6. Location plates

One reference still per location, used as reference image index 1.

```
L-A  Interior, a small Manila apartment kitchen at first light. Pale blue dawn through a
     window with a security grille. A laminate table, two mismatched mugs, a rice cooker,
     a wall calendar. Empty, no people. Shot on 35mm, locked off, natural light only.

L-B  Interior of a parked sedan at 2am, viewed from the back seat over the empty driver's
     seat. Rain on the windscreen. Orange sodium streetlight and distant city glow. A phone
     mount on the dash, a bottle of water in the door. Empty, no people. Shot on 35mm,
     locked off, practical light only.

L-C  A doorway and concrete step of a house in Kochi during monsoon, seen from inside
     looking out. Heavy rain falling beyond the threshold, wet green foliage, a potted
     plant. A small pair of child's sandals by the door, a steel tumbler on the step.
     Empty, no people. Shot on 35mm, locked off, natural light only.

L-D  A bus shelter on an overcast British ring road at dusk. Scratched perspex, a damp
     metal bench, an unreadable weathered advertising panel. Empty, no people. Shot on
     35mm, locked off, natural light only.
```

---

## 7. Hero film — shot prompts

Every prompt is `[Cinematography] + [Subject] + [Action] + [Context] + [Audio]` followed by
**§4 style block**. Reference images: `[character plate, location plate]`, character first.

The gesture is the same every time and must be worded identically: *sets a cup down, picks up
a phone held below frame so the screen is never visible, and presses once with their thumb.*

### Act I — the promise

**H01 · A · 4s used**
> Medium shot, locked off. [CHARACTER A] sits at a laminate kitchen table in a small Manila
> apartment at first light, still in scrubs after a night shift. She sets a cup down on the
> table, picks up a phone held below frame so the screen is never visible, and presses once
> with her thumb. She exhales slowly and turns her head to look out of the window. Ambient
> noise: a refrigerator hum, distant early traffic, a rooster far away.

**H02 · B · 4s used**
> Medium shot from the back seat, locked off. [CHARACTER B] sits in the driver's seat of a
> parked sedan at 2am, one wrist resting on the steering wheel. He sets a cup down in the
> centre console, picks up a phone held below frame so the screen is never visible, and
> presses once with his thumb. He sits back and looks straight ahead through the rain on the
> windscreen. Ambient noise: steady rain on a car roof, a distant siren, the tick of a
> cooling engine.

**H03 · C · 4s used**
> Medium shot from inside a house looking out, locked off. [CHARACTER C] stands in a doorway
> during monsoon with heavy rain falling beyond the threshold. She sets a steel tumbler down
> on the concrete step, picks up a phone held below frame so the screen is never visible, and
> presses once with her thumb. She smiles faintly to herself and watches the rain. A small
> pair of child's sandals sits by the door. Ambient noise: torrential monsoon rain on leaves
> and a tin roof.

**H04 · D · 4s used**
> Medium shot, locked off. [CHARACTER D] sits alone on a metal bench in a bus shelter on an
> overcast British ring road at dusk, wearing over-ear headphones. He sets a paper cup down
> beside him, picks up a phone held below frame so the screen is never visible, and presses
> once with his thumb. He does not look up. Ambient noise: light rain, a lorry passing on wet
> tarmac, faint tinny music leaking from headphones.

### Act II — the year moves

Eight variants, same four setups, different seasons and light. Reuse H01–H04 wording and swap
only the bracketed variable. This is the whole trick: **change one thing per clip, never two.**

| ID | Base | Change |
|---|---|---|
| **H05** | H01 | *harsh midday sun through the grille, she is in a t-shirt not scrubs, hair loose* |
| **H06** | H02 | *clear dry night, no rain, windows down, warm air* |
| **H07** | H03 | *dry season, bright hard sunlight beyond the doorway, no rain at all* |
| **H08** | H04 | *bright cold winter morning, breath visible, heavy coat over the hi-vis* |
| **H09** | H01 | *evening, warm lamp light, a second mug already on the table, a new potted plant on the sill* |
| **H10** | H02 | *pre-dawn blue light, a paper coffee cup instead of a mug, a new air freshener on the mirror* |
| **H11** | H03 | *early morning, soft grey light, a string of marigolds newly hung in the doorway* |
| **H12** | H04 | *late summer evening, golden low sun, no coat, sleeves rolled* |

### Act II — the miss

**H13 · the empty seat · 6s used — the most important shot in the film**
> Medium shot from the back seat, locked off, no people in the shot at all. The driver's seat
> of a parked sedan is empty at 2am. Heavy rain runs down the windscreen. Orange sodium
> streetlight moves faintly across the wet glass. A cup sits untouched in the centre console.
> Nothing happens and nobody enters the frame. Ambient noise: steady rain on a car roof and
> nothing else.

Generate this eight times. It has to be boring for long enough to be uncomfortable, and that
is a very narrow target.

**H14 · the empty seat again · 4s used**
> As H13, but pre-dawn grey light instead of night, the rain now a fine drizzle, and the cup
> in the console gone. Still completely empty, still nobody in frame.

**H15 · A notices · 5s used**
> Medium close-up, locked off. [CHARACTER A] sits at her kitchen table mid-gesture and stops.
> She is looking at something below frame. Her expression shifts from routine to concern to
> resolve over several seconds. She moves her thumb once, deliberately, slower than before.
> Her face is lit from below by a soft cool light. Ambient noise: refrigerator hum, very quiet
> early morning street.

### Act III — the return

**H16 · B returns · 5s used**
> Medium shot from the back seat, locked off, framed exactly as H02. [CHARACTER B] is back in
> the driver's seat of the parked sedan at night. He sits still for a long moment before he
> moves. Then he sets a cup down in the centre console, picks up a phone held below frame so
> the screen is never visible, and presses once with his thumb. He lets out a breath and
> rubs his face with one hand. Ambient noise: light rain on a car roof, a distant train.

**H17–H24 · the full year**

Eight more, same method as H05–H12. The dressing accumulates — this is what sells a year
passing more than any light change:

| ID | Base | Change |
|---|---|---|
| **H17** | H01 | *a framed photograph now on the wall that was not there before* |
| **H18** | H02 | *a child's drawing taped to the sun visor* |
| **H19** | H03 | *the potted plant by the door is visibly much larger* |
| **H20** | H04 | *a new pair of trainers, a book in his lap* |
| **H21** | H01 | *heavy tropical rain outside, lamp on in daytime, three mugs on the table* |
| **H22** | H02 | *the car is cleaner, a new seat cover, dawn breaking through the windscreen* |
| **H23** | H03 | *festival lights strung along the doorway, warm and small* |
| **H24** | H04 | *first snow on the ring road beyond the shelter* |

### Act IV — fifty-two

Framed identically to H01–H04. Everything in the rooms has changed; the gesture has not.

**H25 · A** — as H01, dawn light, but the kitchen is fuller: more plants, the framed
photograph, a second chair pulled out. She holds the phone a second longer than usual before
setting it down, and smiles very slightly.

**H26 · B** — as H02, night, but the car is clean and the drawing is on the visor. He presses
his thumb once, then sits back and closes his eyes for a moment.

**H27 · C** — as H03, rain, festival lights in the doorway, the plant enormous now. She
presses her thumb once and laughs quietly at nothing.

**H28 · D** — as H04, dusk, no headphones this time. He presses his thumb once and then, for
the first time in the film, looks directly up and out of frame.

> Use H28 as the last generated frame in the film. It is the only moment anyone looks up.

---

## 8. Cutdowns

Re-cut from the same 28 clips. Do **not** regenerate for 9:16 — reframe in Remotion. A second
generation pass will not match the first, and the mismatch reads as two different films.

Generate 9:16 natively only if a vertical cut needs headroom the 16:9 master cannot give. In
that case set `aspectRatio: "9:16"` and regenerate **that character's entire set** so the look
stays internally consistent within the cut.

---

## 9. What Remotion does

Nothing Veo produces contains a single character of text. All of it is composited in Remotion,
at 2.39:1 over the graded footage:

- **Week supers** — `WEEK 01`, `WEEK 19`, `WEEK 52`. Sora ExtraBold, cream at 70%,
  bottom-left, fading in and out over ~1s.
- **End cards** — "Fifty-two promises. / Forty-nine kept." then the wordmark. Three beats.
- **The ring at 1:20** — the real `<Rings>` component from `web/components/rings.tsx`, driven
  by `frameAt(52)` from `web/lib/year.ts`, shot as a macro insert on a black field. The one
  moment the film shows the product, it shows the actual product.
- **The teaser, entirely** — black, a counter, the stall at 19, the wordmark.
- **The product film, entirely** — the rings, the buy ticket, the 52-week scrub, the privacy
  flip, all rendered from the same components the landing page uses.

Import the tokens from `web/lib/tokens.generated.ts` so the film's cream and ink are the app's
cream and ink to the hex.

---

## 10. Where this will go wrong

Worth knowing before you burn credits.

1. **Faces drift on long clips.** Cut away before second six. We only need 4–6s of each 8s
   generation, so build the edit around early frames.
2. **Hands are still the weak point**, and this film is entirely a film about a hand doing a
   small thing. Expect to discard more takes for hands than for faces. Shoot the gesture
   slightly wider than feels right so a bad hand is a small bad hand.
3. **"Locked off" is a request, not a guarantee.** Veo drifts toward slow push-ins. Stabilise
   in post and accept a small crop.
4. **Colour will not match across clips** even from identical references. A grade pass is not
   optional — match to H01 as the reference.
5. **The empty-seat shot may generate a person anyway.** "No people in the shot at all" is
   phrased positively as the guide advises, but it still fights the model's instinct to fill a
   driver's seat. If it keeps failing, generate the plate as a still with Gemini image
   generation and animate rain over it in Remotion instead. The shot has no motion in it
   except weather, so this fallback costs nothing.
