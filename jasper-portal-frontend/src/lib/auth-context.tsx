'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { adminAuthApi, AdminUser } from './api'

interface AuthContextType {
  user: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  googleLogin: (credential: string) => Promise<void>
  linkedinLogin: (code: string, redirectUri: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Routes that don't require authentication
const publicRoutes = ['/login', '/intake']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Use ref to track login state without triggering re-renders
  const isLoggingInRef = useRef(false)
  const hasCheckedAuthRef = useRef(false)

  // Check authentication status on mount only
  useEffect(() => {
    const checkAuth = async () => {
      // Skip if already checked or currently logging in
      if (hasCheckedAuthRef.current || isLoggingInRef.current) {
        setIsLoading(false)
        return
      }

      hasCheckedAuthRef.current = true

      try {
        // First check localStorage for cached user
        const cachedUser = adminAuthApi.getCurrentUser()

        if (cachedUser && adminAuthApi.isAuthenticated()) {
          // Trust the cached user - no need to immediately verify
          // This prevents the race condition where verification fails during login redirect
          setUser(cachedUser)
          setIsLoading(false)

          // Verify token in background (non-blocking) - only after a delay
          // This gives time for any login process to complete
          setTimeout(async () => {
            // Don't verify if we're in the middle of logging in
            if (isLoggingInRef.current) return

            try {
              const freshUser = await adminAuthApi.getMe()
              setUser(freshUser)
              localStorage.setItem('admin_user', JSON.stringify(freshUser))
            } catch (err) {
              console.error('Background token verification failed:', err)
              // Only logout if we're not currently logging in
              if (!isLoggingInRef.current) {
                adminAuthApi.logout()
                setUser(null)
              }
            }
          }, 1000) // Wait 1 second before background verification
          return
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, []) // Empty dependency - only run on mount

  // Handle route protection
  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = publicRoutes.some(route => pathname === route)

      if (!user && !isPublicRoute) {
        // Not authenticated and trying to access protected route
        router.push('/login')
      } else if (user && pathname === '/login') {
        // Authenticated but on login page - redirect to dashboard
        router.push('/')
      }
    }
  }, [user, isLoading, pathname, router])

  const login = async (email: string, password: string) => {
    isLoggingInRef.current = true
    try {
      const response = await adminAuthApi.login(email, password)
      setUser(response.user)
      // Two-step flow: wait for localStorage to be fully processed before redirect
      await new Promise(resolve => setTimeout(resolve, 150))
      router.push('/')
    } finally {
      // Reset after navigation completes
      setTimeout(() => {
        isLoggingInRef.current = false
      }, 2000)
    }
  }

  const googleLogin = async (credential: string) => {
    isLoggingInRef.current = true
    try {
      const response = await adminAuthApi.googleLogin(credential)
      setUser(response.user)
      // Two-step flow: wait for localStorage to be fully processed before redirect
      // This prevents cookie race condition where redirect happens before storage is available
      await new Promise(resolve => setTimeout(resolve, 150))
      router.push('/')
    } finally {
      setTimeout(() => {
        isLoggingInRef.current = false
      }, 2000)
    }
  }

  const linkedinLogin = async (code: string, redirectUri: string) => {
    isLoggingInRef.current = true
    try {
      const response = await adminAuthApi.linkedinLogin(code, redirectUri)
      setUser(response.user)
      // Two-step flow: wait for localStorage to be fully processed before redirect
      await new Promise(resolve => setTimeout(resolve, 150))
      router.push('/')
    } finally {
      setTimeout(() => {
        isLoggingInRef.current = false
      }, 2000)
    }
  }

  const logout = () => {
    setUser(null)
    adminAuthApi.logout()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        googleLogin,
        linkedinLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
