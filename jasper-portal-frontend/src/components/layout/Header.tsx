'use client'

import { Bell, Search, User } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-border">
      <div className="flex items-center justify-between h-full px-6">
        {/* Title Section */}
        <div className="flex flex-col">
          {title && (
            <h1 className="text-xl font-semibold text-jasper-carbon">{title}</h1>
          )}
          {subtitle && (
            <p className="text-sm text-jasper-slate">{subtitle}</p>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jasper-slate-light" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 text-sm bg-surface-secondary border-0 rounded-lg placeholder:text-jasper-slate-light focus:outline-none focus:ring-2 focus:ring-jasper-emerald"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-jasper-slate hover:bg-surface-secondary rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-jasper-emerald rounded-full" />
          </button>

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
