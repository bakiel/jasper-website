'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clientAuthApi } from '@/lib/api'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (name === 'password') {
      checkPasswordStrength(value)
    }
  }

  const isPasswordValid = Object.values(passwordStrength).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.fullName.trim()) {
      setError('Please enter your full name')
      return
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address')
      return
    }

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!formData.acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy')
      return
    }

    setIsLoading(true)

    try {
      await clientAuthApi.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        company_name: formData.companyName || undefined,
      })

      // Redirect to verification page
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      setIsLoading(false)
    }
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
            Join the
            <br />
            <span className="text-gradient">JASPER Platform</span>
          </h2>

          <p className="text-jasper-slate text-lg leading-relaxed max-w-md mb-8">
            Create your account to access your financial models, track project progress, and collaborate with your team.
          </p>

          <div className="space-y-4">
            {[
              'Dedicated project dashboard',
              'Real-time progress updates',
              'Secure document sharing',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-jasper-emerald/20 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-jasper-emerald" />
                </div>
                <span className="text-jasper-slate">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
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

          {/* Register Card */}
          <div className="card p-8">
            <h2 className="text-2xl font-semibold text-jasper-carbon text-center mb-2">
              Create Your Account
            </h2>
            <p className="text-jasper-slate text-center text-sm mb-6">
              Fill in your details to get started
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="input-label">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input"
                  placeholder="John Smith"
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="input-label">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="john@company.com"
                  disabled={isLoading}
                />
              </div>

              {/* Company Name */}
              <div>
                <label htmlFor="companyName" className="input-label">
                  Company Name <span className="text-jasper-slate-light">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="input"
                  placeholder="Your Company"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="input-label">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input pr-12"
                    placeholder="Create a strong password"
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
                {formData.password && (
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
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pr-12"
                    placeholder="Confirm your password"
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
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded border-border bg-surface-tertiary text-jasper-emerald focus:ring-jasper-emerald"
                  disabled={isLoading}
                />
                <label htmlFor="acceptTerms" className="text-sm text-jasper-slate">
                  I agree to the{' '}
                  <a href="https://jasperfinance.org/terms" target="_blank" rel="noopener noreferrer" className="text-jasper-emerald hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="https://jasperfinance.org/privacy" target="_blank" rel="noopener noreferrer" className="text-jasper-emerald hover:underline">
                    Privacy Policy
                  </a>
                </label>
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-jasper-slate-light text-xs">Already have an account?</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Sign In Link */}
            <Link
              href="/login"
              className="btn-secondary w-full"
            >
              Sign In Instead
            </Link>
          </div>

          {/* Info Box */}
          <div className="card mt-6 p-5 bg-gradient-to-br from-jasper-emerald/10 to-jasper-emerald/5 border-jasper-emerald/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-jasper-emerald/15 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-jasper-emerald" />
              </div>
              <div>
                <p className="text-sm font-medium text-jasper-carbon">Enterprise Solutions</p>
                <p className="text-xs text-jasper-slate mt-1 leading-relaxed">
                  Looking for custom financial modelling solutions for your organisation?{' '}
                  <a href="https://jasperfinance.org/contact" className="text-jasper-emerald hover:underline">
                    Contact our team
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-jasper-slate-light/50 text-xs mt-6">
            &copy; {new Date().getFullYear()} JASPER Financial Architecture
          </p>
        </div>
      </div>
    </div>
  )
}
