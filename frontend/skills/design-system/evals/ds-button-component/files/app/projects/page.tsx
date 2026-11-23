'use client'

import { useState } from 'react'

const projects = ['Website redesign', 'Mobile app v2', 'Data warehouse migration']

export default function ProjectsPage() {
  const [saving, setSaving] = useState(false)

  async function createProject() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1200))
    setSaving(false)
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <button onClick={createProject} disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
          {saving ? 'Creating…' : 'New project'}
        </button>
      </div>
      <ul className="divide-y rounded-md border">
        {projects.map((p) => (
          <li key={p} className="flex items-center justify-between px-4 py-3">
            {p}
            <div className="flex gap-2">
              <button className="rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Edit</button>
              <button className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
