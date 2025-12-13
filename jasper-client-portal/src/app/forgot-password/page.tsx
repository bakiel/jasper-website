'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { clientAuthApi } from '@/lib/api'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  ArrowLeft,
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    setIsLoading(true)

    try {
      await clientAuthApi.forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary p-8">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-jasper-emerald/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-jasper-emerald" />
            </div>

            <h2 className="text-2xl font-semibold text-jasper-carbon mb-2">
              Check Your Email
            </h2>
            <p className="text-jasper-slate mb-6">
              We&apos;ve sent password reset instructions to:
            </p>
            <p className="text-jasper-emerald font-medium mb-6">{email}</p>

            <div className="bg-surface-tertiary/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-jasper-slate">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/login" className="btn-primary w-full">
                Return to Login
              </Link>
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="btn-secondary w-full"
              >
                Try a Different Email
              </button>
            </div>
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
          href="/login"
          className="inline-flex items-center gap-2 text-jasper-slate hover:text-jasper-carbon mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-jasper-emerald/20 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-jasper-emerald" />
            </div>

            <h2 className="text-2xl font-semibold text-jasper-carbon mb-2">
              Forgot Your Password?
            </h2>
            <p className="text-jasper-slate text-sm">
              Enter your email address and we&apos;ll send you instructions to reset your password.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="input-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="Enter your email address"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </button>
          </form>

          {/* Tip */}
          <div className="mt-6 p-4 bg-surface-tertiary/50 rounded-lg">
            <p className="text-xs text-jasper-slate-light">
              <strong className="text-jasper-slate">Tip:</strong> Check your spam folder if you don&apos;t receive the email within a few minutes.
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
