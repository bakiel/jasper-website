import type { Metadata } from 'next'
import './globals.css'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'

export const metadata: Metadata = {
  title: 'JASPER Client Portal',
  description: 'Professional client management system for JASPER Financial Architecture',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthenticatedLayout>
          {children}
        </AuthenticatedLayout>
      </body>
    </html>
  )
}
