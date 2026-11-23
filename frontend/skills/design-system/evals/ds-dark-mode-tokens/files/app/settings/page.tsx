export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      <form className="mt-6 space-y-5 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <label htmlFor="team" className="block text-sm font-medium text-gray-700">Team name</label>
          <input id="team" defaultValue="Platform" className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none" />
        </div>
        <div>
          <label htmlFor="digest" className="block text-sm font-medium text-gray-700">Weekly digest</label>
          <select id="digest" className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900">
            <option>Monday morning</option>
            <option>Friday afternoon</option>
            <option>Off</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">Sent to every member of the team.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-5">
          <button type="button" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Save</button>
        </div>
      </form>
    </main>
  )
}
