import { QueryProvider } from '@/lib/query-client'
import { AuthProvider } from '@/lib/auth-context'

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Login page has its own layout without sidebar
  return (
    <QueryProvider>
      <AuthProvider>
        <div className="min-h-screen">
          {children}
        </div>
      </AuthProvider>
    </QueryProvider>
  )
}
