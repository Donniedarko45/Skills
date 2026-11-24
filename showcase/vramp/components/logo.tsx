import { clsx } from 'clsx'

/** VRAMP mark: a V whose right arm climbs higher than the left, a ramp. */
export function Logo({ className, tone = 'night' }: { className?: string; tone?: 'night' | 'paper' }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 shrink-0">
        <rect width="32" height="32" rx="8" className="fill-volt" />
        <path d="M7 10 L13.5 23 L25 6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="text-on-volt" />
      </svg>
      <span className={clsx('text-[17px] font-semibold tracking-[0.14em]', tone === 'night' ? 'text-on-night' : 'text-ink')}>VRAMP</span>
    </span>
  )
}
