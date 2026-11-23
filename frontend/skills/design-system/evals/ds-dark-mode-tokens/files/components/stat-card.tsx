type StatCardProps = { label: string; value: string; delta: number }

export function StatCard({ label, value, delta }: StatCardProps) {
  const positive = delta >= 0
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
        {positive ? '+' : ''}{delta}% vs last week
      </span>
    </div>
  )
}
