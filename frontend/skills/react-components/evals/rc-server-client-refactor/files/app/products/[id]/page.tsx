'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import moment from 'moment'
import _ from 'lodash'
import { addToCart } from '@/lib/cart'
import type { Product } from '@/lib/products'

export default function ProductPage() {
  const params = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/products/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data)
        setLoading(false)
      })
  }, [params.id])

  if (loading) return <p className="p-8">Loading...</p>
  if (!product) return <p className="p-8">Not found</p>

  const averageRating = _.round(_.meanBy(product.reviews, 'rating'), 1)
  const sortedReviews = _.orderBy(product.reviews, ['createdAt'], ['desc'])

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <img src={product.images[selectedImage].src} alt={product.images[selectedImage].alt} className="aspect-square w-full rounded-lg bg-gray-100 object-cover" />
          <div className="mt-3 flex gap-2">
            {product.images.map((image, i) => (
              <button key={i} onClick={() => setSelectedImage(i)} className={i === selectedImage ? 'ring-2 ring-black rounded' : 'rounded'}>
                <img src={image.src} alt="" className="size-16 rounded object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <p className="mt-2 text-xl">${(product.priceCents / 100).toFixed(2)}</p>
          <p className="mt-4 text-gray-600">{product.description}</p>
          <p className="mt-2 text-sm text-gray-500">Updated {moment(product.updatedAt).fromNow()}</p>
          {product.stock > 0 ? (
            <div className="mt-6 flex items-center gap-3">
              <input type="number" min={1} max={product.stock} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-20 rounded border px-2 py-1" />
              <button
                onClick={() => {
                  addToCart(product.id, quantity)
                  setAdded(true)
                }}
                className="rounded bg-black px-4 py-2 text-white"
              >
                Add to cart
              </button>
              {added && <span className="text-sm text-green-700">Added</span>}
            </div>
          ) : (
            <p className="mt-6 text-red-600">Out of stock</p>
          )}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Reviews {product.reviews.length > 0 && <span>({averageRating} / 5)</span>}</h2>
        <ul className="mt-4 space-y-4">
          {sortedReviews.map((review) => (
            <li key={review.id} className="border-b pb-4">
              <p className="font-medium">{review.author} · {'★'.repeat(review.rating)}</p>
              <p className="text-gray-700">{review.body}</p>
              <p className="text-xs text-gray-500">{moment(review.createdAt).format('MMMM D, YYYY')}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
