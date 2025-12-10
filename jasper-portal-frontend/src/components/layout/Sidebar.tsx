'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Invoices', href: '/invoices', icon: FileText },
]

const bottomItems = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-border transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            {/* JASPER Logo - Official brand icon */}
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image
                src="/images/jasper-icon.png"
                alt="JASPER"
                fill
                className="object-contain"
                priority
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-jasper-navy text-lg leading-tight tracking-tight">
                  JASPER
                </span>
                <span className="text-[10px] text-jasper-slate -mt-0.5 uppercase tracking-wider">
                  Financial Architecture
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'nav-item',
                  isActive && 'nav-item-active'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User info & Bottom Section */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          {/* Current user display */}
          {user && !collapsed && (
            <div className="px-3 py-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-jasper-emerald/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-jasper-emerald" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-jasper-carbon truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-jasper-slate truncate capitalize">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {bottomItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'nav-item',
                  isActive && 'nav-item-active'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}

          <button
            onClick={logout}
            className="nav-item w-full text-left text-status-error hover:bg-red-50 hover:text-status-error"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-surface-secondary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-jasper-slate" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-jasper-slate" />
          )}
        </button>
      </div>
    </aside>
  )
}
