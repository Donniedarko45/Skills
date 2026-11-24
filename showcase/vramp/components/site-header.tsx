import { nav, site } from '@/lib/content'
import { Logo } from './logo'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-canvas">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#top" aria-label="VRAMP home" className="rounded-lg">
          <Logo />
        </a>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-line bg-surface p-1 text-[14px]">
            {nav.map((item, i) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={i === 0 ? 'page' : undefined}
                  className={
                    i === 0
                      ? 'inline-flex h-9 items-center rounded-full bg-ink px-4 font-medium text-canvas'
                      : 'inline-flex h-9 items-center rounded-full px-4 text-ink-muted transition-colors hover:text-ink'
                  }
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a href={site.bookingUrl} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium text-canvas transition-opacity hover:opacity-85">
            Book an intro
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
              <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <details className="relative md:hidden">
            <summary aria-label="Menu" className="grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-surface">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
                <path d="M3 7h14M3 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </summary>
            <ul className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-surface p-2 shadow-xl">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="block rounded-xl px-3 py-2.5 text-[15px] hover:bg-tray">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </header>
  )
}
