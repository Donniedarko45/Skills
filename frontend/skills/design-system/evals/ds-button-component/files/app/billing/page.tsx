export default function BillingPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <div className="rounded-md border p-6">
        <p>You are on the <strong>Team</strong> plan, $48 / month.</p>
        <div className="mt-4 flex gap-3">
          <button className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Upgrade plan</button>
          <button className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">Download invoices</button>
          <button className="ml-auto rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">Cancel subscription</button>
        </div>
      </div>
    </main>
  )
}
