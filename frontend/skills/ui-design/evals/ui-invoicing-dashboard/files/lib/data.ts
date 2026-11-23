// Sample data for the Ledgerly invoicing app. Amounts are in cents, USD.
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export type Invoice = {
  id: string
  number: string
  customer: string
  customerEmail: string
  amountCents: number
  status: InvoiceStatus
  issuedOn: string
  dueOn: string
  paidOn?: string
}

export const currentUser = { name: 'Amara Okafor', company: 'Okafor Design Studio' }

export const today = '2026-11-23'

export const monthlyRevenue: { month: string; collectedCents: number; invoicedCents: number }[] = [
  { month: '2025-12', collectedCents: 1842000, invoicedCents: 2010000 },
  { month: '2026-01', collectedCents: 1520000, invoicedCents: 1675000 },
  { month: '2026-02', collectedCents: 1698000, invoicedCents: 1800000 },
  { month: '2026-03', collectedCents: 2104000, invoicedCents: 2230000 },
  { month: '2026-04', collectedCents: 1950000, invoicedCents: 2120000 },
  { month: '2026-05', collectedCents: 2286000, invoicedCents: 2400000 },
  { month: '2026-06', collectedCents: 2412000, invoicedCents: 2390000 },
  { month: '2026-07', collectedCents: 1987000, invoicedCents: 2205000 },
  { month: '2026-08', collectedCents: 2134000, invoicedCents: 2280000 },
  { month: '2026-09', collectedCents: 2560000, invoicedCents: 2715000 },
  { month: '2026-10', collectedCents: 2718000, invoicedCents: 2890000 },
  { month: '2026-11', collectedCents: 1904500, invoicedCents: 3120000 },
]

export const invoices: Invoice[] = [
  { id: 'inv_a1', number: 'INV-2026-0142', customer: 'Northwind Traders', customerEmail: 'ap@northwind.example', amountCents: 840000, status: 'sent', issuedOn: '2026-11-18', dueOn: '2026-12-18' },
  { id: 'inv_a2', number: 'INV-2026-0141', customer: 'Harbor & Pine', customerEmail: 'finance@harborpine.example', amountCents: 325000, status: 'paid', issuedOn: '2026-11-12', dueOn: '2026-11-26', paidOn: '2026-11-20' },
  { id: 'inv_a3', number: 'INV-2026-0140', customer: 'Kite Analytics', customerEmail: 'billing@kite.example', amountCents: 1260000, status: 'overdue', issuedOn: '2026-10-14', dueOn: '2026-11-13' },
  { id: 'inv_a4', number: 'INV-2026-0139', customer: 'Moss Coffee Co.', customerEmail: 'hello@mosscoffee.example', amountCents: 98000, status: 'paid', issuedOn: '2026-11-05', dueOn: '2026-11-19', paidOn: '2026-11-18' },
  { id: 'inv_a5', number: 'INV-2026-0138', customer: 'Larkspur Health', customerEmail: 'accounts@larkspur.example', amountCents: 450000, status: 'overdue', issuedOn: '2026-10-01', dueOn: '2026-10-31' },
  { id: 'inv_a6', number: 'INV-2026-0137', customer: 'Blue Fern Studio', customerEmail: 'studio@bluefern.example', amountCents: 275000, status: 'sent', issuedOn: '2026-11-02', dueOn: '2026-12-02' },
  { id: 'inv_a7', number: 'INV-2026-0136', customer: 'Quarry Labs', customerEmail: 'ops@quarrylabs.example', amountCents: 615000, status: 'paid', issuedOn: '2026-10-28', dueOn: '2026-11-27', paidOn: '2026-11-09' },
  { id: 'inv_a8', number: 'INV-2026-0135', customer: 'Northwind Traders', customerEmail: 'ap@northwind.example', amountCents: 390000, status: 'draft', issuedOn: '2026-11-21', dueOn: '2026-12-21' },
]
