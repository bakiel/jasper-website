'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Home, RefreshCw, Mail, ArrowRight, FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(44,138,91,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(44,138,91,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-jasper-emerald/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-lg mx-auto text-center">
          {/* Icon */}
          <div className="w-24 h-24 rounded-full bg-jasper-emerald/10 flex items-center justify-center mx-auto mb-8">
            <FileQuestion className="w-12 h-12 text-jasper-emerald" />
          </div>

          {/* Error Code */}
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-surface-tertiary rounded-full text-jasper-slate text-sm font-mono">
              Error 404
            </span>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-jasper-carbon mb-4 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-jasper-slate text-lg mb-2">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <p className="text-jasper-slate-light text-sm font-mono mb-10">
            The reference points to a non-existent location.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              href="/"
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="btn-secondary flex items-center gap-2 px-6 py-3"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>

          {/* Help Link */}
          <div className="pt-8 border-t border-border">
            <p className="text-jasper-slate-light text-sm mb-4">
              Think this is an error on our end?
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

          {/* Easter Egg */}
          <p className="mt-10 text-jasper-slate-light/50 text-xs font-mono italic">
            Tip: Unlike this page, your financial models always resolve their references.
          </p>

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
