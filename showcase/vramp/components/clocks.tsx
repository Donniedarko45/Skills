'use client'

import { useEffect, useState } from 'react'

type Clock = { city: string; tz: string }

function timeIn(tz: string, now: Date) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(now)
}

function hourIn(tz: string, now: Date) {
  return Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(now))
}

/** Live local times across the network. Renders placeholders on the server, real times after mount. */
export function Clocks({ clocks }: { clocks: Clock[] }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const awake = now ? clocks.filter((c) => { const h = hourIn(c.tz, now); return h >= 8 && h < 20 }).length : null

  return (
    <div>
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {clocks.map((c) => {
          const h = now ? hourIn(c.tz, now) : null
          const working = h !== null && h >= 8 && h < 20
          return (
            <li key={c.city} data-tz={c.tz} className="bg-surface p-4">
              <p className="text-sm text-muted">{c.city}</p>
              <p data-time className="mt-1 font-mono text-2xl tracking-tight tabular-nums text-ink" suppressHydrationWarning>
                {now ? timeIn(c.tz, now) : '--:--'}
              </p>
              <p className="label mt-2 flex items-center gap-1.5 text-muted">
                <span data-dot className={`size-1.5 rounded-full ${working ? 'live-dot bg-volt-ink' : 'bg-line-strong'}`} aria-hidden="true" />
                <span data-status>{h === null ? ' ' : working ? 'Building' : 'Off'}</span>
              </p>
            </li>
          )
        })}
      </ul>
      <p data-awake className="mt-3 text-sm text-muted" aria-live="polite">
        {awake === null ? ' ' : `Right now, ${awake} of these ${clocks.length} cities are in working hours.`}
      </p>
    </div>
  )
}
