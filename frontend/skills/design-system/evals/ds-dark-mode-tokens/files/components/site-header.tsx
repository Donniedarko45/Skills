import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-semibold text-gray-900">Pulse</Link>
        <nav className="flex items-center gap-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">Dashboard</Link>
          <Link href="/settings" className="hover:text-gray-900">Settings</Link>
        </nav>
      </div>
    </header>
  )
}
