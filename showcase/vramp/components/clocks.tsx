'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'

type Clock = { city: string; tz: string }

function timeIn(tz: string, now: Date) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(now)
}

function hourIn(tz: string, now: Date) {
  return Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(now))
}

/** Live local times across the network. Renders placeholders on the server, real times after mount. */
export function Clocks({ clocks }: { clocks: readonly Clock[] }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const awake = now ? clocks.filter((c) => { const h = hourIn(c.tz, now); return h >= 8 && h < 20 }).length : null

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">The network, right now</p>
        <p data-awake className="text-[12px] text-ink-muted" aria-live="polite">
          {awake === null ? ' ' : `${awake} of ${clocks.length} cities working`}
        </p>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {clocks.map((c) => {
          const h = now ? hourIn(c.tz, now) : null
          const working = h !== null && h >= 8 && h < 20
          return (
            <li key={c.city} data-tz={c.tz} className="flex items-center gap-3 py-2">
              <span data-dot className={clsx('size-1.5 rounded-full', working ? 'live-dot bg-hue-500' : 'bg-line-strong')} aria-hidden="true" />
              <span className="flex-1 text-[13px]">{c.city}</span>
              <span data-status className="text-[12px] text-ink-muted">{h === null ? ' ' : working ? 'Building' : 'Off'}</span>
              <span data-time className="w-12 text-right font-mono text-[13px] tabular-nums" suppressHydrationWarning>
                {now ? timeIn(c.tz, now) : '--:--'}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
