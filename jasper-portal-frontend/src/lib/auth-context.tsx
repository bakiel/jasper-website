'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
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

// Global flag to prevent multiple auth checks across component remounts
let globalAuthChecked = false
let globalIsLoggingIn = false

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    // Initialize from localStorage immediately to prevent flash
    if (typeof window !== 'undefined') {
      return adminAuthApi.getCurrentUser()
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(() => {
    // If we already have a user from localStorage, don't show loading
    if (typeof window !== 'undefined' && adminAuthApi.getCurrentUser()) {
      return false
    }
    return true
  })

  const router = useRouter()
  const pathname = usePathname()

  // Check authentication status on mount only
  useEffect(() => {
    const checkAuth = async () => {
      // Skip if already checked globally or currently logging in
      if (globalAuthChecked || globalIsLoggingIn) {
        // Still update local state from localStorage
        const cachedUser = adminAuthApi.getCurrentUser()
        if (cachedUser && adminAuthApi.isAuthenticated()) {
          setUser(cachedUser)
        }
        setIsLoading(false)
        return
      }

      globalAuthChecked = true

      try {
        const cachedUser = adminAuthApi.getCurrentUser()

        if (cachedUser && adminAuthApi.isAuthenticated()) {
          setUser(cachedUser)
          setIsLoading(false)
          // No background verification - trust localStorage
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
  }, [])

  // Handle route protection - only redirect, don't cause loops
  useEffect(() => {
    // Don't do anything while loading or logging in
    if (isLoading || globalIsLoggingIn) return

    const isPublicRoute = publicRoutes.some(route => pathname === route)

    if (!user && !isPublicRoute) {
      // Not authenticated and trying to access protected route
      router.replace('/login')
    } else if (user && pathname === '/login') {
      // Authenticated but on login page - redirect to dashboard
      router.replace('/')
    }
  }, [user, isLoading, pathname, router])

  const login = useCallback(async (email: string, password: string) => {
    globalIsLoggingIn = true
    try {
      const response = await adminAuthApi.login(email, password)
      setUser(response.user)
      // Hard navigation to ensure fresh page load with auth state
      window.location.href = '/'
    } catch (error) {
      globalIsLoggingIn = false
      throw error
    }
  }, [])

  const googleLogin = useCallback(async (credential: string) => {
    globalIsLoggingIn = true
    try {
      const response = await adminAuthApi.googleLogin(credential)
      setUser(response.user)
      // Hard navigation to ensure fresh page load with auth state
      window.location.href = '/'
    } catch (error) {
      globalIsLoggingIn = false
      throw error
    }
  }, [])

  const linkedinLogin = useCallback(async (code: string, redirectUri: string) => {
    globalIsLoggingIn = true
    try {
      const response = await adminAuthApi.linkedinLogin(code, redirectUri)
      setUser(response.user)
      // Hard navigation to ensure fresh page load with auth state
      window.location.href = '/'
    } catch (error) {
      globalIsLoggingIn = false
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    globalAuthChecked = false
    globalIsLoggingIn = false
    setUser(null)
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    router.replace('/login')
  }, [router])

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
