'use client'

import { useState } from 'react'

const plans = [
  { id: 'starter', name: 'Starter', price: '$0', blurb: 'For individuals trying Relay.' },
  { id: 'team', name: 'Team', price: '$12 / seat', blurb: 'Shared inboxes and assignment rules.' },
  { id: 'enterprise', name: 'Enterprise', price: 'Contact us', blurb: 'SSO, audit logs, data residency.' },
]

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [plan, setPlan] = useState('team')
  const [planOpen, setPlanOpen] = useState(false)
  const [error, setError] = useState('')

  function submit() {
    if (!email.includes('@')) return setError('Invalid email')
    if (password.length < 10) return setError('Password too short')
    if (!agreed) return setError('You must accept the terms')
    setError('')
    alert('Account created')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-sm space-y-5 p-6">
        <img src="/logo.svg" className="h-6" />
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <h4 className="text-sm font-medium text-gray-400">Step 1 of 2</h4>

        <input
          type="text"
          placeholder="Work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2 outline-none"
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            className="w-full rounded-md border border-gray-200 px-3 py-2 outline-none"
          />
          <span onClick={() => setShowPassword(!showPassword)} className="absolute top-2.5 right-3 cursor-pointer text-gray-400">
            <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" fill="currentColor" /><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" fill="none" stroke="currentColor" /></svg>
          </span>
        </div>
        <p className="text-xs text-gray-300">At least 10 characters, one number.</p>

        <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
          <span>
            Plan: <strong>{plans.find((p) => p.id === plan)?.name}</strong>
          </span>
          <a onClick={() => setPlanOpen(true)} className="cursor-pointer text-blue-600">Change</a>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div onClick={() => setAgreed(!agreed)} className={`size-4 cursor-pointer rounded border ${agreed ? 'border-black bg-black' : 'border-gray-300'}`} />
          <span>
            I agree to the <a href="/terms" className="text-blue-600">terms</a>
          </span>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div onClick={submit} className="cursor-pointer rounded-md bg-black py-2 text-center text-sm font-medium text-white hover:bg-gray-800">
          Create account
        </div>

        <p className="text-center text-xs text-gray-400">
          Already have an account? <a href="/login" className="text-gray-400">Sign in</a>
        </p>
      </div>

      {planOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" onClick={() => setPlanOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold">Choose a plan</div>
            <div className="mt-4 space-y-2">
              {plans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setPlan(p.id)
                    setPlanOpen(false)
                  }}
                  className={`cursor-pointer rounded-md border p-3 ${plan === p.id ? 'border-black' : 'border-gray-200'}`}
                >
                  <div className="flex justify-between font-medium">
                    {p.name} <span>{p.price}</span>
                  </div>
                  <div className="text-sm text-gray-400">{p.blurb}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
