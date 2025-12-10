'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { adminAuthApi, AdminUser } from './api'

interface AuthContextType {
  user: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  googleLogin: (credential: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Routes that don't require authentication
const publicRoutes = ['/login']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check localStorage for cached user
        const cachedUser = adminAuthApi.getCurrentUser()

        if (cachedUser && adminAuthApi.isAuthenticated()) {
          setUser(cachedUser)

          // Verify token is still valid by calling /me endpoint
          try {
            const freshUser = await adminAuthApi.getMe()
            setUser(freshUser)
            localStorage.setItem('admin_user', JSON.stringify(freshUser))
          } catch {
            // Token expired or invalid
            adminAuthApi.logout()
            setUser(null)
          }
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
    const response = await adminAuthApi.login(email, password)
    setUser(response.user)
    router.push('/')
  }

  const googleLogin = async (credential: string) => {
    const response = await adminAuthApi.googleLogin(credential)
    setUser(response.user)
    router.push('/')
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
