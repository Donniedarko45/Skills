'use client'

import { useState } from 'react'
import { quotes } from '@/lib/content'

const pad = (n: number) => String(n).padStart(2, '0')

/** Quote slider. Every quote is in the HTML; only the active one is shown. */
export function Testimonials() {
  const [i, setI] = useState(0)

  return (
    <div className="mx-auto max-w-4xl" data-quotes>
      <div className="flex items-center justify-between gap-6">
        <svg viewBox="0 0 48 32" aria-hidden="true" className="h-8 w-12 fill-on-hue-900">
          <path d="M0 32 L8 0 H22 L12 32 Z M24 32 L32 0 H46 L36 32 Z" />
        </svg>
        <div className="flex items-center gap-4">
          <button type="button" data-prev aria-label="Previous quote" onClick={() => setI((i - 1 + quotes.length) % quotes.length)} className="grid h-11 w-16 place-items-center rounded-full border border-on-hue-900/30 transition-colors hover:bg-on-hue-900/10">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 rotate-180"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <p className="text-[14px] tabular-nums" aria-live="polite">
            <span className="sr-only">Quote </span>
            <span data-counter className="underline underline-offset-4">{pad(i + 1)}</span>
            <span className="text-on-hue-900-muted">/{pad(quotes.length)}</span>
          </p>
          <button type="button" data-next aria-label="Next quote" onClick={() => setI((i + 1) % quotes.length)} className="grid h-11 w-16 place-items-center rounded-full bg-on-hue-900 text-hue-900 transition-opacity hover:opacity-85">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      {quotes.map((q, idx) => (
        <figure key={q.initials} data-quote hidden={idx !== i} className="mt-10">
          <blockquote className="text-[clamp(1.6rem,3.4vw,2.6rem)] leading-[1.15] font-medium tracking-[-0.03em] text-balance">
            {q.quote}
          </blockquote>
          <figcaption className="mt-10 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-chip text-[14px] font-semibold text-hue-900">{q.initials}</span>
            <span>
              <span className="block font-medium">{q.name}</span>
              <span className="block text-[14px] text-on-hue-900-muted">{q.org}</span>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
