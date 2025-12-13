'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Sparkles,
  FolderKanban,
  Download,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Shield,
  FileText,
  MessageSquare,
} from 'lucide-react'

interface WelcomeHeroProps {
  userName: string
  hasProjects: boolean
  onDismiss?: () => void
}

export default function WelcomeHero({ userName, hasProjects, onDismiss }: WelcomeHeroProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      localStorage.setItem('jasper_welcome_dismissed', 'true')
      onDismiss?.()
    }, 300)
  }

  const quickLinks = [
    {
      icon: FolderKanban,
      title: 'Your Projects',
      description: 'Track progress and milestones',
      href: '/projects',
      color: 'bg-jasper-emerald/20',
      iconColor: 'text-jasper-emerald',
    },
    {
      icon: FileText,
      title: 'Documents',
      description: 'Access deliverables and resources',
      href: '/documents',
      color: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
    },
    {
      icon: MessageSquare,
      title: 'Messages',
      description: 'Direct line to your team',
      href: '/messages',
      color: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      icon: BookOpen,
      title: 'Resources',
      description: 'Learn about JASPER models',
      href: '/documents?tab=resources',
      color: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
    },
  ]

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-jasper-navy via-jasper-carbon to-jasper-navy border border-jasper-emerald/20 mb-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310B981' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-jasper-emerald/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Welcome Text */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-jasper-emerald/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-jasper-emerald" />
                </div>
                <span className="text-jasper-emerald font-medium text-sm uppercase tracking-wider">
                  Welcome to JASPER
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Hello, {userName}!
              </h1>

              <p className="text-jasper-slate text-lg mb-6 max-w-xl">
                Your client portal for professional financial modelling. Track your projects,
                access deliverables, and communicate directly with our team.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                {hasProjects ? (
                  <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-jasper-emerald hover:bg-jasper-emerald-dark text-white font-medium rounded-lg transition-colors"
                  >
                    <FolderKanban className="w-5 h-5" />
                    View Your Projects
                  </Link>
                ) : (
                  <a
                    href="https://jasperfinance.org/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-jasper-emerald hover:bg-jasper-emerald-dark text-white font-medium rounded-lg transition-colors"
                  >
                    <Sparkles className="w-5 h-5" />
                    Start a Project
                  </a>
                )}

                <Link
                  href="/documents?tab=resources"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/20"
                >
                  <Download className="w-5 h-5" />
                  Download Resources
                </Link>
              </div>
            </div>

            {/* Logo Card */}
            <div className="hidden md:block">
              <div className="relative">
                <div className="w-40 h-40 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center p-6">
                  <Image
                    src="/images/jasper-icon.png"
                    alt="JASPER"
                    width={100}
                    height={100}
                    className="rounded-lg"
                  />
                </div>
                <div className="absolute -bottom-3 -right-3 px-4 py-2 bg-jasper-emerald rounded-lg shadow-lg">
                  <span className="text-white text-sm font-medium">Client Portal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dismiss Button */}
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 text-jasper-slate hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group card p-5 hover:border-jasper-emerald/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${link.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-jasper-carbon group-hover:text-jasper-emerald transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-sm text-jasper-slate mt-0.5">{link.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-jasper-slate-light group-hover:text-jasper-emerald group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* JASPER Features */}
      <div className="card p-6 bg-gradient-to-r from-jasper-emerald/5 to-transparent border-jasper-emerald/20">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h3 className="font-semibold text-jasper-carbon mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-jasper-emerald" />
              JASPER Financial Architecture
            </h3>
            <p className="text-sm text-jasper-slate">
              Professional financial modelling for DFI submissions, investment presentations,
              and strategic planning. Our 28-sheet model architecture delivers institutional-grade
              deliverables for serious entrepreneurs.
            </p>
          </div>
          <a
            href="https://jasperfinance.org/services"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-jasper-emerald hover:bg-jasper-emerald/10 rounded-lg transition-colors whitespace-nowrap"
          >
            Learn More
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
