'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { QueryProvider } from '@/lib/query-client'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'
import { Sidebar } from './Sidebar'
import { IntakeQuestionnaireModal } from '../questionnaire/IntakeQuestionnaireModal'
import { questionnaireApi } from '@/lib/api'

// Routes that don't show the sidebar/dashboard chrome
const publicRoutes = ['/login']

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isLoading, isAuthenticated } = useAuth()
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))

  // Questionnaire state
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [questionnaireChecked, setQuestionnaireChecked] = useState(false)

  // Check questionnaire status when authenticated
  useEffect(() => {
    if (isAuthenticated && !questionnaireChecked) {
      checkQuestionnaireStatus()
    }
  }, [isAuthenticated, questionnaireChecked])

  const checkQuestionnaireStatus = async () => {
    try {
      const status = await questionnaireApi.getStatus()
      if (status.questionnaire_required) {
        setShowQuestionnaire(true)
      }
    } catch (err) {
      // If 401 or error, don't show questionnaire (admin users don't have this endpoint)
      console.log('Questionnaire check skipped:', err)
    } finally {
      setQuestionnaireChecked(true)
    }
  }

  const handleQuestionnaireComplete = () => {
    setShowQuestionnaire(false)
  }

  // Public routes render directly without sidebar
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jasper-emerald mx-auto mb-4"></div>
          <p className="text-jasper-slate">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - AuthProvider will redirect to login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jasper-emerald mx-auto mb-4"></div>
          <p className="text-jasper-slate">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Authenticated - show dashboard layout with sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 transition-all duration-300">
        {children}
      </main>

      {/* Intake Questionnaire Modal - shown for new clients */}
      <IntakeQuestionnaireModal
        isOpen={showQuestionnaire}
        onComplete={handleQuestionnaireComplete}
      />
    </div>
  )
}

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
