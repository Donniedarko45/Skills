import { clients, doors, faqs, network, pricing, process, quotes, services, site, work } from '@/lib/content'
import { BriefForm } from './brief-form'
import { Clocks } from './clocks'
import { Logo } from './logo'
import { AiMock, DashboardMock, MobileMock } from './work-mocks'

function Arrow({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Check({ className = 'size-4 text-volt-ink' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`mt-0.5 shrink-0 ${className}`}>
      <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SectionHead({ eyebrow, title, accent, after, body, center = false }: { eyebrow: string; title: string; accent?: string; after?: string; body?: string; center?: boolean }) {
  return (
    <div className={`reveal ${center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
      <p className="label text-muted">{eyebrow}</p>
      <h2 className="mt-4 text-[clamp(2.1rem,4.4vw,3.6rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
        {title} {accent && <span className="accent text-volt-ink">{accent}</span>} {after}
      </h2>
      {body && <p className={`mt-5 text-lg leading-relaxed text-pretty text-muted ${center ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}>{body}</p>}
    </div>
  )
}

/* ---------- Draft notice (remove when real content is in) ---------- */
export function DraftNotice() {
  if (!site.draftNotice) return null
  return (
    <aside aria-label="Draft notice" className="bg-volt px-4 py-2 text-center text-[13px] font-medium text-on-volt">
      Concept draft: client names, results, quotes and prices are placeholders.
    </aside>
  )
}

/* ---------- Client strip ---------- */
export function ClientStrip() {
  const row = [...clients, ...clients]
  return (
    <section aria-label="Teams we have built with" className="border-b border-line bg-paper py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-8 lg:flex-row lg:items-center lg:gap-12">
        <p className="shrink-0 text-sm text-muted">Built with and for</p>
        <div className="marquee relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <ul className="marquee-track flex w-max gap-14">
            {row.map((name, i) => (
              <li key={`${name}-${i}`} aria-hidden={i >= clients.length || undefined} className={`text-xl font-semibold tracking-tight whitespace-nowrap text-muted ${i % 3 === 1 ? 'accent text-2xl' : ''} ${i % 3 === 2 ? 'font-mono text-base tracking-[0.12em] uppercase' : ''}`}>
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------- Two ways in ---------- */
function AgencyThread() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 text-[13px] leading-snug shadow-sm">
      <p className="label text-muted"># client-northwind-app</p>
      <div className="mt-3 space-y-3">
        <div className="flex gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-tray text-[11px] font-medium">JS</span>
          <p><span className="font-medium">Jess, your PM</span> <span className="text-muted">· 09:12</span><br />Client wants the iOS app by March. Can we say yes?</p>
        </div>
        <div className="flex gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-night text-[11px] font-semibold text-on-night">V</span>
          <p><span className="font-medium">VRAMP lead</span> <span className="text-muted">· 09:40</span><br />Yes. Team of 3 free from Monday, fixed quote in your inbox by tomorrow.</p>
        </div>
      </div>
    </div>
  )
}

function CommitLog() {
  const commits = [
    ['Add onboarding flow behind flag', '2h'],
    ['Stripe webhooks: idempotent handler', '5h'],
    ['Friday demo build v0.6', '1d'],
  ]
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 text-[13px] shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[12px] text-muted">your-org/app · main</p>
        <p className="label text-volt-ink">46 commits this week</p>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {commits.map(([msg, ago]) => (
          <li key={msg} className="flex items-center justify-between gap-3 py-2">
            <span className="flex min-w-0 items-center gap-2"><span className="size-1.5 shrink-0 rounded-full bg-volt-ink" aria-hidden="true" /><span className="truncate">{msg}</span></span>
            <span className="font-mono text-[12px] text-muted">{ago}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Doors() {
  const cards = [
    { ...doors.agencies, visual: <AgencyThread /> },
    { ...doors.companies, visual: <CommitLog /> },
  ]
  return (
    <section className="bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead eyebrow="Two ways in" title="One studio, built for" accent="two kinds" after="of teams." body="Agencies use us as their invisible product team. Companies use us as the team they have not hired yet. Same people, same standards." />
        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          {cards.map((c) => (
            <article key={c.eyebrow} className="reveal flex flex-col rounded-[28px] bg-tray p-2">
              <div className="flex flex-1 flex-col rounded-[22px] border border-line bg-paper p-6 sm:p-8">
                <p className="label text-muted">{c.eyebrow}</p>
                <h3 className="mt-3 text-3xl leading-tight font-semibold tracking-[-0.03em] sm:text-4xl">
                  {c.title} <span className="accent text-volt-ink">{c.titleAccent}</span>
                </h3>
                <p className="mt-4 max-w-lg leading-relaxed text-muted">{c.body}</p>
                <ul className="mt-6 space-y-3">
                  {c.points.map((p) => (
                    <li key={p} className="flex gap-3 text-[15px] leading-snug"><Check />{p}</li>
                  ))}
                </ul>
                <div className="mt-8">{c.visual}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Work ---------- */
const mocks = { dashboard: DashboardMock, mobile: MobileMock, ai: AiMock }

export function Work() {
  return (
    <section id="work" className="plan-grid bg-carbon py-24 text-on-carbon sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="label text-on-carbon-muted">Selected work</p>
            <h2 className="mt-4 text-[clamp(2.1rem,4.4vw,3.6rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
              Shipped, measured, <span className="accent text-signal">handed over.</span>
            </h2>
          </div>
          <p className="max-w-sm text-on-carbon-muted">Every engagement ends with a launch, numbers we can point to, and a team on the client side that owns it.</p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {work.map((w) => {
            const Mock = mocks[w.mock]
            return (
              <article key={w.client} className="reveal flex flex-col rounded-[28px] border border-carbon-line bg-carbon-2 p-2">
                <div className="grid place-items-center rounded-[22px] bg-carbon-3/60 p-5 lg:h-80">
                  <div className="w-full"><Mock /></div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="label text-on-carbon-muted">{w.via}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">{w.client}</h3>
                  <p className="text-on-carbon-muted">{w.kind}</p>
                  <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-carbon-line pt-5">
                    {w.results.map((r) => (
                      <div key={r.label}>
                        <dt className="sr-only">{r.label}</dt>
                        <dd className="text-3xl font-semibold tracking-tight tabular-nums text-signal">{r.value}</dd>
                        <dd className="mt-1 text-[13px] leading-snug text-on-carbon-muted">{r.label}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="label mt-auto pt-6 text-on-carbon-muted">
                    {w.duration} · {w.team} · {w.stack.join(' · ')}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Services ---------- */
export function Services() {
  return (
    <section id="services" className="bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead eyebrow="What we build" title="From the first sketch to the" accent="last deploy." body="One team covers design, engineering and the platform underneath, so nothing gets lost between handoffs." />
        <ul className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <li key={s.n} className="reveal group bg-paper p-7 transition-colors hover:bg-surface sm:p-8">
              <p className="font-mono text-sm text-muted">{s.n}</p>
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {s.tags.map((t) => (
                  <li key={t} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11.5px] text-ink-soft">{t}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ---------- Process: the ramp ---------- */
export function Process() {
  const offsets = ['lg:mt-48', 'lg:mt-32', 'lg:mt-16', 'lg:mt-0']
  return (
    <section id="process" className="overflow-hidden border-y border-line bg-tray py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead eyebrow="How it works" title="The ramp:" accent="brief to launch" after="in four steps." body="No discovery phase that bills for weeks. You get a price on day one and working software every Friday." />
        <div className="relative mt-16">
          {/* the incline the steps climb */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-[78%] w-full lg:block">
            <defs>
              <linearGradient id="incline" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--volt-ink)" stopOpacity="0.02" />
                <stop offset="100%" stopColor="var(--volt-ink)" stopOpacity="0.16" />
              </linearGradient>
            </defs>
            <polygon points="0,100 100,18 100,100" fill="url(#incline)" />
            <line x1="0" y1="100" x2="100" y2="18" stroke="var(--volt-ink)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:pb-10">
            {process.map((p, i) => (
              <li key={p.n} className={`reveal ${offsets[i]}`}>
                <div className="rounded-[24px] border border-line bg-paper p-6 shadow-[0_1px_0_var(--line)]">
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-full bg-night font-mono text-sm font-medium text-on-night">{p.n}</span>
                    <span className="label text-muted">{p.when}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ---------- Network ---------- */
export function Network() {
  return (
    <section className="bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead eyebrow="The network" title="Senior or" accent="nothing." body="VRAMP is a vetted network of designers and engineers who have shipped products at startups, agencies and big tech. Every team has a lead who reviews every line." />
        <dl className="mt-14 grid gap-y-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
          {network.stats.map((s) => (
            <div key={s.label} className="reveal lg:px-8 lg:first:pl-0">
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-6xl font-light tracking-[-0.05em] tabular-nums">{s.value}</dd>
              <dd className="mt-3 max-w-[14rem] text-muted">{s.label}</dd>
            </div>
          ))}
        </dl>
        <div className="reveal mt-16">
          <p className="mb-4 text-lg font-semibold tracking-tight">Someone on your team is always awake.</p>
          <Clocks clocks={network.clocks} />
        </div>
      </div>
    </section>
  )
}

/* ---------- Pricing ---------- */
export function Pricing() {
  return (
    <section id="pricing" className="border-t border-line bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead eyebrow="Pricing" title="Fixed prices." accent="No hourly surprises." body="Every engagement is priced before it starts. Agencies get partner rates and white-label terms." />
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {pricing.map((p) => (
            <article key={p.name} className={`reveal flex flex-col rounded-[28px] p-7 sm:p-8 ${p.featured ? 'bg-night text-on-night' : 'border border-line bg-surface'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                {p.featured && <span className="label rounded-full bg-volt px-2.5 py-1 text-on-volt">Most chosen</span>}
              </div>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-[-0.04em] tabular-nums">{p.price}</span>
                <span className={p.featured ? 'text-on-night-muted' : 'text-muted'}>{p.unit}</span>
              </p>
              <p className={`mt-4 leading-relaxed ${p.featured ? 'text-on-night-muted' : 'text-muted'}`}>{p.body}</p>
              <ul className="mt-6 space-y-3 border-t pt-6 text-[15px] [border-color:inherit]" style={p.featured ? { borderColor: 'var(--night-line)' } : undefined}>
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-3"><Check className={p.featured ? 'size-4 text-volt' : 'size-4 text-volt-ink'} />{pt}</li>
                ))}
              </ul>
              <a href="#brief" className={`mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-medium transition-colors ${p.featured ? 'bg-volt text-on-volt hover:bg-volt-strong' : 'border border-line-strong hover:bg-tray'}`}>
                {p.cta} <Arrow />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Quotes ---------- */
export function Quotes() {
  return (
    <section aria-label="What clients say" className="border-t border-line bg-paper py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        {quotes.map((q) => (
          <figure key={q.org} className="reveal">
            <blockquote className="accent text-[clamp(1.6rem,2.6vw,2.25rem)] leading-[1.2] text-ink">&ldquo;{q.quote}&rdquo;</blockquote>
            <figcaption className="mt-6 flex items-center gap-3 text-sm">
              <span className="h-px w-8 bg-volt-ink" aria-hidden="true" />
              <span><span className="font-medium">{q.name}</span> <span className="text-muted">· {q.org}</span></span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

/* ---------- FAQ ---------- */
export function Faq() {
  return (
    <section id="faq" className="border-t border-line bg-paper py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHead eyebrow="FAQ" title="Questions agencies and founders" accent="actually ask." />
        <div className="reveal divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium tracking-tight [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line transition-transform group-open:rotate-45" aria-hidden="true">
                  <svg viewBox="0 0 16 16" className="size-3.5"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </span>
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Closing CTA + footer ---------- */
export function FinalCta() {
  return (
    <section id="brief" className="plan-grid relative overflow-hidden bg-night py-24 text-on-night sm:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-40 size-[560px] rounded-full bg-white/10 blur-[140px]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="reveal">
          <p className="label text-on-night-muted">Start here</p>
          <h2 className="mt-4 text-[clamp(2.6rem,5.4vw,4.6rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-balance">
            Tell us what you&apos;re <span className="accent text-volt">building.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-on-night-muted">
            Send a few sentences. Within a day you get a lead&apos;s honest take, a team proposal and a fixed price, or a straight answer that we are not the right fit.
          </p>
          <ul className="mt-10 space-y-4 text-[15px]">
            {['Reply within one business day', 'Fixed quote within 24 hours of the call', 'First commit within 72 hours of yes'].map((t, i) => (
              <li key={t} className="flex items-center gap-4">
                <span className="font-mono text-sm text-volt">0{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-on-night-muted">
            Prefer email? <a href={`mailto:${site.email}`} className="text-on-night underline decoration-volt underline-offset-4">{site.email}</a>
          </p>
        </div>
        <div className="reveal">
          <BriefForm />
        </div>
      </div>
    </section>
  )
}

export function SiteFooter() {
  const columns = [
    { title: '01 — Studio', links: ['Work', 'Services', 'Process', 'Pricing'] },
    { title: '02 — Partners', links: ['For agencies', 'White-label terms', 'Join the network'] },
    { title: '03 — Company', links: ['About', 'Careers', 'Privacy', 'Terms'] },
  ]
  return (
    <footer className="border-t border-carbon-line bg-carbon text-on-carbon">
      <div className="mx-auto max-w-7xl px-5 pt-16 pb-10 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-on-carbon-muted">Senior product teams for agencies and companies, ramped up in 72 hours.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((c) => (
              <div key={c.title}>
                <p className="label text-on-carbon-muted">{c.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l}><a href="#top" className="text-on-carbon/90 transition-colors hover:text-signal">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 1000 205" aria-hidden="true" className="mt-16 w-full select-none">
          <text x="0" y="196" textLength="1000" lengthAdjust="spacingAndGlyphs" className="fill-on-carbon/[0.06] font-sans text-[262px] font-semibold">VRAMP</text>
        </svg>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-carbon-line pt-6 text-sm text-on-carbon-muted">
          <p>© 2026 VRAMP. Built remotely, everywhere.</p>
          <a href={`mailto:${site.email}`} className="hover:text-on-carbon">{site.email}</a>
        </div>
      </div>
    </footer>
  )
}
