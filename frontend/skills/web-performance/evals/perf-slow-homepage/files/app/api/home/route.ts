const featured = [
  { id: 'p1', name: 'Juniper Lounge Chair', priceCents: 64900, category: 'Seating' },
  { id: 'p2', name: 'Alder Side Table', priceCents: 21900, category: 'Tables' },
  { id: 'p3', name: 'Fen Floor Lamp', priceCents: 18900, category: 'Lighting' },
  { id: 'p4', name: 'Moor Wool Throw', priceCents: 9900, category: 'Textiles' },
]

const sales = [
  { week: '2026-10-05', units: 120 },
  { week: '2026-10-12', units: 164 },
  { week: '2026-10-19', units: 151 },
  { week: '2026-10-26', units: 198 },
  { week: '2026-11-02', units: 230 },
  { week: '2026-11-09', units: 214 },
  { week: '2026-11-16', units: 262 },
]

export async function GET() {
  // Simulates a slow CMS + analytics call.
  await new Promise((resolve) => setTimeout(resolve, 450))
  return Response.json({ featured, sales, updatedAt: '2026-11-22T08:00:00Z' })
}
