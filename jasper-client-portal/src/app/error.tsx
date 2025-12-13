'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { AlertTriangle, RefreshCw, Home, Mail, ArrowRight } from 'lucide-react'

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

          {/* Error Code */}
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm font-mono">
              {error.digest ? `Error: ${error.digest}` : 'Application Error'}
            </span>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-jasper-carbon mb-4 tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-jasper-slate text-lg mb-2">
            We encountered an unexpected error.
          </p>
          <p className="text-jasper-slate-light text-sm mb-10">
            Don&apos;t worry, your data is safe. Please try again.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={reset}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <a
              href="/"
              className="btn-secondary flex items-center gap-2 px-6 py-3"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </a>
          </div>

          {/* Error Details (Dev only) */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mb-8 p-4 bg-surface-tertiary rounded-lg border border-border text-left overflow-auto max-h-32">
              <p className="text-xs font-mono text-red-400 break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Help Link */}
          <div className="pt-8 border-t border-border">
            <p className="text-jasper-slate-light text-sm mb-4">
              If this keeps happening, please contact support.
            </p>
            <a
              href="mailto:support@jasperfinance.org"
              className="inline-flex items-center gap-2 text-jasper-emerald hover:text-jasper-emerald-dark transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              support@jasperfinance.org
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {/* Logo */}
          <div className="flex justify-center mt-12">
            <Image
              src="/images/jasper-icon.png"
              alt="JASPER"
              width={40}
              height={40}
              className="rounded-lg opacity-40"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
