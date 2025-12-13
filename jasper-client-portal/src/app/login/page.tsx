'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { clientAuthApi } from '@/lib/api'
import {
  Loader2,
  AlertCircle,
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Clock,
} from 'lucide-react'

// OAuth state storage key
const OAUTH_STATE_KEY = 'jasper_oauth_state'
const OAUTH_STATE_EXPIRY_KEY = 'jasper_oauth_state_expiry'
const STATE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

// Generate cryptographically secure state
function generateOAuthState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Store state with expiry
function storeOAuthState(state: string): void {
  sessionStorage.setItem(OAUTH_STATE_KEY, state)
  sessionStorage.setItem(OAUTH_STATE_EXPIRY_KEY, String(Date.now() + STATE_EXPIRY_MS))
}

// Validate and consume state (one-time use)
function validateAndConsumeState(receivedState: string): boolean {
  const storedState = sessionStorage.getItem(OAUTH_STATE_KEY)
  const expiryStr = sessionStorage.getItem(OAUTH_STATE_EXPIRY_KEY)

  // Clear state regardless of validation result (one-time use)
  sessionStorage.removeItem(OAUTH_STATE_KEY)
  sessionStorage.removeItem(OAUTH_STATE_EXPIRY_KEY)

  if (!storedState || !expiryStr) {
    return false
  }

  const expiry = parseInt(expiryStr, 10)
  if (Date.now() > expiry) {
    return false // State expired
  }

  // Constant-time comparison to prevent timing attacks
  if (storedState.length !== receivedState.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < storedState.length; i++) {
    result |= storedState.charCodeAt(i) ^ receivedState.charCodeAt(i)
  }

  return result === 0
}

