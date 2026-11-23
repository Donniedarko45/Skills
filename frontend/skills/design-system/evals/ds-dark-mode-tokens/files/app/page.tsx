import { StatCard } from '@/components/stat-card'

const members = [
  { name: 'Dana Whitfield', role: 'Design lead', status: 'Active', focus: 87 },
  { name: 'Rafael Ortiz', role: 'Engineer', status: 'Away', focus: 64 },
  { name: 'Mei Chen', role: 'Engineer', status: 'Active', focus: 91 },
  { name: 'Sam Patel', role: 'PM', status: 'Offline', focus: 42 },
]

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Team pulse</h1>
          <p className="text-sm text-gray-500">Week of Nov 16 - 22</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Export</button>
          <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Invite member</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Focus time" value="31.5 h" delta={8} />
        <StatCard label="Meetings" value="12.0 h" delta={-14} />
        <StatCard label="PRs merged" value="46" delta={21} />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Focus score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => (
              <tr key={m.name}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{m.name}</p>
                  <p className="text-gray-500">{m.role}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.status === 'Active' ? 'bg-green-100 text-green-800' : m.status === 'Away' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>{m.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${m.focus}%` }} />
                    </div>
                    <span className="text-gray-700">{m.focus}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
