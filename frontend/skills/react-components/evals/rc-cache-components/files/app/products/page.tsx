import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { getProducts } from '@/lib/db'

async function Greeting() {
  const name = (await cookies()).get('first_name')?.value
  return <p className="text-sm text-gray-600">{name ? `Welcome back, ${name}.` : 'Welcome to Hearth & Field.'}</p>
}

async function ProductList() {
  const products = await getProducts()
  return (
    <ul className="mt-6 divide-y rounded border">
      {products.map((p) => (
        <li key={p.id} className="flex justify-between px-4 py-3">
          <span>
            {p.name} <span className="text-xs text-gray-500">{p.category}</span>
          </span>
          <span>${(p.priceCents / 100).toFixed(2)}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ProductsPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Products</h1>
      <Suspense fallback={null}>
        <Greeting />
      </Suspense>
      <Suspense fallback={<p className="mt-6 text-gray-500">Loading products...</p>}>
        <ProductList />
      </Suspense>
    </main>
  )
}
