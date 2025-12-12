import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'JASPER Financial Architecture',
  description: 'DFI-Grade Financial Modelling for Infrastructure Projects',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-surface-secondary">
        {children}
      </body>
    </html>
  )
}
