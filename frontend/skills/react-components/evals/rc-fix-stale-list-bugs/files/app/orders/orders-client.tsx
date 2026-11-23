'use client'

import { useState } from 'react'
import { OrderList } from '@/components/order-list'
import { makeSampleOrder, type Order } from '@/lib/orders'

// Simulates orders arriving from a websocket.
export function OrdersClient({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial)
  return (
    <div className="space-y-4">
      <button onClick={() => setOrders((prev) => [makeSampleOrder(), ...prev])} className="rounded bg-black px-3 py-1.5 text-sm text-white">
        Simulate new order
      </button>
      <OrderList orders={orders} />
    </div>
  )
}
