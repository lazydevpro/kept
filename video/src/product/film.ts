/**
 * The product film, as data. See ../../../docs/product-film.md.
 *
 * Eight scenes, ~58 seconds at 24fps. Durations live here so the edit can be retimed without
 * touching a component, and so the 30-second cutdown can be assembled from the same list.
 */

export const FPS = 24

export type SceneId =
  'promise' | 'sawtooth' | 'miss' | 'circle' | 'year' | 'assets' | 'privacy' | 'close'

export type Scene = { id: SceneId; seconds: number }

export const SCENES: Scene[] = [
  { id: 'promise', seconds: 5 },
  { id: 'sawtooth', seconds: 9 },
  // Eight seconds, most of it still. If the edit runs long, take it from `year`, never here.
  { id: 'miss', seconds: 8 },
  { id: 'circle', seconds: 8 },
  { id: 'year', seconds: 10 },
  { id: 'assets', seconds: 7 },
  { id: 'privacy', seconds: 5 },
  { id: 'close', seconds: 6 },
]

/** Scenes 1, 3, 5 and 8 — the short cut. `miss` survives every version of this film. */
export const CUTDOWN: SceneId[] = ['promise', 'miss', 'year', 'close']

export const frames = (scene: Scene) => Math.round(scene.seconds * FPS)

export function layout(scenes: Scene[]) {
  const offsets: number[] = []
  let total = 0
  for (const scene of scenes) {
    offsets.push(total)
    total += frames(scene)
  }
  return { offsets, total }
}

/**
 * The film opens on ink and lifts to cream partway through `circle` — the lights come up when
 * other people arrive. Returned as 0→1 so components can interpolate colours rather than
 * branch on a boolean, which would pop.
 */
export function toneAt(absoluteFrame: number, scenes: Scene[]): number {
  const index = scenes.findIndex((s) => s.id === 'circle')
  if (index === -1) return 1
  const { offsets } = layout(scenes)
  const start = offsets[index]! + Math.round(2.6 * FPS)
  const end = start + Math.round(1.6 * FPS)
  if (absoluteFrame <= start) return 0
  if (absoluteFrame >= end) return 1
  return (absoluteFrame - start) / (end - start)
}

/** Frames where one scene hands over to the next — the ring wipe fires on each. */
export function boundaries(scenes: Scene[]): number[] {
  const { offsets } = layout(scenes)
  return offsets.slice(1)
}
