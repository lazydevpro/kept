import { Config } from '@remotion/cli/config'
import path from 'node:path'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)

/**
 * `@/` resolves into the `web/` workspace.
 *
 * The film draws the product with `web/components/rings.tsx` — the same component the app and
 * the landing page use — rather than a copy living here. A copy would drift, and a film that
 * shows a slightly-wrong version of the product is worse than one that shows none.
 */
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      '@': path.join(process.cwd(), '..', 'web'),
    },
  },
}))
