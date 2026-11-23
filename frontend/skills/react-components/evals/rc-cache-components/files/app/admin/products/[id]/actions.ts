'use server'

import { redirect } from 'next/navigation'
import { updateProduct } from '@/lib/db'

export async function saveProduct(formData: FormData) {
  // Auth omitted in this demo.
  const id = String(formData.get('id'))
  const name = String(formData.get('name') ?? '').trim()
  const priceCents = Math.round(Number(formData.get('price')) * 100)
  if (!name || !Number.isFinite(priceCents) || priceCents < 0) throw new Error('Invalid product')
  await updateProduct(id, { name, priceCents })
  redirect('/products')
}
