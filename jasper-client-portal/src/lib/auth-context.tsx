'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { clientAuthApi, ClientUser } from './api'

// Session timeout duration (30 minutes)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000
// Activity check interval (1 minute)
const ACTIVITY_CHECK_INTERVAL_MS = 60 * 1000

interface AuthContextType {
  user: ClientUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isLoggingIn: boolean
  login: (email: string, password: string) => Promise<void>
  googleLogin: (credential: string) => Promise<void>
  linkedinLogin: (code: string, redirectUri: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/pending-approval', '/setup']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(() => {
    if (typeof window !== 'undefined') {
      return clientAuthApi.getCurrentUser()
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined' && clientAuthApi.getCurrentUser()) {
      return false
    }
    return true
  })

  // Use refs instead of global variables to avoid state pollution
  const authCheckedRef = useRef(false)
  const isLoggingInRef = useRef(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const lastActivityRef = useRef(Date.now())

  const router = useRouter()
  const pathname = usePathname()

  // Update last activity timestamp
  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  // Session timeout handler
  const handleSessionTimeout = useCallback(() => {
    setUser(null)
    clientAuthApi.logout()
    router.replace('/login?timeout=1')
  }, [router])

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check for OAuth callback parameters first
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        if (code) {
          // OAuth callback in progress, don't skip auth check
          setIsLoading(false)
          return
        }
      }

      if (authCheckedRef.current || isLoggingInRef.current) {
        const cachedUser = clientAuthApi.getCurrentUser()
        if (cachedUser && clientAuthApi.isAuthenticated()) {
          setUser(cachedUser)
        }
        setIsLoading(false)
        return
      }

      authCheckedRef.current = true

      try {
        const cachedUser = clientAuthApi.getCurrentUser()
        if (cachedUser && clientAuthApi.isAuthenticated()) {
          setUser(cachedUser)
          setIsLoading(false)
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

  // Session timeout monitoring
  useEffect(() => {
    if (!user) return

    // Track user activity
    const handleActivity = () => updateLastActivity()

    window.addEventListener('mousedown', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('scroll', handleActivity)
    window.addEventListener('touchstart', handleActivity)

    // Check for timeout
    const interval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current
      if (timeSinceActivity > SESSION_TIMEOUT_MS) {
        handleSessionTimeout()
      }
    }, ACTIVITY_CHECK_INTERVAL_MS)

    return () => {
      window.removeEventListener('mousedown', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
      clearInterval(interval)
    }
  }, [user, updateLastActivity, handleSessionTimeout])

  // Handle route protection
  useEffect(() => {
    if (isLoading || isLoggingInRef.current) return

    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname?.startsWith(route))

    if (!user && !isPublicRoute) {
      router.replace('/login')
    } else if (user && pathname === '/login') {
      router.replace('/')
    }
  }, [user, isLoading, pathname, router])

  const login = useCallback(async (email: string, password: string) => {
    isLoggingInRef.current = true
    setIsLoggingIn(true)
    try {
      const response = await clientAuthApi.login(email, password)
      setUser(response.user)
      updateLastActivity()
      window.location.href = '/'
    } catch (error) {
      isLoggingInRef.current = false
      setIsLoggingIn(false)
      throw error
    }
  }, [updateLastActivity])

  const googleLogin = useCallback(async (credential: string) => {
    isLoggingInRef.current = true
    setIsLoggingIn(true)
    try {
      const response = await clientAuthApi.googleLogin(credential)
      setUser(response.user)
      updateLastActivity()
      window.location.href = '/'
    } catch (error) {
      isLoggingInRef.current = false
      setIsLoggingIn(false)
      throw error
    }
  }, [updateLastActivity])

  const linkedinLogin = useCallback(async (code: string, redirectUri: string) => {
    isLoggingInRef.current = true
    setIsLoggingIn(true)
    try {
      const response = await clientAuthApi.linkedinLogin(code, redirectUri)
      setUser(response.user)
      updateLastActivity()
      window.location.href = '/'
    } catch (error) {
      isLoggingInRef.current = false
      setIsLoggingIn(false)
      throw error
    }
  }, [updateLastActivity])

  const logout = useCallback(() => {
    authCheckedRef.current = false
    isLoggingInRef.current = false
    setIsLoggingIn(false)
    setUser(null)
    clientAuthApi.logout()
    router.replace('/login')
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isLoggingIn,
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
