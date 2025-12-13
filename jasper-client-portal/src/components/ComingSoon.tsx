'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Clock, Bell } from 'lucide-react'
import { ReactNode } from 'react'

interface ComingSoonProps {
  title: string
  description: string
  icon: ReactNode
  features?: string[]
}

export default function ComingSoon({ title, description, icon, features }: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-surface-primary border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/images/jasper-icon.png"
                  alt="JASPER"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <div className="hidden sm:block">
                  <span className="text-lg font-bold text-jasper-carbon tracking-tight">JASPER</span>
                  <span className="text-xs text-jasper-slate block -mt-1">Client Portal</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-jasper-slate hover:text-jasper-carbon mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="card p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-jasper-emerald/10 flex items-center justify-center mx-auto mb-6">
            {icon}
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-600 text-sm mb-6">
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl md:text-3xl font-bold text-jasper-carbon mb-4">
            {title}
          </h1>
          <p className="text-jasper-slate text-lg mb-8 max-w-md mx-auto">
            {description}
          </p>

          {/* Features Preview */}
          {features && features.length > 0 && (
            <div className="bg-surface-tertiary/50 rounded-lg p-6 mb-8 text-left max-w-sm mx-auto">
              <p className="text-sm font-medium text-jasper-carbon mb-3">What you&apos;ll be able to do:</p>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-jasper-slate">
                    <span className="w-1.5 h-1.5 rounded-full bg-jasper-emerald mt-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notification CTA */}
          <div className="pt-6 border-t border-border">
            <p className="text-jasper-slate-light text-sm mb-4">
              Want to be notified when this feature launches?
            </p>
            <button
              onClick={() => alert('We\'ll notify you when this feature is ready!')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-jasper-emerald/10 text-jasper-emerald rounded-lg hover:bg-jasper-emerald/20 transition-colors text-sm font-medium"
            >
              <Bell className="w-4 h-4" />
              Notify Me
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-jasper-slate-light text-sm mt-8">
          For urgent requests, please{' '}
          <a href="mailto:support@jasperfinance.org" className="text-jasper-emerald hover:underline">
            contact support
          </a>
          .
        </p>
      </main>
    </div>
  )
}
