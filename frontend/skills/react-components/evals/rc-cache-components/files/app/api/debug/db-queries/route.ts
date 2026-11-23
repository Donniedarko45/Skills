import { connection } from 'next/server'
import { dbQueryCount } from '@/lib/db'

// Test hook: how many database queries the server has run.
export async function GET() {
  await connection()
  return Response.json({ queries: dbQueryCount() })
}
