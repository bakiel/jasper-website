import { QueryProvider } from '@/lib/query-client'

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Login page has its own layout without sidebar
  return (
    <QueryProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </QueryProvider>
  )
}
