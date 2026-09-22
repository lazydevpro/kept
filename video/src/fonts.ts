import { loadFont as loadSora } from '@remotion/google-fonts/Sora'
import { loadFont as loadSerif } from '@remotion/google-fonts/InstrumentSerif'

/**
 * The same two faces as the landing page: Sora for everything, Instrument Serif italic for
 * the accent word. `@remotion/google-fonts` waits for the font before rendering a frame, so
 * there is no flash of fallback baked into the output — which would be permanent in a video
 * rather than a moment, as it is on the web.
 */
const sora = loadSora('normal', { weights: ['600', '700', '800'], subsets: ['latin'] })
const serif = loadSerif('italic', { weights: ['400'], subsets: ['latin'] })

export const SANS = sora.fontFamily
export const SERIF = serif.fontFamily
export const waitForFonts = () => Promise.all([sora.waitUntilDone(), serif.waitUntilDone()])
