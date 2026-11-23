'use client'

import { useEffect, useState } from 'react'
import moment from 'moment'
import _ from 'lodash'
import { SalesChart } from '@/components/sales-chart'

type HomeData = {
  featured: { id: string; name: string; priceCents: number; category: string }[]
  sales: { week: string; units: number }[]
  updatedAt: string
}

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null)
  const [showPromo, setShowPromo] = useState(false)

  useEffect(() => {
    fetch('/api/home')
      .then((r) => r.json())
      .then(setData)
    const t = setTimeout(() => setShowPromo(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const byCategory = data ? _.groupBy(data.featured, 'category') : {}

  return (
    <div>
      {showPromo && (
        <div className="bg-amber-100 px-6 py-4 text-center text-sm">
          Winter sale: 20% off all lighting until Dec 1. Free delivery on orders over $200.
        </div>
      )}
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold">Hearth & Field</span>
        <nav className="flex gap-6 text-sm">
          <a href="#">Shop</a>
          <a href="#">Journal</a>
          <a href="#">Stores</a>
        </nav>
      </header>

      <section className="relative">
        <img src="/hero.jpg" loading="lazy" alt="A reading corner with a lounge chair by a window" className="w-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/50 p-8 text-white">
          <h1 className="text-4xl font-semibold">Furniture made to be lived with</h1>
          <p className="mt-2 max-w-md">Solid wood, natural fibres, and finishes that get better with age.</p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-12 px-6 py-12">
        <section>
          <h2 className="text-2xl font-semibold">Featured</h2>
          {!data ? (
            <p className="mt-4 text-gray-500">Loading…</p>
          ) : (
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {Object.entries(byCategory).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm text-gray-500 uppercase">{category}</h3>
                  {items.map((item) => (
                    <p key={item.id} className="mt-1">
                      {item.name} · ${(item.priceCents / 100).toFixed(0)}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold">What people are buying</h2>
          {data && (
            <>
              <SalesChart data={data.sales} />
              <p className="text-xs text-gray-500">Updated {moment(data.updatedAt).fromNow()}</p>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
