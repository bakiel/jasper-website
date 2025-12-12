'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  X,
  Check,
  FileText,
  DollarSign,
  FolderKanban,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  LucideIcon,
  Loader2,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

// Notification types
type NotificationType = 'invoice' | 'project' | 'client' | 'message' | 'system' | 'alert'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  link?: string
  priority?: 'low' | 'medium' | 'high'
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.jasperfinance.org'

// Fetch notifications from API
async function fetchNotifications(): Promise<Notification[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'admin', // In production, get from auth context
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch notifications')
    }

    const data = await response.json()

    if (data.success && data.notifications) {
      return data.notifications.map((n: Record<string, unknown>) => ({
        ...n,
        timestamp: new Date(n.timestamp as string),
      }))
    }

    return []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

// Mark notification as read via API
async function markNotificationRead(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'admin',
      },
      body: JSON.stringify({
        action: 'mark-read',
        notificationId,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error marking notification read:', error)
    return false
  }
}

// Mark all notifications as read via API
async function markAllNotificationsRead(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'admin',
      },
      body: JSON.stringify({
        action: 'mark-all-read',
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error marking all notifications read:', error)
    return false
  }
}

// Delete notification via API
async function deleteNotificationApi(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'admin',
      },
      body: JSON.stringify({
        notificationId,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error deleting notification:', error)
    return false
  }
}

// Clear all notifications via API
async function clearAllNotificationsApi(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'admin',
      },
      body: JSON.stringify({
        clearAll: true,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Error clearing notifications:', error)
    return false
  }
}

const getNotificationIcon = (type: NotificationType): LucideIcon => {
  switch (type) {
    case 'invoice':
      return DollarSign
    case 'project':
      return FolderKanban
    case 'client':
      return Users
    case 'message':
      return MessageSquare
    case 'alert':
      return AlertTriangle
    case 'system':
    default:
      return Info
  }
}

const getNotificationColor = (type: NotificationType, priority?: string): string => {
  if (priority === 'high') return 'text-red-500 bg-red-50'

  switch (type) {
    case 'invoice':
      return 'text-green-600 bg-green-50'
    case 'project':
      return 'text-blue-600 bg-blue-50'
    case 'client':
      return 'text-purple-600 bg-purple-50'
    case 'message':
      return 'text-jasper-emerald bg-jasper-emerald/10'
    case 'alert':
      return 'text-amber-600 bg-amber-50'
    case 'system':
    default:
      return 'text-jasper-slate bg-surface-secondary'
  }
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date.toISOString())
}

export function NotificationCenter(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    const data = await fetchNotifications()
    setNotifications(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
    // API call (fire and forget)
    markNotificationRead(id)
  }

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    // API call
    markAllNotificationsRead()
  }

  const deleteNotification = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id))
    // API call
    deleteNotificationApi(id)
  }

  const clearAllNotifications = async () => {
    setNotifications([])
    setIsOpen(false)
    clearAllNotificationsApi()
  }

  const handleNotificationClick = useCallback((notification: Notification): void => {
    markAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
    }
    setIsOpen(false)
  }, [router])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          isOpen
            ? 'bg-jasper-emerald/10 text-jasper-emerald'
            : 'text-jasper-slate hover:bg-surface-secondary'
        )}
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-jasper-emerald text-white text-xs font-medium rounded-full flex items-center justify-center"
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Notifications menu"
          className="absolute right-0 mt-2 w-96 bg-surface-primary rounded-lg shadow-lg border border-border z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-jasper-carbon">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-jasper-emerald/10 text-jasper-emerald rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-jasper-emerald hover:text-jasper-emerald-dark transition-colors flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-jasper-slate">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-jasper-slate">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  const colorClass = getNotificationColor(notification.type, notification.priority)

                  return (
                    <div
                      key={notification.id}
                      role="menuitem"
                      tabIndex={0}
                      aria-label={`${notification.title}: ${notification.message}${!notification.isRead ? ' (unread)' : ''}`}
                      className={cn(
                        'relative p-4 hover:bg-surface-secondary transition-colors cursor-pointer group',
                        'focus:outline-none focus:ring-2 focus:ring-jasper-emerald focus:ring-inset',
                        !notification.isRead && 'bg-jasper-emerald/5'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleNotificationClick(notification)
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              'text-sm font-medium',
                              notification.isRead ? 'text-jasper-slate' : 'text-jasper-carbon'
                            )}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-jasper-slate-light whitespace-nowrap flex-shrink-0">
                              {formatRelativeTime(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-jasper-slate mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-jasper-emerald flex-shrink-0 mt-2" />
                        )}
                      </div>

                      {/* Actions (visible on hover) */}
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                            className="p-1.5 hover:bg-surface-tertiary rounded-md transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5 text-jasper-slate" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <X className="w-3.5 h-3.5 text-jasper-slate hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border p-3">
              <button
                onClick={clearAllNotifications}
                className="w-full text-sm text-jasper-slate hover:text-jasper-carbon transition-colors text-center"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
