'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { clientAuthApi } from '@/lib/api'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.')
    }
  }, [token])

  const checkPasswordStrength = (pwd: string) => {
    setPasswordStrength({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    checkPasswordStrength(value)
  }

  const isPasswordValid = Object.values(passwordStrength).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid or missing reset token')
      return
    }

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      await clientAuthApi.resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed')
    } finally {
      setIsLoading(false)
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
              Password Reset Successful!
            </h2>
            <p className="text-jasper-slate mb-6">
              Your password has been changed successfully. You can now sign in with your new password.
            </p>

            <Link href="/login" className="btn-primary w-full">
              Sign In
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
        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-jasper-emerald/20 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-jasper-emerald" />
            </div>

            <h2 className="text-2xl font-semibold text-jasper-carbon mb-2">
              Reset Your Password
            </h2>
            <p className="text-jasper-slate text-sm">
              Enter your new password below
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!token ? (
            <div className="text-center">
              <p className="text-jasper-slate mb-6">
                This password reset link is invalid or has expired.
              </p>
              <Link href="/forgot-password" className="btn-primary w-full">
                Request New Reset Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="input-label">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="input pr-12"
                    placeholder="Enter your new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-jasper-slate hover:text-jasper-carbon"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Requirements */}
                {password && (
                  <div className="mt-3 p-3 bg-surface-tertiary/50 rounded-lg space-y-2">
                    <p className="text-xs text-jasper-slate font-medium mb-2">Password requirements:</p>
                    {[
                      { key: 'length', label: 'At least 8 characters' },
                      { key: 'uppercase', label: 'One uppercase letter' },
                      { key: 'lowercase', label: 'One lowercase letter' },
                      { key: 'number', label: 'One number' },
                      { key: 'special', label: 'One special character' },
                    ].map(req => (
                      <div key={req.key} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          passwordStrength[req.key as keyof typeof passwordStrength]
                            ? 'bg-green-500/20'
                            : 'bg-surface-tertiary'
                        }`}>
                          {passwordStrength[req.key as keyof typeof passwordStrength] && (
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                          )}
                        </div>
                        <span className={`text-xs ${
                          passwordStrength[req.key as keyof typeof passwordStrength]
                            ? 'text-green-400'
                            : 'text-jasper-slate-light'
                        }`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="input-label">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="input pr-12"
                    placeholder="Confirm your new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-jasper-slate hover:text-jasper-carbon"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <Loader2 className="w-8 h-8 text-jasper-emerald animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
