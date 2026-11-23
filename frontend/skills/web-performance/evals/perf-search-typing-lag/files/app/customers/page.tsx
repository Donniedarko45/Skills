import { getCustomers } from '@/lib/customers'
import { CustomerTable } from '@/components/customer-table'

export default function CustomersPage() {
  const customers = getCustomers()
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Customers</h1>
      <CustomerTable customers={customers} />
    </main>
  )
}
