'use client'

import { User } from 'lucide-react'
import { NotificationCenter } from './NotificationCenter'
import { GlobalSearch } from '@/components/ui/GlobalSearch'
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/Breadcrumbs'

interface HeaderProps {
  title?: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
}

export function Header({ title, subtitle, breadcrumbs }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Title Section */}
        <div className="flex flex-col">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} className="mb-1" />
          )}
          {title && (
            <h1 className="text-xl font-semibold text-jasper-carbon">{title}</h1>
          )}
          {subtitle && (
            <p className="text-sm text-jasper-slate">{subtitle}</p>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Global Search */}
          <GlobalSearch className="hidden md:flex" />

          {/* Notifications */}
          <NotificationCenter />

          {/* User Menu */}
          <button className="flex items-center gap-3 p-2 hover:bg-surface-secondary rounded-lg transition-colors">
            <div className="w-8 h-8 rounded-full bg-jasper-emerald/10 flex items-center justify-center">
              <User className="w-4 h-4 text-jasper-emerald" />
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium text-jasper-carbon">Admin</span>
              <span className="text-xs text-jasper-slate">admin@jasper.com</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
