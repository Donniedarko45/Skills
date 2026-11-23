import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <div className="flex gap-3">
        <Link href="/projects" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
          View projects
        </Link>
        <a href="/billing">
          <button className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            Billing
          </button>
        </a>
      </div>
    </main>
  )
}
