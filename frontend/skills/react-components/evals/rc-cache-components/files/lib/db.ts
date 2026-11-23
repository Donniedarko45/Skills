import 'server-only'

// Stand-in for a slow Postgres query. Data lives in process memory for this demo.
export type Product = { id: string; name: string; priceCents: number; category: string; updatedAt: string }

const g = globalThis as unknown as { __products?: Product[]; __dbQueries?: number }
g.__products ??= [
  { id: 'p1', name: 'Juniper Lounge Chair', priceCents: 64900, category: 'Seating', updatedAt: '2026-11-01T10:00:00Z' },
  { id: 'p2', name: 'Alder Side Table', priceCents: 21900, category: 'Tables', updatedAt: '2026-11-03T12:30:00Z' },
  { id: 'p3', name: 'Fen Floor Lamp', priceCents: 18900, category: 'Lighting', updatedAt: '2026-11-08T09:15:00Z' },
  { id: 'p4', name: 'Moor Wool Throw', priceCents: 9900, category: 'Textiles', updatedAt: '2026-11-12T16:45:00Z' },
]
g.__dbQueries ??= 0

export async function getProducts(): Promise<Product[]> {
  g.__dbQueries! += 1
  await new Promise((resolve) => setTimeout(resolve, 400))
  return structuredClone(g.__products!)
}

export async function getProduct(id: string): Promise<Product | null> {
  g.__dbQueries! += 1
  await new Promise((resolve) => setTimeout(resolve, 150))
  return structuredClone(g.__products!.find((p) => p.id === id) ?? null)
}

export async function updateProduct(id: string, data: { name: string; priceCents: number }) {
  const product = g.__products!.find((p) => p.id === id)
  if (!product) throw new Error('Product not found')
  Object.assign(product, data, { updatedAt: new Date().toISOString() })
}

export function dbQueryCount() {
  return g.__dbQueries!
}
