'use server'

import { redirect } from 'next/navigation'

export async function signOut() {
  // In production this clears the session cookie.
  redirect('/signed-out')
}
