'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, Mail, ArrowLeft } from 'lucide-react'

export default function PendingApprovalPage() {
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

        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>

          <h2 className="text-2xl font-semibold text-jasper-carbon mb-2">
            Account Pending Approval
          </h2>
          <p className="text-jasper-slate mb-6">
            Your email has been verified successfully. Your account is currently being reviewed by our team.
          </p>

          <div className="bg-surface-tertiary/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-jasper-carbon mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-jasper-slate">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-jasper-emerald/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-jasper-emerald font-medium">1</span>
                </span>
                <span>Our team will review your registration details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-jasper-emerald/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-jasper-emerald font-medium">2</span>
                </span>
                <span>You&apos;ll receive an email notification once approved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-jasper-emerald/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-jasper-emerald font-medium">3</span>
                </span>
                <span>After approval, you can sign in and access your portal</span>
              </li>
            </ul>
          </div>

          <div className="bg-surface-tertiary/50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-jasper-slate" />
              <p className="text-sm text-jasper-slate">
                Review typically takes less than 24 hours
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/login" className="btn-primary w-full">
              Return to Login
            </Link>
            <a
              href="mailto:support@jasperfinance.org"
              className="btn-secondary w-full"
            >
              Contact Support
            </a>
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
