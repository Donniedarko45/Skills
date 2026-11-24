import { clsx } from 'clsx'

/** VRAMP mark: a V whose right arm climbs higher than the left, a ramp. */
export function Logo({ className, tone = 'ink' }: { className?: string; tone?: 'ink' | 'light' }) {
  const light = tone === 'light'
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 shrink-0">
        <rect width="32" height="32" rx="9" className={light ? 'fill-on-hue-900' : 'fill-ink'} />
        <path d="M8 11 L14 22.5 L24.5 8" fill="none" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className={light ? 'stroke-hue-900' : 'stroke-canvas'} />
      </svg>
      <span className={clsx('text-[19px] font-semibold tracking-[-0.03em]', light ? 'text-on-hue-900' : 'text-ink')}>vramp</span>
    </span>
  )
}