// LinkedIn Icon
function LinkedInIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

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
              theme?: string
              size?: string
              width?: number
              type?: string
              text?: string
            }
          ) => void
          prompt: () => void
        }
      }
    }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { googleLogin, linkedinLogin, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)
  const [linkedinConfig, setLinkedinConfig] = useState<{ client_id: string; redirect_uri: string } | null>(null)

  // OAuth loading states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false)
  const [isOAuthConfigLoading, setIsOAuthConfigLoading] = useState(true)

  // Email/Password form state
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)

  // Check for session timeout parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const timeout = urlParams.get('timeout')
    if (timeout === '1') {
      setSessionExpired(true)
      // Clear the URL parameter
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  // Handle Google credential response
  const handleGoogleCredentialResponse = useCallback(async (response: { credential: string }) => {
    setError('')
    setIsLoading(true)
    setIsGoogleLoading(true)
    try {
      await googleLogin(response.credential)
    } catch (err) {
      if (err instanceof Error && err.message.includes('pending approval')) {
        setError('Your account is pending approval. You will receive an email once approved.')
      } else {
        setError(err instanceof Error ? err.message : 'Google login failed')
      }
      setIsLoading(false)
      setIsGoogleLoading(false)
    }
  }, [googleLogin])

  // Load OAuth configs
  useEffect(() => {
    const loadConfigs = async () => {
      setIsOAuthConfigLoading(true)
      try {
        const [gClientId, liConfig] = await Promise.all([
          clientAuthApi.getGoogleClientId(),
          clientAuthApi.getLinkedInConfig()
        ])
        setGoogleClientId(gClientId)
        setLinkedinConfig(liConfig)
      } catch (err) {
        console.error('Failed to load OAuth configs:', err)
      } finally {
        setIsOAuthConfigLoading(false)
      }
    }
    loadConfigs()
  }, [])

  // Initialize Google Sign-In
  useEffect(() => {
    if (!googleClientId) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        })
        const buttonDiv = document.getElementById('google-signin-button')
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'filled_black',
            size: 'large',
            width: 320,
            type: 'standard',
            text: 'continue_with',
          })
        }
      }
    }
    document.body.appendChild(script)

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [googleClientId, handleGoogleCredentialResponse])

  // Handle LinkedIn callback (check URL params)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const errorParam = urlParams.get('error')

    // Clear URL params first to prevent re-processing on re-render
    if (code || errorParam) {
      window.history.replaceState({}, '', '/login')
    }

    // Handle OAuth errors
    if (errorParam) {
      const errorDescription = urlParams.get('error_description') || 'OAuth authentication failed'
      setError(errorDescription)
      return
    }

    if (code && state) {
      // Validate state to prevent CSRF attacks
      if (!validateAndConsumeState(state)) {
        setError('Security validation failed. Please try signing in again.')
        return
      }

      setIsLoading(true)
      setIsLinkedInLoading(true)
      const redirectUri = `${window.location.origin}/login`
      linkedinLogin(code, redirectUri).catch(err => {
        if (err instanceof Error && err.message.includes('pending approval')) {
          setError('Your account is pending approval. You will receive an email once approved.')
        } else {
          setError(err instanceof Error ? err.message : 'LinkedIn login failed')
        }
        setIsLoading(false)
        setIsLinkedInLoading(false)
      })
    }
  }, [linkedinLogin])

  // Handle LinkedIn login click
  const handleLinkedInLogin = () => {
    if (!linkedinConfig) return

    // Generate and store cryptographic state for CSRF protection
    const state = generateOAuthState()
    storeOAuthState(state)

    const redirectUri = `${window.location.origin}/login`
    const linkedinAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
    linkedinAuthUrl.searchParams.set('response_type', 'code')
    linkedinAuthUrl.searchParams.set('client_id', linkedinConfig.client_id)
    linkedinAuthUrl.searchParams.set('redirect_uri', redirectUri)
    linkedinAuthUrl.searchParams.set('state', state)
    linkedinAuthUrl.searchParams.set('scope', 'openid profile email')

    window.location.href = linkedinAuthUrl.toString()
  }

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    setIsLoading(true)

    try {
      await clientAuthApi.login(email, password)
      router.push('/')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'

      if (errorMessage === 'EMAIL_NOT_VERIFIED') {
        // Store email in sessionStorage instead of URL to prevent sensitive data exposure
        sessionStorage.setItem('pending_verification_email', email)
        router.push('/verify-email')
        return
      }

      if (errorMessage === 'PENDING_APPROVAL') {
        setError('Your account is pending approval. You will receive an email once approved.')
      } else {
        setError(errorMessage)
      }
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-jasper-emerald animate-spin" />
          <span className="text-jasper-slate text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-surface-primary">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-secondary via-surface-primary to-jasper-emerald/10" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-jasper-emerald/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-jasper-emerald/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <div className="flex items-center gap-4 mb-8">
            <Image
              src="/images/jasper-icon.png"
              alt="JASPER"
              width={56}
              height={56}
              className="rounded-xl"
            />
            <div>
              <h1 className="text-2xl font-bold text-jasper-carbon tracking-tight">JASPER</h1>
              <p className="text-jasper-slate text-xs tracking-widest uppercase">Financial Architecture</p>
            </div>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold text-jasper-carbon leading-tight mb-6">
            Your Financial
            <br />
            <span className="text-gradient">Models, Delivered.</span>
          </h2>

          <p className="text-jasper-slate text-lg leading-relaxed max-w-md mb-8">
            Access your projects, track progress, review documents, and communicate with your team — all in one place.
          </p>

          <div className="space-y-4">
            {[
              'Real-time project tracking',
              'Secure document sharing',
              'Direct communication with your team',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-jasper-emerald/20 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-jasper-emerald" />
                </div>
                <span className="text-jasper-slate">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/images/jasper-icon.png"
                alt="JASPER"
                width={56}
                height={56}
                className="rounded-xl"
              />
            </div>
            <h1 className="text-2xl font-bold text-jasper-carbon tracking-tight">JASPER</h1>
            <p className="text-jasper-slate text-xs tracking-widest uppercase mt-1">Client Portal</p>
          </div>

          {/* Login Card */}
          <div className="card p-8">
            <h2 className="text-2xl font-semibold text-jasper-carbon text-center mb-2">
              Welcome Back
            </h2>
            <p className="text-jasper-slate text-center text-sm mb-8">
              Sign in to access your projects and documents
            </p>

            {/* Session Expired Message */}
            {sessionExpired && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3 text-amber-600 text-sm">
                <Clock className="w-5 h-5 flex-shrink-0" />
                <span>Your session has expired due to inactivity. Please sign in again.</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-jasper-emerald animate-spin" />
                <span className="ml-3 text-jasper-slate">Signing in...</span>
              </div>
            )}

            {/* Login Options */}
            {!isLoading && (
              <>
                {!showEmailForm ? (
                  <>
                    {/* OAuth Buttons */}
                    <div className="space-y-4">
                      {/* Google Sign In */}
                      <div className="min-h-[48px]">
                        {isGoogleLoading ? (
                          <button
                            disabled
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-tertiary border border-border rounded-lg text-jasper-slate"
                          >
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Signing in with Google...</span>
                          </button>
                        ) : isOAuthConfigLoading || !googleClientId ? (
                          <button
                            disabled
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-tertiary border border-border rounded-lg text-jasper-slate"
                          >
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Loading Google...</span>
                          </button>
                        ) : (
                          <div id="google-signin-button" className="flex justify-center" />
                        )}
                      </div>

                      {/* LinkedIn Sign In */}
                      <button
                        onClick={handleLinkedInLogin}
                        disabled={isOAuthConfigLoading || !linkedinConfig || isLinkedInLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-tertiary border border-border rounded-lg text-jasper-carbon font-medium hover:bg-surface-primary hover:border-jasper-emerald/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLinkedInLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Signing in with LinkedIn...</span>
                          </>
                        ) : isOAuthConfigLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Loading LinkedIn...</span>
                          </>
                        ) : (
                          <>
                            <LinkedInIcon />
                            <span>Continue with LinkedIn</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-jasper-slate-light text-xs uppercase tracking-wider">Or</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Email Login Button */}
                    <button
                      onClick={() => setShowEmailForm(true)}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-tertiary border border-border rounded-lg text-jasper-carbon font-medium hover:bg-surface-primary hover:border-jasper-emerald/50 transition-all duration-200"
                    >
                      <Mail className="w-5 h-5" />
                      <span>Continue with Email</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Email/Password Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-5">
                      <div>
                        <label htmlFor="email" className="input-label">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="input"
                          placeholder="you@company.com"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="password" className="input-label mb-0">Password</label>
                          <Link
                            href="/forgot-password"
                            className="text-xs text-jasper-emerald hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input pr-12"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-jasper-slate hover:text-jasper-carbon"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button type="submit" className="btn-primary w-full">
                        Sign In
                      </button>
                    </form>

                    {/* Back to OAuth */}
                    <button
                      onClick={() => setShowEmailForm(false)}
                      className="w-full mt-4 text-center text-sm text-jasper-slate hover:text-jasper-carbon"
                    >
                      &larr; Back to other sign in options
                    </button>
                  </>
                )}
              </>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-jasper-slate-light text-xs uppercase tracking-wider">New Here?</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Register Link */}
            <Link href="/register" className="btn-secondary w-full">
              Create an Account
            </Link>
          </div>

          {/* Info */}
          <div className="card mt-6 p-5 bg-gradient-to-br from-jasper-emerald/10 to-jasper-emerald/5 border-jasper-emerald/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-jasper-emerald/15 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-jasper-emerald" />
              </div>
              <div>
                <p className="text-sm font-medium text-jasper-carbon">Need Financial Modelling?</p>
                <p className="text-xs text-jasper-slate mt-1 leading-relaxed">
                  Interested in our services?{' '}
                  <a href="https://jasperfinance.org/contact" className="text-jasper-emerald hover:underline">
                    Contact us
                  </a>{' '}
                  or fill out our{' '}
                  <a href="https://portal.jasperfinance.org/intake" className="text-jasper-emerald hover:underline">
                    project questionnaire
                  </a>.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-jasper-slate-light text-xs mt-8">
            By signing in, you agree to our{' '}
            <a href="https://jasperfinance.org/terms" className="text-jasper-emerald hover:underline">
              Terms
            </a>{' '}
            and{' '}
            <a href="https://jasperfinance.org/privacy" className="text-jasper-emerald hover:underline">
              Privacy Policy
            </a>
          </p>

          <p className="text-center text-jasper-slate-light/50 text-xs mt-4">
            &copy; {new Date().getFullYear()} JASPER Financial Architecture
          </p>
        </div>
      </div>
    </div>
  )
}
