'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  X,
  ChevronRight,
  ChevronLeft,
  FolderKanban,
  FileText,
  MessageSquare,
  Shield,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

interface OnboardingWelcomeProps {
  userName: string
  onComplete: () => void
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to JASPER',
    subtitle: 'Your Financial Modelling Partner',
    description: 'We\'re excited to have you on board. This quick tour will help you navigate your client portal and get the most out of your experience.',
    icon: Sparkles,
    color: 'bg-jasper-emerald/20',
    iconColor: 'text-jasper-emerald',
  },
  {
    id: 'projects',
    title: 'Track Your Projects',
    subtitle: 'Real-time Progress Updates',
    description: 'View all your financial modelling projects in one place. Monitor progress, review milestones, and stay informed at every stage of development.',
    icon: FolderKanban,
    color: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    features: [
      'Live progress tracking',
      'Project milestone updates',
      'Stage-by-stage visibility',
    ],
  },
  {
    id: 'documents',
    title: 'Access Your Documents',
    subtitle: 'Secure File Sharing',
    description: 'Download deliverables, review drafts, and access all project-related documents securely. Everything you need, organised and easy to find.',
    icon: FileText,
    color: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    features: [
      'Financial models & spreadsheets',
      'Reports & presentations',
      'Version history',
    ],
  },
  {
    id: 'communication',
    title: 'Stay Connected',
    subtitle: 'Direct Communication',
    description: 'Message your project team directly, receive important notifications, and never miss an update on your projects.',
    icon: MessageSquare,
    color: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    features: [
      'Direct messaging with your team',
      'Email notifications',
      'Activity feed',
    ],
  },
  {
    id: 'security',
    title: 'Your Data is Secure',
    subtitle: 'Enterprise-Grade Security',
    description: 'Your financial information is protected with bank-level encryption. We take security seriously so you can focus on your business.',
    icon: Shield,
    color: 'bg-green-500/20',
    iconColor: 'text-green-400',
    features: [
      '256-bit SSL encryption',
      'Secure document storage',
      'Access controls',
    ],
  },
]

export default function OnboardingWelcome({ userName, onComplete }: OnboardingWelcomeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  const step = steps[currentStep]
  const StepIcon = step.icon
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    setIsExiting(true)
    setTimeout(() => {
      onComplete()
    }, 300)
  }

  const handleSkip = () => {
    handleComplete()
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-jasper-carbon/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className={`relative w-full max-w-lg bg-surface-secondary border border-border rounded-2xl shadow-2xl overflow-hidden transition-transform duration-300 ${isExiting ? 'scale-95' : 'scale-100'}`}>
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-jasper-slate hover:text-jasper-carbon hover:bg-surface-tertiary rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-surface-tertiary">
          <div
            className="h-full bg-jasper-emerald transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 pt-12">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-jasper-emerald'
                    : index < currentStep
                    ? 'bg-jasper-emerald/50'
                    : 'bg-surface-tertiary'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-6`}>
            <StepIcon className={`w-10 h-10 ${step.iconColor}`} />
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            {isFirstStep && (
              <p className="text-jasper-emerald font-medium text-sm mb-2">
                Hello, {userName}!
              </p>
            )}
            <h2 className="text-2xl font-bold text-jasper-carbon mb-2">
              {step.title}
            </h2>
            <p className="text-jasper-emerald font-medium text-sm mb-4">
              {step.subtitle}
            </p>
            <p className="text-jasper-slate text-sm leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Features (if any) */}
          {step.features && (
            <div className="bg-surface-tertiary/50 rounded-xl p-4 mb-8">
              <ul className="space-y-3">
                {step.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-jasper-emerald flex-shrink-0" />
                    <span className="text-jasper-slate">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isFirstStep
                  ? 'text-jasper-slate-light cursor-not-allowed'
                  : 'text-jasper-slate hover:text-jasper-carbon hover:bg-surface-tertiary'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleSkip}
              className="text-sm text-jasper-slate hover:text-jasper-carbon"
            >
              Skip tour
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-jasper-emerald hover:bg-jasper-emerald-dark text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLastStep ? (
                <>
                  Get Started
                  <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Logo */}
        <div className="px-8 pb-6">
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-border">
            <Image
              src="/images/jasper-icon.png"
              alt="JASPER"
              width={24}
              height={24}
              className="rounded opacity-50"
            />
            <span className="text-xs text-jasper-slate-light">JASPER Financial Architecture</span>
          </div>
        </div>
      </div>
    </div>
  )
}
