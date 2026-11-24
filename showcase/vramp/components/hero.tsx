import { heroProof, site } from '@/lib/content'
import { RampChart } from './ramp-chart'

export function Hero() {
  return (
    <section id="top" className="plan-grid relative overflow-hidden bg-night text-on-night">
      {/* soft volt glow behind the chart */}
      <div aria-hidden="true" className="pointer-events-none absolute top-1/3 right-[-10%] size-[640px] rounded-full bg-white/10 blur-[140px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1.02fr_1fr] lg:gap-10 lg:pt-24 lg:pb-28">
        <div>
          <p className="rise label flex items-center gap-2 text-on-night-muted" style={{ ['--i' as string]: 0 }}>
            <span className="h-px w-6 bg-volt" aria-hidden="true" />
            Product studio for agencies and companies
          </p>

          <h1 className="rise mt-6 text-[clamp(2.75rem,6.4vw,5.6rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-balance" style={{ ['--i' as string]: 1 }}>
            Senior product teams, <span className="accent text-volt">ramped up</span> in 72&nbsp;hours.
          </h1>

          <p className="rise mt-7 max-w-xl text-lg leading-relaxed text-pretty text-on-night-muted" style={{ ['--i' as string]: 2 }}>
            {site.description}
          </p>

          <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ ['--i' as string]: 3 }}>
            <a
              href={site.bookingUrl}
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-volt px-6 text-[15px] font-medium text-on-volt transition-colors hover:bg-volt-strong"
            >
              Book a 20-minute intro
              <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5">
                <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#work" className="inline-flex h-12 items-center rounded-full border border-night-line px-6 text-[15px] font-medium text-on-night transition-colors hover:bg-night-2">
              See the work
            </a>
          </div>

          <ul className="rise mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-on-night-muted" style={{ ['--i' as string]: 4 }}>
            {heroProof.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 text-volt">
                  <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <RampChart />
      </div>
    </section>
  )
}
