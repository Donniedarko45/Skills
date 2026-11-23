'use client'

import { useEffect, useState } from 'react'
import type { Order, OrderStatus } from '@/lib/orders'

type Props = {
  orders: Order[]
}

export function OrderList(props: Props) {
  const [items, setItems] = useState(props.orders)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [filtered, setFiltered] = useState<Order[]>(props.orders)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setFiltered(filter === 'all' ? items : items.filter((o) => o.status === filter))
  }, [filter])

  useEffect(() => {
    setTotal(filtered.reduce((sum, o) => sum + o.totalCents, 0))
  }, [filtered])

  function deleteOrder(index: number) {
    const order = filtered[index]
    const nextItems = items.filter((o) => o.id !== order.id)
    setItems(nextItems)
    setFiltered(filtered.filter((_, i) => i !== index))
  }

  function Row({ order, index }: { order: Order; index: number }) {
    return (
      <li
        onClick={() => setSelectedIndex(index)}
        className={`flex cursor-pointer items-center justify-between rounded px-3 py-2 ${selectedIndex === index ? 'bg-gray-100' : ''}`}
      >
        <span>
          {order.customer} <span className="text-xs text-gray-500">{order.status}</span>
        </span>
        <span className="flex items-center gap-3">
          ${(order.totalCents / 100).toFixed(2)}
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteOrder(index)
            }}
            className="text-xs text-red-600"
          >
            Delete
          </button>
        </span>
      </li>
    )
  }

  const selected = selectedIndex !== null ? filtered[selectedIndex] : null

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm">Status</label>
          <select id="status-filter" value={filter} onChange={(e) => setFilter(e.target.value as OrderStatus | 'all')} className="rounded border px-2 py-1 text-sm">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="ml-auto text-sm text-gray-600">Total ${(total / 100).toFixed(2)}</span>
        </div>
        <ul className="divide-y rounded border">
          {filtered.map((order, i) => (
            <Row key={i} order={order} index={i} />
          ))}
        </ul>
      </div>
      <aside className="rounded border p-4">
        {selected ? (
          <>
            <h2 className="font-semibold">{selected.customer}</h2>
            <p className="text-sm text-gray-600">{selected.id}</p>
            <p className="mt-2">${(selected.totalCents / 100).toFixed(2)}</p>
            <p className="text-sm">Status: {selected.status}</p>
          </>
        ) : (
          <p className="text-sm text-gray-500">Select an order</p>
        )}
      </aside>
    </div>
  )
}
