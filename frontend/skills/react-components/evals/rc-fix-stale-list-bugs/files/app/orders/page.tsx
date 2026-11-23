import { initialOrders } from '@/lib/orders'
import { OrdersClient } from './orders-client'

export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Orders</h1>
      <OrdersClient initial={initialOrders} />
    </main>
  )
}
