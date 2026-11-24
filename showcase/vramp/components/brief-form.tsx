'use client'

import { useState } from 'react'
import { budgets, site } from '@/lib/content'

/**
 * Project brief form. The site is a static export, so submission opens the visitor's email client
 * with the brief filled in. Swap `onSubmit` for a POST to your CRM or form endpoint when you have one.
 */
export function BriefForm() {
  const [who, setWho] = useState<'agency' | 'company'>('agency')
  const [sent, setSent] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const body = [
      `Name: ${data.get('name')}`,
      `Email: ${data.get('email')}`,
      `Company: ${data.get('company')}`,
      `We are: ${who === 'agency' ? 'an agency' : 'a company or startup'}`,
      `Budget: ${data.get('budget')}`,
      '',
      String(data.get('brief') ?? ''),
    ].join('\n')
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(`Project brief: ${data.get('company')}`)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  const field = 'h-12 w-full rounded-xl border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-ink-faint transition-colors focus:border-hue-500 focus:bg-surface focus:outline-none'

  if (sent) {
    return (
      <div role="status" className="rounded-[28px] border border-line bg-surface p-8">
        <p className="eyebrow text-hue-700">Brief ready</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight">Your email app has the brief filled in.</p>
        <p className="mt-2 text-ink-muted">Send it, and you&apos;ll hear from a lead within one business day.</p>
        <button type="button" onClick={() => setSent(false)} className="mt-6 text-sm underline underline-offset-4">
          Edit the brief
        </button>
      </div>
    )
  }

  return (
    <form id="brief-form" onSubmit={onSubmit} className="rounded-[28px] border border-line bg-surface p-5 shadow-[0_30px_70px_-40px_oklch(0.25_0.04_265/0.3)] sm:p-8">
      <fieldset>
        <legend className="text-sm text-ink-muted">We are</legend>
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-full bg-tray p-1">
          {(['agency', 'company'] as const).map((value) => (
            <label key={value} className="cursor-pointer rounded-full py-2.5 text-center text-sm font-medium text-ink-muted transition-colors hover:text-ink has-[:checked]:bg-ink has-[:checked]:text-canvas has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hue-500">
              <input type="radio" name="who" value={value} checked={who === value} onChange={() => setWho(value)} className="sr-only" />
              {value === 'agency' ? 'An agency' : 'A company or startup'}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm text-ink-muted">Your name</label>
          <input id="name" name="name" required autoComplete="name" className={`${field} mt-1.5`} />
        </div>
        <div>
          <label htmlFor="email" className="text-sm text-ink-muted">Work email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={`${field} mt-1.5`} />
        </div>
        <div>
          <label htmlFor="company" className="text-sm text-ink-muted">{who === 'agency' ? 'Agency' : 'Company'}</label>
          <input id="company" name="company" required autoComplete="organization" className={`${field} mt-1.5`} />
        </div>
        <div>
          <label htmlFor="budget" className="text-sm text-ink-muted">Budget</label>
          <select id="budget" name="budget" defaultValue={budgets[1]} className={`${field} mt-1.5 appearance-none`}>
            {budgets.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="brief-text" className="text-sm text-ink-muted">
          {who === 'agency' ? 'What has your client asked for, and by when?' : 'What are you building, and by when?'}
        </label>
        <textarea id="brief-text" name="brief" required rows={4} className={`${field} mt-1.5 h-auto py-3 leading-relaxed`} placeholder="A few sentences is plenty. Links welcome." />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">A lead replies within one business day. NDA on request.</p>
        <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium text-canvas transition-opacity hover:opacity-85">
          Send the brief
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
            <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  )
}
