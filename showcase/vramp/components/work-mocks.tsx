// Small, illustrative product UIs for the case-study cards, drawn in HTML/CSS on white.
import { clsx } from 'clsx'

const frame = 'rounded-2xl bg-surface p-4 text-ink'

export function DashboardMock() {
  const bars = [38, 52, 44, 61, 57, 72, 66, 84, 78, 91, 88, 97]
  return (
    <div className={frame}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">Reconciliation</p>
        <p className="rounded-full bg-tray px-2 py-0.5 text-[11px] text-ink-muted">Nov 2026</p>
      </div>
      <p className="mt-3 text-[11px] text-ink-muted">Matched this month</p>
      <p className="flex items-baseline gap-2">
        <span className="text-[26px] font-light tracking-[-0.04em] tabular-nums">18,402</span>
        <span className="text-[11px] font-medium text-success-ink">+12.4%</span>
      </p>
      <div className="mt-3 flex h-16 items-end gap-1" aria-hidden="true">
        {bars.map((h, i) => (
          <span key={i} className={clsx('flex-1 rounded-[3px]', i >= bars.length - 2 ? 'bg-hue-500' : 'bg-hue-200')} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

export function MobileMock() {
  return (
    <div className={frame}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">Today&apos;s plan</p>
        <p className="text-[11px] text-ink-muted">Pulse · iOS</p>
      </div>
      <div className="mt-3 rounded-xl bg-brand p-3 text-white">
        <p className="text-[11px]">Next appointment</p>
        <p className="text-[14px] font-semibold">Dr. Osei · 10:30</p>
      </div>
      {[
        ['Metformin 500 mg', 'Taken 08:02'],
        ['Walk 20 minutes', '12 of 20 min'],
      ].map(([t, s]) => (
        <div key={t} className="mt-2 flex items-center justify-between rounded-lg border border-line px-2.5 py-2">
          <span className="text-[12px] font-medium">{t}</span>
          <span className="text-[11px] text-ink-muted">{s}</span>
        </div>
      ))}
    </div>
  )
}

export function AiMock() {
  return (
    <div className={frame}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">Ticket #48213</p>
        <p className="rounded-full bg-hue-100 px-2 py-0.5 text-[11px] font-medium text-hue-700">Auto-resolved</p>
      </div>
      <div className="mt-3 space-y-2 text-[12px] leading-snug">
        <p className="max-w-[85%] rounded-xl rounded-tl-sm bg-tray px-3 py-2">My CSV export stops at 10,000 rows.</p>
        <div className="ml-auto max-w-[90%] rounded-xl rounded-tr-sm bg-hue-50 px-3 py-2">
          <p>Exports over 10k rows run in the background. The file arrives by email in about two minutes.</p>
          <p className="mt-1.5 font-mono text-[10.5px] text-ink-muted">Help centre · Exports §3 · 0.94</p>
        </div>
      </div>
    </div>
  )
}
