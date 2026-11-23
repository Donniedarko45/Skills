export type Customer = {
  id: string
  name: string
  company: string
  email: string
  city: string
  lifetimeValueCents: number
  signedUpAt: string
}

const first = ['Ava', 'Liam', 'Noor', 'Mateo', 'Yuki', 'Zara', 'Omar', 'Ines', 'Kai', 'Lena', 'Ravi', 'Sofia', 'Jonas', 'Amara', 'Tomás', 'Mei', 'Elif', 'Hugo', 'Priya', 'Felix']
const last = ['Okafor', 'Lindqvist', 'Haddad', 'Reyes', 'Tanaka', 'Novak', 'Duarte', 'Kowalski', 'Menon', 'Brennan', 'Moreau', 'Silva', 'Fischer', 'Osei', 'Larsen', 'Chen', 'Yilmaz', 'Petrov', 'Nakamura', 'Ward']
const companies = ['Northwind', 'Harbor & Pine', 'Kite Analytics', 'Moss Coffee', 'Larkspur Health', 'Blue Fern', 'Quarry Labs', 'Juniper Legal', 'Atlas Freight', 'Cobalt Health']
const cities = ['Lisbon', 'Berlin', 'Lagos', 'Toronto', 'Osaka', 'Austin', 'Melbourne', 'Nairobi', 'Oslo', 'São Paulo', 'Mumbai', 'Dublin']

// Deterministic pseudo-random generator so server and client agree.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

export function getCustomers(count = 5000): Customer[] {
  const rand = rng(42)
  return Array.from({ length: count }, (_, i) => {
    const f = first[Math.floor(rand() * first.length)]
    const l = last[Math.floor(rand() * last.length)]
    const company = companies[Math.floor(rand() * companies.length)]
    const day = 1 + Math.floor(rand() * 1400)
    return {
      id: `cus_${(100000 + i).toString(36)}`,
      name: `${f} ${l}`,
      company,
      email: `${f}.${l}@${company.toLowerCase().replace(/[^a-z]/g, '')}.example`.toLowerCase(),
      city: cities[Math.floor(rand() * cities.length)],
      lifetimeValueCents: Math.floor(rand() * 5_000_000),
      signedUpAt: new Date(Date.UTC(2022, 0, day)).toISOString(),
    }
  })
}
