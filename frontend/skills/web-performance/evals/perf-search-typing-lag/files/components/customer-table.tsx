'use client'

import { useState } from 'react'
import moment from 'moment'
import _ from 'lodash'
import type { Customer } from '@/lib/customers'

function normalize(value: string) {
  return _.deburr(_.toLower(value)).replace(/[^a-z0-9@. ]/g, '')
}

export function CustomerTable({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState('')

  const q = normalize(query)
  const rows = _.orderBy(
    customers.filter((c) => normalize(`${c.name} ${c.company} ${c.email} ${c.city}`).includes(q)),
    [(c) => c.name.localeCompare('')],
  ).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="mt-6 space-y-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search customers"
        aria-label="Search customers"
        className="w-full max-w-sm rounded-md border px-3 py-2"
      />
      <p className="text-sm text-gray-500">{rows.length} customers</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-2">Name</th>
            <th>Company</th>
            <th>Email</th>
            <th>City</th>
            <th className="text-right">Lifetime value</th>
            <th className="text-right">Customer since</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={i} className="border-t">
              <td className="py-2">{c.name}</td>
              <td>{c.company}</td>
              <td>{c.email}</td>
              <td>{c.city}</td>
              <td className="text-right">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c.lifetimeValueCents / 100)}
              </td>
              <td className="text-right">{moment(c.signedUpAt).format('LL')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
