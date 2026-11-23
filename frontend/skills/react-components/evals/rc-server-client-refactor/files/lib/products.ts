// Pretend database. In production this queries Postgres.
export type Review = { id: string; author: string; rating: number; body: string; createdAt: string }
export type Product = {
  id: string
  name: string
  description: string
  priceCents: number
  images: { src: string; alt: string }[]
  stock: number
  updatedAt: string
  reviews: Review[]
}

const products: Product[] = [
  {
    id: 'trail-runner-2',
    name: 'Trail Runner 2',
    description:
      'A lightweight trail shoe with a rock plate, 6mm drop and a lugged outsole that grips on wet roots and loose gravel.',
    priceCents: 13900,
    images: [
      { src: '/products/trail-1.svg', alt: 'Trail Runner 2, side view in moss green' },
      { src: '/products/trail-2.svg', alt: 'Trail Runner 2 outsole showing 5mm lugs' },
      { src: '/products/trail-3.svg', alt: 'Trail Runner 2 on a rocky path' },
    ],
    stock: 14,
    updatedAt: '2026-11-02T09:30:00Z',
    reviews: [
      { id: 'r1', author: 'Priya S.', rating: 5, body: 'Grippy and comfortable from the first run.', createdAt: '2026-10-21T18:02:00Z' },
      { id: 'r2', author: 'Marcus L.', rating: 4, body: 'Runs slightly narrow; size up half a size.', createdAt: '2026-10-11T07:45:00Z' },
      { id: 'r3', author: 'Jo K.', rating: 5, body: 'Survived a muddy 50k without complaint.', createdAt: '2026-09-29T12:10:00Z' },
    ],
  },
  {
    id: 'summit-shell',
    name: 'Summit Shell Jacket',
    description: 'Three-layer waterproof shell with pit zips and a helmet-compatible hood.',
    priceCents: 32000,
    images: [{ src: '/products/shell-1.svg', alt: 'Summit Shell Jacket in orange' }],
    stock: 0,
    updatedAt: '2026-10-15T14:00:00Z',
    reviews: [],
  },
]

export async function getProduct(id: string): Promise<Product | null> {
  await new Promise((resolve) => setTimeout(resolve, 80))
  return products.find((p) => p.id === id) ?? null
}

export async function getAllProductIds(): Promise<string[]> {
  return products.map((p) => p.id)
}
