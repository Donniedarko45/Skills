import { nav, site } from '@/lib/content'
import { Logo } from './logo'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-night-line bg-night/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <a href="#top" aria-label={`${site.name} home`} className="rounded-md">
          <Logo />
        </a>

        <nav aria-label="Main" className="hidden items-center gap-8 text-sm text-on-night-muted md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-on-night">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={site.bookingUrl}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-volt px-4 text-sm font-medium text-on-volt transition-colors hover:bg-volt-strong"
          >
            Book an intro
          </a>
          {/* Mobile menu without JavaScript */}
          <details className="group relative md:hidden">
            <summary className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full border border-night-line text-on-night [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Menu</span>
              <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="group-open:hidden" />
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="hidden group-open:block" />
              </svg>
            </summary>
            <nav aria-label="Mobile" className="absolute right-0 mt-3 w-56 rounded-2xl border border-night-line bg-night-2 p-2 shadow-2xl">
              {nav.map((item) => (
                <a key={item.href} href={item.href} className="block rounded-xl px-3 py-2.5 text-sm text-on-night hover:bg-night-3">
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
