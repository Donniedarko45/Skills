import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { ClientStrip, Doors, DraftNotice, Faq, FinalCta, Network, Pricing, Process, Quotes, Services, SiteFooter, Work } from '@/components/sections'

export default function Home() {
  return (
    <>
      <DraftNotice />
      <SiteHeader />
      <main>
        <Hero />
        <ClientStrip />
        <Doors />
        <Work />
        <Services />
        <Process />
        <Network />
        <Pricing />
        <Quotes />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  )
}
