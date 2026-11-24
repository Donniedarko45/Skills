import { clsx } from 'clsx'
import { site, team } from '@/lib/content'

const shadow = 'shadow-[0_30px_70px_-30px_oklch(0.25_0.04_265/0.35)]'

function Arrow({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const avatarTints = ['bg-hue-200 text-ink', 'bg-hue-300 text-ink', 'bg-tag-yellow text-on-yellow']

function Initials({ text, i = 0, className }: { text: string; i?: number; className?: string }) {
  return (
    <span className={clsx('grid shrink-0 place-items-center rounded-full font-semibold', avatarTints[i % 3], className)}>{text}</span>
  )
}

/* ---------- Multiplayer cursor tag, as in a shared design file ---------- */
function CursorTag({ label, tone, side, className }: { label: string; tone: 'blue' | 'yellow'; side: 'left' | 'right'; className?: string }) {
  return (
    <div aria-hidden="true" className={clsx('absolute', className)}>
      <svg
        viewBox="0 0 20 20"
        className={clsx('absolute -top-4 size-5', side === 'left' ? '-right-3 -scale-x-100' : '-left-3', tone === 'blue' ? 'fill-brand' : 'fill-tag-yellow')}
      >
        <path d="M3 2 L17 8.5 L10.5 10.5 L8 17 Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
      <span className={clsx('block rounded-md px-2.5 py-1 text-[13px] font-medium whitespace-nowrap shadow-sm', tone === 'blue' ? 'bg-brand text-white' : 'bg-tag-yellow text-on-yellow')}>
        {label}
      </span>
    </div>
  )
}

/* ---------- The phone: an app the team shipped ---------- */
function Phone() {
  return (
    <div className="absolute top-0 left-1/2 h-[560px] w-[250px] -translate-x-1/2 rounded-[46px] border-[9px] border-ink bg-surface sm:w-[290px] lg:h-[620px] lg:w-[300px]">
      <div className="flex h-full flex-col px-4 pt-3 text-ink">
        {/* status bar */}
        <div className="flex items-center justify-between px-1 text-[11px] font-semibold">
          <span>9:41</span>
          <span className="h-[22px] w-[78px] rounded-full bg-ink" />
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="flex items-end gap-[2px]">
              {[4, 6, 8, 10].map((h) => <span key={h} className="w-[3px] rounded-sm bg-ink" style={{ height: h }} />)}
            </span>
            <span className="h-[9px] w-[18px] rounded-[3px] border border-ink p-[1px]"><span className="block h-full w-3/4 rounded-[1px] bg-ink" /></span>
          </span>
        </div>

        {/* app header */}
        <div className="mt-5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[14px] font-semibold tracking-tight">
            <span className="grid size-5 place-items-center rounded-md bg-brand text-[11px] text-white">+</span>
            Pulse
          </span>
          <Initials text="AN" i={1} className="size-7 text-[10px]" />
        </div>

        <p className="mt-5 text-[12px] text-ink-muted">Good morning, Ana</p>
        <p className="text-[22px] font-medium tracking-[-0.03em]">Today&apos;s plan</p>

        <div className="mt-3 rounded-2xl bg-brand p-3.5 text-white">
          <p className="text-[11px]">Next appointment</p>
          <p className="mt-0.5 text-[16px] font-semibold tracking-tight">Dr. Osei · 10:30</p>
          <div className="mt-2.5 flex items-center justify-between">
            <p className="text-[11px]">Video call · 20 min</p>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-brand">Join</span>
          </div>
        </div>

        <p className="mt-4 text-[12px] font-medium">Medication</p>
        {[
          ['Metformin 500 mg', 'Taken 08:02', true],
          ['Vitamin D', 'Due 12:00', false],
        ].map(([t, s, done]) => (
          <div key={t as string} className="mt-2 flex items-center gap-2.5 rounded-xl border border-line p-2.5">
            <span className={clsx('grid size-5 place-items-center rounded-full text-[10px]', done ? 'bg-brand text-white' : 'border border-line-strong')}>{done ? '✓' : ''}</span>
            <span className="leading-tight">
              <span className="block text-[12px] font-medium">{t}</span>
              <span className="block text-[11px] text-ink-muted">{s}</span>
            </span>
          </div>
        ))}

        <div className="mt-3 rounded-xl bg-tray p-3">
          <div className="flex justify-between text-[11px]">
            <span className="font-medium">Walk 20 minutes</span>
            <span className="text-ink-muted tabular-nums">12 / 20</span>
          </div>
          <div className="mt-2 flex gap-[3px]">
            {Array.from({ length: 20 }, (_, i) => (
              <span key={i} className={clsx('h-2 flex-1 rounded-full', i < 12 ? 'bg-hue-500' : 'bg-line-strong/60')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Floating fragments ---------- */
function TeamCard({ className }: { className?: string }) {
  return (
    <div className={clsx('absolute rounded-2xl border border-line bg-surface p-4', shadow, className)}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">Team matched</p>
        <p className="font-mono text-[11px] text-ink-muted">48h</p>
      </div>
      <ul className="mt-3 space-y-2.5">
        {team.map((m, i) => (
          <li key={m.initials} className="flex items-center gap-2.5">
            <Initials text={m.initials} i={i} className="size-8 text-[11px]" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[13px] font-medium">{m.role}</span>
              <span className="block text-[12px] text-ink-muted">{m.city}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ThisWeekCard({ className }: { className?: string }) {
  const rows = [
    ['KO', 'Payments API', 'Merged', 'Tue'],
    ['IM', 'Onboarding v2', 'In review', 'Wed'],
    ['RA', 'iOS build 1.4', 'Shipped', 'Thu'],
  ]
  return (
    <div className={clsx('absolute rounded-2xl border border-line bg-surface p-4', shadow, className)}>
      <p className="text-[13px] font-medium">This week</p>
      <ul className="mt-3 space-y-3">
        {rows.map(([who, what, state, day], i) => (
          <li key={what} className="flex items-center gap-2.5">
            <Initials text={who} i={i} className="size-8 text-[11px]" />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-medium">{what}</span>
              <span className="block text-[12px] text-ink-muted">{day}</span>
            </span>
            <span className={clsx('text-[12px] font-medium', state === 'In review' ? 'text-ink-muted' : 'text-success-ink')}>{state}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SprintCard({ className }: { className?: string }) {
  return (
    <div className={clsx('absolute rounded-2xl border border-line bg-surface p-4', shadow, className)}>
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] font-medium">Sprint 3 of 6</p>
        <p className="text-[12px] text-ink-muted">Demo · Fri 16:00</p>
      </div>
      <div className="mt-3 flex gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={clsx('h-7 flex-1 rounded-md', i < 2 ? 'bg-hue-300' : i === 2 ? 'bg-hue-500' : 'bg-tray')} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
        <span>Kickoff</span>
        <span>Launch</span>
      </div>
    </div>
  )
}

function FirstCommitCard({ className }: { className?: string }) {
  return (
    <div className={clsx('absolute rounded-2xl border border-line bg-surface p-4', shadow, className)}>
      <p className="text-[12px] text-ink-muted">Kickoff to first commit</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="text-[34px] leading-none font-light tracking-[-0.04em] tabular-nums">71h</span>
        <span className="rounded-full bg-hue-100 px-2 py-0.5 text-[11px] font-medium text-hue-700">Day 3</span>
      </p>
      <p className="mt-2 font-mono text-[11px] text-ink-muted">main · #1 · scaffold + CI</p>
    </div>
  )
}

function HeroStage() {
  return (
    <div className="relative mx-auto mt-12 h-[470px] max-w-[1240px] overflow-hidden sm:h-[520px] lg:mt-16 lg:h-[560px]">
      {/* concentric rings and a soft disc behind the phone */}
      <svg aria-hidden="true" viewBox="0 0 1240 560" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <circle cx="620" cy="640" r="330" className="fill-tray" />
        {[330, 450, 570, 690].map((r) => (
          <circle key={r} cx="620" cy="640" r={r} fill="none" className="stroke-line" strokeWidth="1" />
        ))}
      </svg>

      <Phone />

      <TeamCard className="float top-[272px] left-2 w-[190px] sm:left-[6%] sm:w-[240px] lg:top-[150px] lg:left-[3%] lg:w-[280px]" />
      <ThisWeekCard className="float top-[96px] right-2 hidden w-[300px] sm:block sm:right-[4%] lg:top-[70px] lg:right-[3%] lg:w-[330px]" />
      <SprintCard className="float top-[400px] left-[17%] hidden w-[270px] lg:block" />
      <FirstCommitCard className="float top-[318px] right-2 w-[170px] sm:top-[340px] sm:right-[10%] sm:w-[220px] lg:top-[360px] lg:right-[17%]" />

      <CursorTag label="Ines · Design" tone="blue" side="left" className="top-[150px] right-2 sm:right-auto sm:left-[24%] lg:top-[70px] lg:left-[22%]" />
      <CursorTag label="Kofi · Engineering" tone="yellow" side="right" className="top-[290px] right-[30%] hidden sm:block lg:top-[300px] lg:right-[29%]" />

      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-canvas to-transparent" />
    </div>
  )
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-5 sm:px-8">
      <div className="mx-auto max-w-3xl pt-12 text-center lg:pt-16">
        <p className="rise inline-flex items-center gap-2.5 rounded-full border border-line bg-surface py-1 pr-3.5 pl-1 text-[13px] text-ink-muted" style={{ ['--i' as string]: 0 }}>
          <span className="flex -space-x-1.5" aria-hidden="true">
            {['IM', 'KO', 'RA'].map((t, i) => (
              <Initials key={t} text={t} i={i} className="size-6 text-[9px] ring-2 ring-surface" />
            ))}
          </span>
          <span><span className="font-medium text-ink">60+</span> agencies and product teams ship with us</span>
        </p>

        <h1 className="rise display mt-7 text-[clamp(2.6rem,5.8vw,4.75rem)]" style={{ ['--i' as string]: 1 }}>
          Senior product teams,
          <br />
          <span className="text-ink-faint">ramped up in 72 hours.</span>
        </h1>

        <p className="rise mx-auto mt-6 max-w-[36rem] text-[17px] leading-relaxed text-pretty text-ink-muted" style={{ ['--i' as string]: 2 }}>
          Designers and engineers who join your team in days, not months. Agencies bring us in under their name; companies bring us in to ship.
        </p>

        <div className="rise mt-8 flex flex-wrap items-center justify-center gap-3" style={{ ['--i' as string]: 3 }}>
          <a href={site.bookingUrl} className="group inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium text-canvas transition-opacity hover:opacity-85">
            Book a 20-minute intro
            <Arrow className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a href="#work" className="inline-flex h-12 items-center rounded-full border border-line-strong px-6 text-[15px] font-medium transition-colors hover:bg-surface">
            See the work
          </a>
        </div>
      </div>

      <HeroStage />
    </section>
  )
}
