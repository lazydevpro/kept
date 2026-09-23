import { ScrollRail } from '@/components/scroll-rail'
import { Hero } from '@/components/hero'
import { Manifesto } from '@/components/manifesto'
import { Year } from '@/components/year'
import { How } from '@/components/how'
import { Market } from '@/components/market'
import { Privacy } from '@/components/privacy'
import { Circle } from '@/components/circle'
import { Awards } from '@/components/awards'
import { Widget } from '@/components/widget'
import { SiteFooter } from '@/components/site-footer'

/**
 * One page, ten sections, following docs/plans/landing-page.md §5.
 *
 * The order is an argument, not a layout: feel it (hero, manifesto), watch it happen (the
 * year), understand it (how), check it is real (market), trust it (privacy), watch that trust
 * hold (circle), see what you get out of it (awards, widget). Moving a section moves the
 * argument.
 *
 * `Circle` sits immediately after `Privacy` for that reason. Privacy states the rule — your
 * circle sees the ring, not the number — and the section after it runs an evening where that
 * rule holds while four people notice each other. Claim, then demonstration. It also hands
 * off cleanly into Awards, half of which are earned socially.
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
        <Circle />
        <Awards />
        <Widget />
      </main>
      <SiteFooter />
    </>
  )
}
