'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Home, RefreshCw, AlertTriangle, Mail } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-red-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-lg mx-auto text-center">
          {/* Icon */}
          <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-8">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>

          {/* Error Badge */}
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-sm font-mono">
              Something went wrong
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-jasper-carbon mb-4 tracking-tight">
            Unexpected Error
          </h1>

          {/* Description */}
          <p className="text-jasper-slate leading-relaxed mb-8 max-w-md mx-auto">
            We encountered an unexpected error while loading this page.
            Please try again or return to the dashboard.
          </p>

          {/* Error Digest (for debugging) */}
          {error.digest && process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-surface-tertiary rounded-lg">
              <p className="text-xs text-jasper-slate font-mono">
                Error ID: {error.digest}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={() => reset()}
              className="group flex items-center gap-2 px-6 py-3 bg-jasper-emerald text-white rounded-lg font-medium hover:bg-jasper-emerald-dark transition-all duration-200 shadow-sm"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-surface-tertiary text-jasper-carbon rounded-lg font-medium hover:bg-surface-secondary transition-all duration-200"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </Link>
          </div>

          {/* Help Link */}
          <div className="pt-8 border-t border-border">
            <p className="text-jasper-slate text-sm mb-3">
              If this problem persists, please contact support
            </p>
            <a
              href="mailto:support@jasperfinance.org"
              className="inline-flex items-center gap-2 text-jasper-emerald hover:underline text-sm"
            >
              <Mail className="w-4 h-4" />
              support@jasperfinance.org
            </a>
          </div>

          {/* Footer */}
          <div className="mt-12 flex items-center justify-center gap-3">
            <Image
              src="/images/jasper-icon.png"
              alt="JASPER"
              width={24}
              height={24}
              className="rounded"
            />
            <span className="text-jasper-slate-light text-sm">
              JASPER Financial Architecture
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
