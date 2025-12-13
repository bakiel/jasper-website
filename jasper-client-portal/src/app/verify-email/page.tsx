'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { clientAuthApi } from '@/lib/api'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  // Prefer sessionStorage (secure) over URL params (legacy fallback)
  const [email, setEmail] = useState('')

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Get email from sessionStorage (secure) or URL params (legacy fallback)
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('pending_verification_email')
    const urlEmail = searchParams.get('email')

    if (storedEmail) {
      setEmail(storedEmail)
      // Clean up sessionStorage after reading
      sessionStorage.removeItem('pending_verification_email')
    } else if (urlEmail) {
      setEmail(urlEmail)
      // Clear sensitive data from URL
      window.history.replaceState({}, '', '/verify-email')
    }
  }, [searchParams])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1) // Only take last character

    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (newCode.every(c => c) && newCode.join('').length === 6) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      inputRefs.current[5]?.focus()
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (verificationCode: string) => {
    if (!email) {
      setError('Email address is missing. Please go back and register again.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await clientAuthApi.verifyEmail(email, verificationCode)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return

    setIsResending(true)
    setError('')

    try {
      await clientAuthApi.resendCode(email)
      setResendCooldown(60)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary p-8">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>

            <h2 className="text-2xl font-semibold text-jasper-carbon mb-2">
              Email Verified!
            </h2>
            <p className="text-jasper-slate mb-6">
              Your email has been verified successfully. Your account is now pending approval from our team.
            </p>

            <div className="bg-surface-tertiary/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-jasper-slate">
                You will receive an email notification once your account has been approved. This usually takes less than 24 hours.
              </p>
            </div>

            <Link href="/login" className="btn-primary w-full">
              Go to Login
            </Link>
          </div>

          <p className="text-center text-jasper-slate-light/50 text-xs mt-6">
            &copy; {new Date().getFullYear()} JASPER Financial Architecture
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary p-8">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-jasper-slate hover:text-jasper-carbon mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registration
        </Link>

        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-jasper-emerald/20 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-jasper-emerald" />
            </div>

            <h2 className="text-2xl font-semibold text-jasper-carbon mb-2">
              Verify Your Email
            </h2>
            <p className="text-jasper-slate text-sm">
              We&apos;ve sent a 6-digit verification code to
            </p>
            <p className="text-jasper-emerald font-medium mt-1">{email || 'your email'}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Code Input */}
          <div className="mb-6">
            <label className="input-label text-center block mb-4">Enter verification code</label>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  disabled={isLoading}
                  className="w-12 h-14 text-center text-2xl font-semibold bg-surface-tertiary border border-border rounded-lg text-jasper-carbon focus:outline-none focus:ring-2 focus:ring-jasper-emerald focus:border-jasper-emerald disabled:opacity-50 transition-all"
                />
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-jasper-emerald animate-spin" />
              <span className="ml-3 text-jasper-slate">Verifying...</span>
            </div>
          )}

          {/* Resend Code */}
          <div className="text-center mt-6">
            <p className="text-jasper-slate text-sm mb-3">
              Didn&apos;t receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending || isLoading}
              className="inline-flex items-center gap-2 text-jasper-emerald hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed text-sm font-medium"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend Code
                </>
              )}
            </button>
          </div>

          {/* Tip */}
          <div className="mt-6 p-4 bg-surface-tertiary/50 rounded-lg">
            <p className="text-xs text-jasper-slate-light">
              <strong className="text-jasper-slate">Tip:</strong> Check your spam folder if you don&apos;t see the email in your inbox. The code expires in 15 minutes.
            </p>
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mt-8">
          <Image
            src="/images/jasper-icon.png"
            alt="JASPER"
            width={40}
            height={40}
            className="rounded-lg opacity-50"
          />
        </div>

        <p className="text-center text-jasper-slate-light/50 text-xs mt-4">
          &copy; {new Date().getFullYear()} JASPER Financial Architecture
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <Loader2 className="w-8 h-8 text-jasper-emerald animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
