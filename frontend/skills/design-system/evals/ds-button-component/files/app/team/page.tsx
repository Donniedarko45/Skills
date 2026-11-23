'use client'

const members = ['Dana Whitfield', 'Rafael Ortiz', 'Mei Chen']

export default function TeamPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Team</h1>
        <button onClick={() => alert('invite')} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Invite</button>
      </div>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m} className="flex items-center justify-between rounded-md border px-4 py-3">
            {m}
            <button onClick={() => alert('remove ' + m)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
