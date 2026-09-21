import type { NextConfig } from 'next'

/**
 * Static export. The page has no server behaviour — the one piece of live data it will show
 * (§5 of docs/plans/landing-page.md) comes from the existing Worker, not from here — so
 * shipping HTML to Cloudflare Workers Assets costs nothing to run and cannot fall over.
 *
 * `images.unoptimized` is required by `output: 'export'`: the Image Optimization API needs a
 * server. The site's art is the app's own PNGs and hand-written SVG, both already sized.
 */
const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
}

export default nextConfig
