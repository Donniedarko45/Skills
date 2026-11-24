// Small, illustrative product UIs for the case studies, drawn in HTML/CSS.

export function DashboardMock() {
  const bars = [38, 52, 44, 61, 57, 72, 66, 84, 78, 91, 88, 97]
  return (
    <div className="rounded-2xl border border-carbon-line bg-carbon p-4 text-on-carbon">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">Reconciliation</p>
        <p className="label text-on-carbon-muted">Nov · 2026</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ['Matched', '18,402', 'text-signal'],
          ['Pending', '214', 'text-on-carbon'],
          ['Exceptions', '9', 'text-[oklch(0.75_0.15_40)]'],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-lg bg-carbon-2 p-2.5">
            <p className="text-[11px] text-on-carbon-muted">{k}</p>
            <p className={`mt-0.5 text-[17px] font-semibold tabular-nums ${c}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-20 items-end gap-1.5 rounded-lg bg-carbon-2 p-2.5" aria-hidden="true">
        {bars.map((h, i) => (
          <span key={i} className={`flex-1 rounded-sm ${i >= bars.length - 2 ? 'bg-signal' : 'bg-carbon-3'}`} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

export function MobileMock() {
  return (
    <div className="mx-auto w-[210px] rounded-[30px] border border-carbon-line bg-carbon p-2.5 text-on-carbon shadow-2xl">
      <div className="rounded-[22px] bg-carbon-2 p-3.5">
        <p className="text-[11px] text-on-carbon-muted">Good morning, Ana</p>
        <p className="mt-0.5 text-[15px] font-semibold">Today&apos;s plan</p>
        <div className="mt-3 rounded-xl bg-signal p-3 text-on-signal">
          <p className="text-[11px] font-medium opacity-80">Next appointment</p>
          <p className="text-[14px] font-semibold">Dr. Osei · 10:30</p>
          <p className="text-[11px] opacity-80">Video call · 20 min</p>
        </div>
        {[
          ['Metformin 500 mg', 'Taken 08:02'],
          ['Walk 20 minutes', '12 of 20 min'],
        ].map(([t, s]) => (
          <div key={t} className="mt-2 flex items-center gap-2.5 rounded-xl bg-carbon-3 p-2.5">
            <span className="size-2 rounded-full bg-signal" aria-hidden="true" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[12px]">{t}</span>
              <span className="block text-[10.5px] text-on-carbon-muted">{s}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AiMock() {
  return (
    <div className="rounded-2xl border border-carbon-line bg-carbon p-4 text-on-carbon">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">Ticket #48213</p>
        <p className="label rounded-full bg-signal/15 px-2 py-0.5 text-signal">Auto-resolved</p>
      </div>
      <div className="mt-3 space-y-2 text-[12.5px] leading-snug">
        <p className="max-w-[85%] rounded-xl rounded-tl-sm bg-carbon-2 px-3 py-2">My export to CSV stops at 10,000 rows.</p>
        <div className="ml-auto max-w-[88%] rounded-xl rounded-tr-sm bg-carbon-3 px-3 py-2">
          <p>Exports over 10k rows run in the background. You&apos;ll get an email with the file in about two minutes.</p>
          <p className="label mt-2 text-on-carbon-muted">Source · Help centre / Exports §3 · confidence 0.94</p>
        </div>
      </div>
    </div>
  )
}
