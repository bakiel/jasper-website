'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Script from 'next/script'
import { useAuth } from '@/lib/auth-context'
import { adminAuthApi } from '@/lib/api'
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
          }) => void
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              width?: number
            }
          ) => void
        }
      }
    }
  }
}

export default function LoginPage() {
  const { login, googleLogin, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false)

  // Fetch Google Client ID
  useEffect(() => {
    adminAuthApi.getGoogleClientId()
      .then(setGoogleClientId)
      .catch(() => console.log('Google OAuth not configured'))
  }, [])

  // Handle Google Sign-In callback
  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    setError('')
    setIsSubmitting(true)
    try {
      await googleLogin(response.credential)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed')
    } finally {
      setIsSubmitting(false)
    }
  }, [googleLogin])

  // Initialize Google Sign-In when script loads and client ID is available
  useEffect(() => {
    if (googleScriptLoaded && googleClientId && window.google) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
      })

      const buttonDiv = document.getElementById('google-signin-button')
      if (buttonDiv) {
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 320,
        })
      }
    }
  }, [googleScriptLoaded, googleClientId, handleGoogleCallback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jasper-navy">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jasper-emerald"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-jasper-navy via-jasper-graphite to-jasper-carbon relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          {/* Logo */}
          <div className="mb-12">
            <Image
              src="/images/jasper-logo-white.png"
              alt="JASPER Financial Architecture"
              width={280}
              height={80}
              className="h-20 w-auto"
              priority
            />
          </div>

          {/* Tagline */}
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold text-white mb-4">
              Admin Portal
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed">
              Manage clients, projects, and invoices with our powerful CRM platform.
            </p>
          </div>

          {/* Features list */}
          <div className="mt-12 grid grid-cols-2 gap-6 text-gray-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-jasper-emerald/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-jasper-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm">Client Management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-jasper-emerald/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-jasper-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="text-sm">Project Tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-jasper-emerald/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-jasper-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm">Invoice Management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-jasper-emerald/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-jasper-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm">Analytics Dashboard</span>
            </div>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-jasper-emerald via-transparent to-jasper-emerald opacity-50" />
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface-secondary">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/images/jasper-icon.png"
              alt="JASPER"
              width={64}
              height={64}
              className="h-16 w-auto"
            />
          </div>

          {/* Form header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-jasper-carbon mb-2">
              Welcome back
            </h2>
            <p className="text-jasper-slate">
              Sign in to your admin account
            </p>
          </div>

          {/* Google Sign-In Script */}
          {googleClientId && (
            <Script
              src="https://accounts.google.com/gsi/client"
              strategy="afterInteractive"
              onLoad={() => setGoogleScriptLoaded(true)}
            />
          )}

          {/* Google Sign-In Button */}
          {googleClientId && (
            <>
              <div id="google-signin-button" className="flex justify-center mb-4" />
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-surface-secondary text-jasper-slate">or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-jasper-carbon mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-jasper-slate" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    'block w-full pl-10 pr-4 py-3 border border-border rounded-lg',
                    'bg-white text-jasper-carbon placeholder-jasper-slate/60',
                    'focus:outline-none focus:ring-2 focus:ring-jasper-emerald focus:border-transparent',
                    'transition-colors duration-200'
                  )}
                  placeholder="admin@jasperfinance.org"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-jasper-carbon mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-jasper-slate" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    'block w-full pl-10 pr-12 py-3 border border-border rounded-lg',
                    'bg-white text-jasper-carbon placeholder-jasper-slate/60',
                    'focus:outline-none focus:ring-2 focus:ring-jasper-emerald focus:border-transparent',
                    'transition-colors duration-200'
                  )}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-jasper-slate hover:text-jasper-carbon transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-jasper-slate hover:text-jasper-carbon transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className={cn(
                'w-full py-3 px-4 rounded-lg font-medium text-white',
                'bg-jasper-emerald hover:bg-jasper-emerald-dark',
                'focus:outline-none focus:ring-2 focus:ring-jasper-emerald focus:ring-offset-2',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-jasper-slate">
              Need help? Contact{' '}
              <a href="mailto:support@jasperfinance.org" className="text-jasper-emerald hover:text-jasper-emerald-dark">
                support@jasperfinance.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
