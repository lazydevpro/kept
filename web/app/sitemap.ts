import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Required for a route handler to be written out by `output: 'export'`.
export const dynamic = 'force-static'

/** The pages worth finding. `/join` and `/foundation` are deliberately not in it. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
