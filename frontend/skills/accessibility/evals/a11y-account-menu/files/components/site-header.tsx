import Link from 'next/link'

const user = { name: 'Dana Whitfield', email: 'dana@relay.example', initials: 'DW' }

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-semibold">Relay</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/">Inbox</Link>
          <Link href="/settings">Settings</Link>
          {/* TODO: account menu goes here, opened from the avatar */}
          <span className="grid size-8 place-items-center rounded-full bg-gray-900 text-xs font-medium text-white">{user.initials}</span>
        </nav>
      </div>
    </header>
  )
}
