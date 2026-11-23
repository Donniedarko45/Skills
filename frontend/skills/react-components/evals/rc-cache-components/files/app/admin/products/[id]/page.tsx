import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/db'
import { saveProduct } from './actions'

async function EditForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()
  return (
    <form action={saveProduct} className="mt-6 space-y-4">
      <input type="hidden" name="id" value={product.id} />
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <input id="name" name="name" defaultValue={product.name} className="mt-1 w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label htmlFor="price" className="block text-sm font-medium">Price (USD)</label>
        <input id="price" name="price" type="number" step="0.01" defaultValue={(product.priceCents / 100).toFixed(2)} className="mt-1 w-full rounded border px-3 py-2" />
      </div>
      <button type="submit" className="rounded bg-black px-4 py-2 text-white">Save</button>
    </form>
  )
}

export default function EditProductPage({ params }: PageProps<'/admin/products/[id]'>) {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <Suspense fallback={<p className="mt-6">Loading...</p>}>
        <EditForm params={params} />
      </Suspense>
    </main>
  )
}
