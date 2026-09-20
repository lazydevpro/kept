# KEPT brand

> **Superseded.** The old Neon Reserve system (cool blue-black surfaces, mint/electric-blue/
> coral rings) was replaced by the KEPT system in the UI rebuild.

The living source of truth is **[../docs/design/kept-design-system.md](../docs/design/kept-design-system.md)**,
and the implementation is:

| Layer | File |
| --- | --- |
| Colour, type, spacing, radii, elevation, motion | `constants/theme.ts` |
| Level 1 + 2 icons (line, duotone plate) | `design/icons.tsx` |
| Level 3 objects (3D) | `design/objects.tsx`, `assets/3d/` |
| 2D illustration scenes | `design/illustrations.tsx` |
| UI primitives | `components/ui.tsx` |
| The rings | `features/progress/rings.tsx` |
| Icon / splash vector sources | `assets/brand/*.svg` |
| Asset generator | `scripts/build-brand-assets.py` |

## The short version

**KEPT** — _Promises compound._ Light-first, warm cream (`#FBFBF4`), kiwi-lime primary
(`#A3E635`), near-black ink. Three brand hues map to the three rings and nothing else:
kiwi = the promise you keep, grape = progress toward your goal, coral = your circle.

Sora carries every heading and number; Inter carries body copy; mono is for addresses only.

One idea per card. Numbers are the headline, words are the caption, and risk copy lives in
a disclosure sheet rather than on the shelf.
