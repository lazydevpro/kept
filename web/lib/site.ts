/**
 * Where things live. One file, so moving to a custom domain or publishing the app is a
 * one-line change rather than a search.
 */

/** The site's own origin. Absolute URLs in metadata, the sitemap and the OG image need it. */
export const SITE_URL = 'https://keptapp.pages.dev'

/** The production Worker. Only the public invite preview is called from here. */
export const API_URL = 'https://kept-api.lazydevpro.workers.dev'

export const SOURCE_URL = 'https://github.com/lazydevpro/kept'

/**
 * Where to get the app, once it can be got. Until the dApp Store listing is live this is
 * null, and every "get the app" call to action opens the contact form as an early-access
 * request instead of linking somewhere that does not exist yet.
 */
export const DOWNLOAD_URL: string | null = null

/** The app's custom scheme, for "Open in KEPT" on the invite page. */
export const APP_SCHEME = 'neonreserve'
