import { Hero } from '@/components/hero'
import { SiteHeader } from '@/components/site-header'
import { DraftNotice, Doors, Faq, FinalCta, LogoRow, Network, Pricing, Process, Quotes, Services, SiteFooter, Statement, Work } from '@/components/sections'

export default function Home() {
  return (
    <>
      <DraftNotice />
      <SiteHeader />
      <main>
        <Hero />
        <LogoRow />
        <Statement />
        <Doors />
        <Process />
        <Work />
        <Services />
        <Network />
        <Quotes />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  )
}
