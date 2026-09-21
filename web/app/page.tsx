import { ScrollRail } from '@/components/scroll-rail'
import { Hero } from '@/components/hero'
import { Manifesto } from '@/components/manifesto'
import { Year } from '@/components/year'
import { How } from '@/components/how'
import { Market } from '@/components/market'
import { Privacy } from '@/components/privacy'
import { Awards } from '@/components/awards'
import { Widget } from '@/components/widget'
import { SiteFooter } from '@/components/site-footer'

/**
 * One page, nine sections, in the order set out in docs/plans/landing-page.md §5.
 *
 * The order is an argument, not a layout: feel it (hero, manifesto), watch it happen (the
 * year), understand it (how), check it is real (market), trust it (privacy), see what you get
 * out of it (awards, widget). Moving a section moves the argument.
 */
export default function Home() {
  return (
    <>
      <ScrollRail />
      <main id="main">
        <Hero />
        <Manifesto />
        <Year />
        <How />
        <Market />
        <Privacy />
        <Awards />
        <Widget />
      </main>
      <SiteFooter />
    </>
  )
}
