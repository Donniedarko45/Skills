export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled'
export type Order = {
  id: string
  customer: string
  totalCents: number
  status: OrderStatus
  placedAt: string
}

export const initialOrders: Order[] = [
  { id: 'ord_1001', customer: 'Northwind Traders', totalCents: 48250, status: 'pending', placedAt: '2026-11-20T10:12:00Z' },
  { id: 'ord_1002', customer: 'Blue Fern Studio', totalCents: 12900, status: 'shipped', placedAt: '2026-11-19T16:40:00Z' },
  { id: 'ord_1003', customer: 'Harbor & Pine', totalCents: 220000, status: 'delivered', placedAt: '2026-11-18T09:05:00Z' },
  { id: 'ord_1004', customer: 'Kite Analytics', totalCents: 7400, status: 'pending', placedAt: '2026-11-18T08:51:00Z' },
  { id: 'ord_1005', customer: 'Moss Coffee Co.', totalCents: 31575, status: 'cancelled', placedAt: '2026-11-17T13:22:00Z' },
  { id: 'ord_1006', customer: 'Larkspur Health', totalCents: 96000, status: 'shipped', placedAt: '2026-11-16T11:00:00Z' },
]

let next = 1007
export function makeSampleOrder(): Order {
  const id = `ord_${next++}`
  return { id, customer: `Walk-in customer ${id.slice(4)}`, totalCents: 5000 + (next % 7) * 1250, status: 'pending', placedAt: new Date().toISOString() }
}
