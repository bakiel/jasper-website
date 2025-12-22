'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Script from 'next/script'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { adminAuthApi } from '@/lib/api'
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// LinkedIn icon component
const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

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
  const { login, googleLogin, linkedinLogin, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false)
  const [linkedinConfig, setLinkedinConfig] = useState<{ client_id: string; redirect_uri: string; scope: string } | null>(null)
  const [linkedinLoading, setLinkedinLoading] = useState(false)
  const [linkedinCodeProcessed, setLinkedinCodeProcessed] = useState(false)
  const [darkMode, setDarkMode] = useState(true) // Default to dark mode

  // CRITICAL: Use refs to prevent infinite loop - only fetch once
  const hasFetchedGoogleRef = useRef(false)
  const hasFetchedLinkedinRef = useRef(false)
  const hasInitializedGoogleRef = useRef(false)

  // Fetch Google Client ID - only once
  useEffect(() => {
    if (hasFetchedGoogleRef.current) return
    hasFetchedGoogleRef.current = true

    adminAuthApi.getGoogleClientId()
      .then(setGoogleClientId)
      .catch(() => console.log('Google OAuth not configured'))
  }, [])

  // Fetch LinkedIn config - only once
  useEffect(() => {
    if (hasFetchedLinkedinRef.current) return
    hasFetchedLinkedinRef.current = true

    adminAuthApi.getLinkedInConfig()
      .then(setLinkedinConfig)
      .catch(() => console.log('LinkedIn OAuth not configured'))
  }, [])

  // Handle LinkedIn OAuth callback - must use code immediately before it expires
  useEffect(() => {
    // Prevent double-execution using sessionStorage (survives React Strict Mode remount)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const linkedinError = searchParams.get('error')

    if (linkedinError) {
      setError(`LinkedIn login failed: ${searchParams.get('error_description') || linkedinError}`)
      window.history.replaceState({}, '', '/login')
      return
    }

    // Use code immediately - LinkedIn auth codes expire in ~20 seconds
    if (code && state === 'linkedin_login') {
      // Check sessionStorage to prevent duplicate calls (React Strict Mode protection)
      const processedCode = sessionStorage.getItem('linkedin_code_processed')
      if (processedCode === code) {
        return // Already processing this code
      }

      // Mark as processed in sessionStorage immediately
      sessionStorage.setItem('linkedin_code_processed', code)
      setLinkedinCodeProcessed(true)
      setLinkedinLoading(true)
      setError('')

      // Clear URL params
      window.history.replaceState({}, '', '/login')

      // Use the exact URL that LinkedIn redirected to
      const redirectUri = `${window.location.origin}/login`
      linkedinLogin(code, redirectUri)
        .then(() => {
          sessionStorage.removeItem('linkedin_code_processed')
        })
        .catch((err) => {
          sessionStorage.removeItem('linkedin_code_processed')
          setError(err instanceof Error ? err.message : 'LinkedIn login failed')
          setLinkedinCodeProcessed(false)
        })
        .finally(() => {
          setLinkedinLoading(false)
        })
    }
  }, [searchParams, linkedinLogin])

  // LinkedIn login handler
  const handleLinkedInLogin = () => {
    if (!linkedinConfig) return

    // Use the current origin to ensure redirect_uri matches exactly
    const redirectUri = `${window.location.origin}/login`

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: linkedinConfig.client_id,
      redirect_uri: redirectUri,
      state: 'linkedin_login',
      scope: linkedinConfig.scope,
    })

    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  }

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

  // Initialize Google Sign-In when script loads and client ID is available - only once
  useEffect(() => {
    if (hasInitializedGoogleRef.current) return
    if (!googleScriptLoaded || !googleClientId || !window.google) return

    hasInitializedGoogleRef.current = true

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

  if (authLoading || linkedinLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jasper-navy">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jasper-emerald mx-auto"></div>
          {linkedinLoading && <p className="text-white mt-4">Signing in with LinkedIn...</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-row">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-shrink-0 bg-jasper-navy relative overflow-hidden">
        {/* Background pattern - geometric grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(44, 138, 91, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(44, 138, 91, 0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        {/* Emerald accent glow */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-jasper-emerald/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-jasper-emerald/15 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          {/* Logo */}
          <div className="mb-10">
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
            <h1 className="text-4xl font-bold text-white mb-4">
              Admin Portal
            </h1>
            <p className="text-gray-200 text-lg leading-relaxed">
              Manage clients, projects, and invoices with our powerful CRM platform.
            </p>
          </div>

          {/* Features list */}
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-jasper-emerald flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm text-white font-medium">Client Management</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-jasper-emerald flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="text-sm text-white font-medium">Project Tracking</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-jasper-emerald flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm text-white font-medium">Invoice Management</span>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-jasper-emerald flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm text-white font-medium">Analytics Dashboard</span>
            </div>
          </div>
        </div>

        {/* Bottom emerald accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-jasper-emerald" />
      </div>

      {/* Right side - Login form */}
      <div className={cn(
        "w-full lg:w-1/2 lg:flex-shrink-0 flex items-center justify-center p-8 transition-colors duration-300",
        darkMode ? "bg-jasper-navy" : "bg-white"
      )}>
        <div className="w-full max-w-md">
          {/* Dark mode toggle */}
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                darkMode
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              )}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src={darkMode ? "/images/jasper-logo-white.png" : "/images/jasper-icon.png"}
              alt="JASPER"
              width={64}
              height={64}
              className="h-16 w-auto"
            />
          </div>

          {/* Form header */}
          <div className="text-center mb-8">
            <h2 className={cn(
              "text-3xl font-bold mb-2",
              darkMode ? "text-white" : "text-jasper-navy"
            )}>
              Welcome back
            </h2>
            <p className={darkMode ? "text-gray-300" : "text-jasper-graphite"}>
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

          {/* OAuth Sign-In Buttons */}
          {(googleClientId || linkedinConfig) && (
            <>
              <div className="space-y-3">
                {/* Google Sign-In Button */}
                {googleClientId && (
                  <div id="google-signin-button" className="flex justify-center" />
                )}

                {/* LinkedIn Sign-In Button */}
                {linkedinConfig && (
                  <button
                    type="button"
                    onClick={handleLinkedInLogin}
                    className={cn(
                      'w-full flex items-center justify-center gap-3 px-4 py-3',
                      'bg-[#0A66C2] hover:bg-[#004182] text-white',
                      'rounded-lg font-medium transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:ring-offset-2'
                    )}
                  >
                    <LinkedInIcon className="w-5 h-5" />
                    Sign in with LinkedIn
                  </button>
                )}
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className={cn("w-full border-t", darkMode ? "border-white/20" : "border-border")}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={cn("px-2", darkMode ? "bg-jasper-navy text-gray-400" : "bg-white text-jasper-slate")}>or continue with email</span>
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
              <label htmlFor="email" className={cn(
                "block text-sm font-medium mb-2",
                darkMode ? "text-gray-200" : "text-jasper-carbon"
              )}>
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={cn("h-5 w-5", darkMode ? "text-gray-400" : "text-jasper-slate")} />
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
                    'block w-full pl-10 pr-4 py-3 border rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-jasper-emerald focus:border-transparent',
                    'transition-colors duration-200',
                    darkMode
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400'
                      : 'bg-white border-border text-jasper-carbon placeholder-jasper-slate/60'
                  )}
                  placeholder="admin@jasperfinance.org"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className={cn(
                "block text-sm font-medium mb-2",
                darkMode ? "text-gray-200" : "text-jasper-carbon"
              )}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={cn("h-5 w-5", darkMode ? "text-gray-400" : "text-jasper-slate")} />
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
                    'block w-full pl-10 pr-12 py-3 border rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-jasper-emerald focus:border-transparent',
                    'transition-colors duration-200',
                    darkMode
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400'
                      : 'bg-white border-border text-jasper-carbon placeholder-jasper-slate/60'
                  )}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className={cn("h-5 w-5 transition-colors", darkMode ? "text-gray-400 hover:text-white" : "text-jasper-slate hover:text-jasper-carbon")} />
                  ) : (
                    <Eye className={cn("h-5 w-5 transition-colors", darkMode ? "text-gray-400 hover:text-white" : "text-jasper-slate hover:text-jasper-carbon")} />
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
            <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-jasper-slate")}>
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
