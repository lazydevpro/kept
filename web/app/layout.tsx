import type { Metadata, Viewport } from 'next'
import { Sora, Inter, Instrument_Serif } from 'next/font/google'
import { Contact } from '@/components/contact'
import { SmoothScroll } from '@/components/smooth-scroll'
import { SITE_URL } from '@/lib/site'
import './globals.css'

/*
 * Sora and Inter are the app's faces, loaded here as variable fonts — one file each covering
 * every weight, which is both lighter than the four static cuts the app enumerates and more
 * flexible for editorial sizes.
 *
 * Instrument Serif is the site's own, and italic only: it exists for the accent word inside a
 * sans headline and nothing else. If a roman serif ever appears in a design, add the style
 * here rather than letting it silently fall back to Georgia.
 *
 * `next/font` self-hosts all three at build time. No request leaves for Google, which keeps
 * the "no third-party tags" line in the spec honest and takes a round trip off first paint.
 */
const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--font-serif',
  display: 'swap',
})

const DESCRIPTION =
  'Invest a little every week, with people who notice. KEPT is a private social investing habit app for Solana Mobile — your circle sees the ring, not the number.'

export const metadata: Metadata = {
  // Resolves the share image and canonical links to absolute URLs. Without it every social
  // preview referenced a relative path the crawler could not fetch.
  metadataBase: new URL(SITE_URL),
  title: 'KEPT — Promises compound.',
  description: DESCRIPTION,
  applicationName: 'KEPT',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'KEPT — Promises compound.',
    description: DESCRIPTION,
    siteName: 'KEPT',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'KEPT — Promises compound.', description: DESCRIPTION },
}

export const viewport: Viewport = {
  themeColor: '#FBFBF4',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} ${serif.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SmoothScroll />
        {children}
        {/* In the layout, not the home page: the invite and legal pages need a way to reach
            us too, and "Get early access" opens it from wherever it is pressed. */}
        <Contact />
      </body>
    </html>
  )
}
