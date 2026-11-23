import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import './globals.css'

export const metadata: Metadata = { title: 'Pulse', description: 'Team analytics' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  )
}
