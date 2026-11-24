import { clsx } from 'clsx'
import { clients, doors, faqs, network, pricing, process, services, site, stack, work } from '@/lib/content'
import { BriefForm } from './brief-form'
import { Clocks } from './clocks'
import { Logo } from './logo'
import { Testimonials } from './testimonials'
import { AiMock, DashboardMock, MobileMock } from './work-mocks'

/* ---------- Shared bits ---------- */
function Arrow({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Check({ className = 'size-4 text-hue-500' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={clsx('shrink-0', className)}>
      <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Two-tone section heading: the second part in a muted shade of the same ink. */
function Heading({ id, title, muted, className }: { id?: string; title: string; muted: string; className?: string }) {
  return (
    <h2 id={id} className={clsx('display text-[clamp(2.1rem,4.2vw,3.5rem)] leading-[1.04] tracking-[-0.04em]', className)}>
      {title}
      <br />
      <span className="text-ink-faint">{muted}</span>
    </h2>
  )
}

const shadow = 'shadow-[0_30px_70px_-30px_oklch(0.25_0.04_265/0.35)]'
const section = 'mx-auto max-w-[1240px] px-5 sm:px-8'

export function DraftNotice() {
  if (!site.draftNotice) return null
  return (
    <aside aria-label="Draft notice" className="bg-hue-100 px-4 py-2 text-center text-[13px] text-hue-700">
      Concept draft: client names, results, quotes and prices are placeholders.
    </aside>
  )
}

/* ---------- Logo row ---------- */
const wordmarkStyles = [
  'font-semibold tracking-[-0.03em]',
  'font-serif italic text-[22px]',
  'font-mono text-[15px] tracking-[0.14em] uppercase',
  'font-bold lowercase tracking-[-0.05em] text-[24px]',
  'font-medium tracking-tight',
  'text-[15px] font-semibold tracking-[0.22em] uppercase',
  'font-light tracking-tight text-[22px]',
  'font-semibold tracking-[-0.02em]',
]
const glyphs = ['◆', '', '', '', '✳', '', '◐', '●']

export function LogoRow() {
  return (
    <section aria-labelledby="logos-title" className={clsx(section, 'pt-6 pb-24 lg:pb-32')}>
      <p id="logos-title" className="text-center text-[16px] text-ink-muted">
        Built with and for agencies and product teams in 14 countries
      </p>
      <ul className="mx-auto mt-10 flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-6 text-ink-muted sm:gap-x-16">
        {clients.map((name, i) => (
          <li key={name} className={clsx('flex items-center gap-1.5 text-[20px] whitespace-nowrap', wordmarkStyles[i % wordmarkStyles.length])}>
            {glyphs[i] && <span aria-hidden="true" className="text-[16px]">{glyphs[i]}</span>}
            {name}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- Statement + big numbers ---------- */
export function Statement() {
  return (
    <section aria-labelledby="about-title" className={clsx(section, 'pb-28 lg:pb-44')}>
      <h2 id="about-title" className="eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-ink-muted">
        <span className="size-1.5 rounded-full bg-hue-500" aria-hidden="true" />
        About VRAMP
      </h2>
      <p className="mt-8 max-w-[22em] text-[clamp(1.75rem,3.9vw,3.1rem)] leading-[1.12] font-medium tracking-[-0.035em] text-pretty">
        VRAMP puts a senior product team inside your agency or company in 72 hours.{' '}
        <span className="text-ink-muted">Designers and engineers who join your Slack and ship every Friday,</span>{' '}
        <span className="text-ink-faint">then hand over clean code when the work is done.</span>
      </p>

      <dl className="mt-20 grid grid-cols-2 gap-y-10 border-t border-line pt-10 lg:mt-28 lg:grid-cols-4 lg:border-t-0 lg:pt-0">
        {network.stats.map((s, i) => (
          <div key={s.label} className={clsx('flex flex-col-reverse gap-3 pr-4 lg:px-8', i > 0 && 'lg:border-l lg:border-line', i % 2 === 1 && 'border-l border-line pl-5 lg:pl-8', i === 0 && 'lg:pl-0')}>
            <dt className="max-w-[13em] text-[15px] leading-snug text-ink-muted">{s.label}</dt>
            <dd className="text-[clamp(3.25rem,6.6vw,5.75rem)] leading-[0.9] font-light tracking-[-0.055em] tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ---------- Two ways in: photo cards with UI on them ---------- */
function AgencyOverlay() {
  return (
    <div className={clsx('absolute right-4 bottom-4 left-4 rounded-2xl bg-surface p-4 sm:right-auto sm:w-[320px]', shadow)}>
      <div className="flex items-center justify-between text-[12px] text-ink-muted">
        <span className="font-mono"># client-northwind</span>
        <span className="rounded-full bg-hue-100 px-2 py-0.5 font-medium text-hue-700">White-label</span>
      </div>
      <div className="mt-3 flex gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink text-[12px] font-semibold text-canvas">N</span>
        <div className="min-w-0">
          <p className="text-[13px]"><span className="font-semibold">Northwind Studio</span> <span className="text-ink-muted">· 16:02</span></p>
          <p className="mt-0.5 text-[13px] leading-snug">Sprint 2 demo is on staging. Checkout is down to three steps.</p>
        </div>
      </div>
    </div>
  )
}

function CompanyOverlay() {
  return (
    <>
      <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-[13px] font-medium shadow-sm">
        This sprint
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div className={clsx('absolute right-4 bottom-4 left-4 rounded-2xl bg-hue-900 p-4 text-on-hue-900 sm:left-auto sm:w-[300px]', shadow)}>
        <p className="text-[15px] font-medium">Pull request merged</p>
        <div className="mt-3 flex items-center justify-between font-mono text-[12px]">
          <span className="text-on-hue-900-muted">#128 · checkout-v2</span>
          <span><span className="text-[oklch(0.8_0.14_155)]">+1,284</span> <span className="text-on-hue-900-muted">−316</span></span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px]">
          <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[oklch(0.8_0.14_155)]" aria-hidden="true" />Deployed to production</span>
          <span className="text-on-hue-900-muted">Fri 16:40</span>
        </div>
      </div>
    </>
  )
}

export function Doors() {
  const cards = [
    { door: doors.agencies, photo: '/photos/pair-at-laptop.jpg', alt: 'Two developers reviewing code together on a laptop', overlay: <AgencyOverlay />, className: 'lg:col-span-5' },
    { door: doors.companies, photo: '/photos/engineer-at-desk.jpg', alt: 'Engineers working at their desks in a bright office', overlay: <CompanyOverlay />, className: 'lg:col-span-7' },
  ]
  return (
    <section aria-labelledby="doors-title" className={clsx(section, 'pb-28 lg:pb-44')}>
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <Heading id="doors-title" title="Two ways in." muted="One standard of work." />
        <p className="max-w-sm text-[16px] leading-relaxed text-ink-muted lg:text-right">
          Agencies bring us in under their name. Companies bring us in to ship. The team, the cadence and the quality bar are the same.
        </p>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-4">
        {cards.map(({ door, photo, alt, overlay, className }) => (
          <article key={door.eyebrow} className={className}>
            <div className="relative h-[380px] overflow-hidden rounded-[28px] bg-tray sm:h-[440px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              {overlay}
            </div>
            <div className="mt-7 px-1">
              <p className="eyebrow text-ink-muted">{door.eyebrow}</p>
              <h3 className="mt-3 text-[28px] leading-tight font-medium tracking-[-0.03em]">
                {door.title} <span className="text-ink-faint">{door.titleMuted}</span>
              </h3>
              <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-ink-muted">{door.body}</p>
              <ul className="mt-5 space-y-2.5">
                {door.points.map((p) => (
                  <li key={p} className="flex gap-3 text-[15px] leading-snug">
                    <Check className="mt-0.5 size-4 text-hue-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ---------- The ramp: a staircase of steps ---------- */
const stepTint = ['bg-hue-50', 'bg-hue-100', 'bg-hue-200', 'bg-hue-900 text-on-hue-900']
const stepHeight = ['lg:h-[46%]', 'lg:h-[60%]', 'lg:h-[74%]', 'lg:h-[88%]']

export function Process() {
  return (
    <section id="process" aria-labelledby="process-title" className="pb-28 lg:pb-44">
      <div className={clsx(section, 'flex flex-col justify-between gap-6 lg:flex-row lg:items-end')}>
        <Heading id="process-title" title="The ramp." muted="Brief to launch in six weeks." />
        <p className="max-w-sm text-[16px] leading-relaxed text-ink-muted lg:text-right">
          Every engagement climbs the same four steps. You see working software every Friday, and you can change course at each one.
        </p>
      </div>

      <ol className="mx-auto mt-14 grid max-w-[1240px] gap-3 px-5 sm:px-8 lg:h-[600px] lg:grid-cols-4 lg:gap-0 lg:border-y lg:border-line lg:px-0">
        {process.map((step, i) => (
          <li key={step.n} className={clsx('relative flex flex-col lg:border-line', i > 0 && 'lg:border-l')}>
            <p className="hidden pt-8 text-center text-[22px] font-medium tracking-tight tabular-nums lg:block">{step.n}</p>
            <div className={clsx('mt-auto flex flex-col rounded-3xl p-7 lg:rounded-none lg:p-8', stepTint[i], stepHeight[i])}>
              <p className={clsx('text-[15px]', i === 3 ? 'text-on-hue-900-muted' : 'text-ink-soft')}>
                <span className="lg:hidden">{step.n} · </span>{step.when}
              </p>
              <h3 className="mt-2 text-[34px] leading-none font-light tracking-[-0.04em] lg:text-[44px]">{step.title}</h3>
              <p className={clsx('mt-4 max-w-[26em] text-[15px] leading-relaxed lg:mt-auto', i === 3 ? 'text-on-hue-900-muted' : 'text-ink-soft')}>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ---------- Work: tinted trays holding product fragments ---------- */
const trayTint = ['bg-hue-300', 'bg-hue-200', 'bg-hue-100']

export function Work() {
  const mocks = { dashboard: <DashboardMock />, mobile: <MobileMock />, ai: <AiMock /> }
  return (
    <section id="work" aria-labelledby="work-title" className={clsx(section, 'pb-28 lg:pb-44')}>
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <Heading id="work-title" title="Shipped, measured," muted="handed over." />
        <p className="max-w-sm text-[16px] leading-relaxed text-ink-muted lg:text-right">
          Every engagement ends with a launch, numbers we can point to, and a team that can run it without us.
        </p>
      </div>

      <div className="mt-14 grid gap-4 lg:grid-cols-3">
        {work.map((w, i) => (
          <article key={w.client} className={clsx('flex flex-col p-3 pb-0', trayTint[i])}>
            <div aria-hidden="true">{mocks[w.mock]}</div>
            <div className="flex flex-1 flex-col px-3 pt-7">
              <p className="self-start rounded-full bg-surface px-3 py-1.5 text-[13px] font-medium">
                {w.results[0].value} <span className="font-normal text-ink-muted">{w.results[0].label}</span>
              </p>
              <h3 className="mt-5 text-[26px] leading-tight font-medium tracking-[-0.03em]">{w.client}</h3>
              <p className="mt-1 text-[15px] text-ink">{w.kind}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                {w.via}. {w.duration}, {w.team}. {w.results[1].value} {w.results[1].label}.
              </p>
              <a href="#brief" className="group mt-auto flex items-center justify-between border-t border-ink/15 py-5 text-[16px] font-medium">
                Ask about a build like this
                <Arrow className="size-5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ---------- Services: feature band with a photo ---------- */
const serviceIcons: Record<(typeof services)[number]['icon'], React.ReactNode> = {
  design: <path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3" />,
  apps: <><rect x="3" y="4" width="13" height="10" rx="2" /><rect x="15" y="9" width="6" height="11" rx="1.5" /><path d="M7 18h5" /></>,
  ai: <><path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3z" /><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" /></>,
  platform: <><rect x="3" y="4" width="18" height="6" rx="2" /><rect x="3" y="14" width="18" height="6" rx="2" /><path d="M7 7h.01M7 17h.01" /></>,
}

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className={clsx(section, 'pb-28 lg:pb-44')}>
      <div className="grid gap-8 rounded-[32px] bg-hue-100 p-6 sm:p-8 lg:grid-cols-[1fr_1.05fr_1fr] lg:gap-10 lg:p-10">
        <div className="flex flex-col">
          <p className="eyebrow inline-flex items-center gap-2 self-start rounded-full bg-surface px-3 py-1.5 text-ink-muted">
            <Logo className="[&>span]:hidden [&_svg]:size-4" /> What we build
          </p>
          <h2 id="services-title" className="display mt-8 text-[clamp(2rem,3.4vw,2.9rem)] leading-[1.05] tracking-[-0.04em]">
            One senior team for every layer of the product.
          </h2>
          <ul className="mt-8 flex flex-wrap gap-2 lg:mt-auto">
            {stack.map((t) => (
              <li key={t} className="rounded-full bg-surface/70 px-3 py-1 text-[13px] text-ink-soft">{t}</li>
            ))}
          </ul>
        </div>

        <div className="relative min-h-[320px] overflow-hidden rounded-3xl bg-tray lg:min-h-[520px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/tablet-wireframes.jpg" alt="A designer sketching wireframes on a tablet" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </div>

        <ul className="flex flex-col justify-between gap-7">
          {services.map((s) => (
            <li key={s.title}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7 fill-none stroke-ink" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {serviceIcons[s.icon]}
              </svg>
              <h3 className="mt-3 text-[18px] font-medium tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ---------- Network: copy beside a photo with UI on it ---------- */
export function Network() {
  const vetting = ['Portfolio and code review', 'A paid trial project', 'Two client references']
  return (
    <section aria-labelledby="network-title" className={clsx(section, 'pb-28 lg:pb-44')}>
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col">
          <Heading id="network-title" title="Senior or nothing." muted="One in thirty gets in." />
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-muted">
            Every designer and engineer in the network has shipped products like yours, and passed the same three checks before their first project.
          </p>
          <ol className="mt-8 max-w-md divide-y divide-line border-y border-line">
            {vetting.map((v, i) => (
              <li key={v} className="flex items-center gap-4 py-4 text-[16px]">
                <span className="w-6 text-[14px] text-ink-muted tabular-nums">0{i + 1}</span>
                {v}
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-3 lg:mt-auto lg:pt-10">
            <a href={site.bookingUrl} className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium text-canvas transition-opacity hover:opacity-85">
              Meet your team <Arrow />
            </a>
            <a href="#faq" className="inline-flex h-12 items-center rounded-full border border-line-strong px-6 text-[15px] font-medium transition-colors hover:bg-surface">
              How vetting works
            </a>
          </div>
        </div>

        <div className="relative lg:pl-16">
          <div className="relative h-[460px] overflow-hidden rounded-[28px] bg-tray sm:h-[600px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/team-at-table.jpg" alt="A product team working on laptops around a shared table" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-[60%_center]" />
          </div>
          <div className={clsx('relative -mt-40 mx-3 rounded-2xl border border-line bg-surface p-4 sm:absolute sm:top-10 sm:left-0 sm:mx-0 sm:mt-0 sm:w-[330px]', shadow)}>
            <Clocks clocks={network.clocks} />
          </div>
          <div className={clsx('absolute right-4 bottom-4 hidden rounded-2xl bg-surface p-4 sm:block sm:w-[250px]', shadow)}>
            <p className="text-[12px] text-ink-muted">Accepted this quarter</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-[34px] leading-none font-light tracking-[-0.04em] tabular-nums">14</span>
              <span className="text-[13px] text-ink-muted">of 431 applicants</span>
            </p>
            <div className="mt-3 flex gap-[3px]" aria-hidden="true">
              {Array.from({ length: 30 }, (_, i) => (
                <span key={i} className={clsx('h-4 flex-1 rounded-full', i === 0 ? 'bg-hue-500' : 'bg-hue-100')} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Testimonials: the one deep band ---------- */
export function Quotes() {
  return (
    <section aria-label="What clients say" className="bg-hue-900 text-on-hue-900">
      <ul className="grid grid-cols-2 border-b border-on-hue-900/15 sm:grid-cols-4 lg:grid-cols-8">
        {clients.map((name, i) => (
          <li key={name} className={clsx('flex h-24 items-center justify-center border-on-hue-900/15 px-3 text-center text-[16px] text-on-hue-900-muted', i % 2 === 1 && 'border-l', 'sm:border-l sm:first:border-l-0', i >= 2 && 'border-t sm:border-t-0', i >= 4 && 'sm:border-t lg:border-t-0', wordmarkStyles[i % wordmarkStyles.length], '!text-[16px]')}>
            {name}
          </li>
        ))}
      </ul>
      <div className="px-5 py-24 sm:px-8 lg:py-36">
        <Testimonials />
      </div>
    </section>
  )
}

/* ---------- Pricing ---------- */
export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className={clsx(section, 'py-28 lg:py-44')}>
      <div className="text-center">
        <Heading id="pricing-title" title="Fixed prices." muted="No hourly surprises." />
        <p className="mx-auto mt-6 max-w-lg text-[16px] leading-relaxed text-ink-muted">
          Every engagement is priced before it starts. Agencies get partner rates and white-label terms.
        </p>
      </div>

      <div className="mt-16 grid gap-4 lg:grid-cols-3">
        {pricing.map((p) => (
          <article key={p.name} className={clsx('flex flex-col rounded-[28px] p-8', p.featured ? 'bg-hue-900 text-on-hue-900' : 'border border-line bg-surface')}>
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-medium">{p.name}</h3>
              {p.featured && <span className="rounded-full bg-chip px-3 py-1 text-[12px] font-medium text-hue-900">Most chosen</span>}
            </div>
            <p className="mt-8 flex items-baseline gap-2">
              <span className="text-[56px] leading-none font-light tracking-[-0.05em]">{p.price}</span>
              <span className={clsx('text-[14px]', p.featured ? 'text-on-hue-900-muted' : 'text-ink-muted')}>{p.unit}</span>
            </p>
            <p className={clsx('mt-5 text-[15px] leading-relaxed', p.featured ? 'text-on-hue-900-muted' : 'text-ink-muted')}>{p.body}</p>
            <ul className={clsx('mt-7 space-y-3 border-t pt-7', p.featured ? 'border-on-hue-900/15' : 'border-line')}>
              {p.points.map((pt) => (
                <li key={pt} className="flex gap-3 text-[15px]">
                  <Check className={clsx('mt-0.5 size-4', p.featured ? 'text-chip' : 'text-hue-500')} />
                  {pt}
                </li>
              ))}
            </ul>
            <a
              href="#brief"
              className={clsx(
                'mt-10 inline-flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-medium transition-opacity hover:opacity-85',
                p.featured ? 'bg-on-hue-900 text-hue-900' : 'bg-ink text-canvas',
              )}
            >
              {p.cta} <Arrow />
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ---------- FAQ ---------- */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className={clsx(section, 'pb-28 lg:pb-44')}>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Heading id="faq-title" title="Good questions." muted="Straight answers." />
          <p className="mt-6 max-w-sm text-[16px] leading-relaxed text-ink-muted">
            Anything else, ask on the intro call or write to <a href={`mailto:${site.email}`} className="text-ink underline underline-offset-4">{site.email}</a>.
          </p>
        </div>
        <div className="border-t border-line">
          {faqs.map((f) => (
            <details key={f.q} className="group border-b border-line">
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 text-[18px] font-medium tracking-[-0.01em]">
                {f.q}
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-ink-muted transition-transform group-open:rotate-45">
                  <svg viewBox="0 0 16 16" className="size-3.5"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </span>
              </summary>
              <p className="max-w-2xl pb-7 text-[16px] leading-relaxed text-ink-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Brief ---------- */
export function FinalCta() {
  const next = [
    'A lead reads it and replies within one business day',
    'A 20-minute call about the problem, users and deadline',
    'Scope, team and a fixed price within 24 hours of the call',
  ]
  return (
    <section id="brief" aria-labelledby="brief-title" className={clsx(section, 'pb-28 lg:pb-36')}>
      <div className="grid gap-12 rounded-[32px] bg-hue-50 p-6 sm:p-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:p-14">
        <div>
          <Heading id="brief-title" title="Tell us what" muted="you're building." />
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-soft">
            A few sentences is enough. Agencies, tell us what your client asked for; companies, what you need to ship and by when.
          </p>
          <ol className="mt-10 space-y-5">
            {next.map((n, i) => (
              <li key={n} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-[13px] font-medium tabular-nums">{i + 1}</span>
                <span className="pt-1 text-[16px] leading-snug">{n}</span>
              </li>
            ))}
          </ol>
        </div>
        <BriefForm />
      </div>
    </section>
  )
}

/* ---------- Footer ---------- */
export function SiteFooter() {
  const groups = [
    { title: 'Studio', links: [['Work', '#work'], ['Services', '#services'], ['Process', '#process'], ['Pricing', '#pricing']] },
    { title: 'Work with us', links: [['For agencies', '#brief'], ['For companies', '#brief'], ['FAQ', '#faq'], ['Book an intro', site.bookingUrl]] },
  ]
  return (
    <footer className="px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="rounded-[32px] bg-tray px-5 pt-16 pb-8 sm:px-10 lg:px-14 lg:pt-24">
        <div className="mx-auto max-w-[1180px]">
          <p className="display max-w-[16em] text-[clamp(2.1rem,4.6vw,3.9rem)] leading-[1.04] tracking-[-0.04em]">
            Your next launch starts <span className="text-ink-muted">with a 20-minute call.</span>
          </p>

          <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-[1fr_1fr_1.3fr]">
            {groups.map((g, gi) => (
              <nav key={g.title} aria-label={g.title}>
                <p className="text-[15px] text-ink-muted">0{gi + 1} — {g.title}</p>
                <ul className="mt-5 max-w-[15rem] space-y-3">
                  {g.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="group flex items-center justify-between text-[15px] hover:text-hue-700">
                        {label} <Arrow className="size-3.5 text-ink-muted transition-transform group-hover:translate-x-0.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <div>
              <p className="text-[18px] font-medium">Start a project</p>
              <a href={site.bookingUrl} className="mt-5 flex h-14 items-center justify-between rounded-full bg-ink pr-2 pl-6 text-[15px] text-canvas">
                Book a 20-minute intro
                <span className="inline-flex h-10 items-center rounded-full bg-chip px-5 text-[14px] font-medium text-hue-900">Pick a time</span>
              </a>
              <p className="mt-4 text-[15px] text-ink-muted">
                Or email <a href={`mailto:${site.email}`} className="text-ink underline underline-offset-4">{site.email}</a>
              </p>
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-4 border-t border-line-strong pt-8 text-[14px] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-3"><Logo className="[&_svg]:size-6 [&>span:last-child]:text-[16px]" /> © 2026 VRAMP</span>
            <span>Senior product teams for agencies and companies</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
