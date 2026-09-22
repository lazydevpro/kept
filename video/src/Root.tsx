import React from 'react'
import { Composition } from 'remotion'
import { Launch } from './Launch'
import { FPS, TOTAL_FRAMES } from './edit'
import { CUTDOWN, SCENES, layout } from './product/film'
import {
  ProductFilm,
  RESTING_QUOTES,
  calculateProductMetadata,
  type ProductFilmProps,
} from './product/ProductFilm'

/**
 * Two films, three cuts each.
 *
 * The alternate aspects are not crops of a finished 16:9 render — they are the same component
 * laid out at a different frame size, so type rescales and content re-centres instead of being
 * sliced. Both films derive their type scale from `width`, which is what makes that work.
 */
export function RemotionRoot() {
  const troop = { component: Launch, durationInFrames: TOTAL_FRAMES, fps: FPS } as const

  const full = layout(SCENES).total
  const short = layout(SCENES.filter((s) => CUTDOWN.includes(s.id))).total

  const product = {
    component: ProductFilm,
    fps: FPS,
    calculateMetadata: calculateProductMetadata,
    defaultProps: { quotes: RESTING_QUOTES, live: 'Captured prices' } as ProductFilmProps,
  } as const

  return (
    <>
      {/* The generated-footage piece — social, marketing. */}
      <Composition id="Launch" {...troop} width={1920} height={1080} />
      <Composition id="LaunchVertical" {...troop} width={1080} height={1920} />
      <Composition id="LaunchSquare" {...troop} width={1080} height={1080} />

      {/* The product film — pure motion graphics, live prices at render time. */}
      <Composition id="Product" {...product} durationInFrames={full} width={1920} height={1080} />
      <Composition
        id="ProductVertical"
        {...product}
        durationInFrames={full}
        width={1080}
        height={1920}
      />
      <Composition
        id="ProductSquare"
        {...product}
        durationInFrames={full}
        width={1080}
        height={1080}
      />

      {/* Scenes 1, 3, 5, 8. `miss` survives every cut. */}
      <Composition
        id="ProductShort"
        {...product}
        durationInFrames={short}
        width={1920}
        height={1080}
        defaultProps={{ ...product.defaultProps, only: CUTDOWN }}
      />
    </>
  )
}
