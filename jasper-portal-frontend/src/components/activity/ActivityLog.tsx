'use client'

import { useState, useEffect } from 'react'
import {
  Activity,
  Users,
  FolderKanban,
  FileText,
  DollarSign,
  MessageSquare,
  Upload,
  Download,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import Link from 'next/link'

// Activity types
type ActivityType =
  | 'project_created'
  | 'project_updated'
  | 'project_stage_changed'
  | 'project_completed'
  | 'invoice_created'
  | 'invoice_sent'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'client_created'
  | 'client_updated'
  | 'contact_added'
  | 'document_uploaded'
  | 'document_downloaded'
  | 'message_sent'
  | 'message_received'
  | 'milestone_completed'
  | 'user_login'

interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: Date
  user?: string
  entityType?: 'project' | 'invoice' | 'client' | 'document' | 'message'
  entityId?: number
  entityName?: string
  metadata?: Record<string, any>
}

// Mock activity data - in production, this would come from an API
const generateMockActivities = (): ActivityItem[] => {
  const now = new Date()
  return [
    {
      id: '1',
      type: 'invoice_paid',
      title: 'Invoice Paid',
      description: 'INV-2024-0023 was marked as paid',
      timestamp: new Date(now.getTime() - 5 * 60 * 1000),
      user: 'System',
      entityType: 'invoice',
      entityId: 23,
      entityName: 'INV-2024-0023',
      metadata: { amount: 45000, currency: 'ZAR' },
    },
    {
      id: '2',
      type: 'project_stage_changed',
      title: 'Project Stage Updated',
      description: 'PRJ-2024-0005 moved from Proposal to Deposit',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000),
      user: 'Admin',
      entityType: 'project',
      entityId: 5,
      entityName: 'PRJ-2024-0005',
      metadata: { from: 'proposal', to: 'deposit' },
    },
    {
      id: '3',
      type: 'document_uploaded',
      title: 'Document Uploaded',
      description: 'Financial Model v2.xlsx uploaded to PRJ-2024-0005',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      user: 'Admin',
      entityType: 'document',
      entityId: 15,
      entityName: 'Financial Model v2.xlsx',
    },
    {
      id: '4',
      type: 'client_created',
      title: 'New Client Added',
      description: 'Gahn Eden Holdings was added to the system',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      user: 'Admin',
      entityType: 'client',
      entityId: 12,
      entityName: 'Gahn Eden Holdings',
    },
    {
      id: '5',
      type: 'invoice_sent',
      title: 'Invoice Sent',
      description: 'INV-2024-0024 was sent to Kutlwano Holdings',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      user: 'Admin',
      entityType: 'invoice',
      entityId: 24,
      entityName: 'INV-2024-0024',
      metadata: { amount: 150000, currency: 'ZAR', recipient: 'Kutlwano Holdings' },
    },
    {
      id: '6',
      type: 'milestone_completed',
      title: 'Milestone Completed',
      description: 'Data Collection milestone completed for PRJ-2024-0003',
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      user: 'Admin',
      entityType: 'project',
      entityId: 3,
      entityName: 'PRJ-2024-0003',
      metadata: { milestone: 'Data Collection' },
    },
    {
      id: '7',
      type: 'message_received',
      title: 'New Message',
      description: 'Message received from Kutlwano Holdings regarding PRJ-2024-0002',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      user: 'Client',
      entityType: 'message',
      entityId: 45,
    },
    {
      id: '8',
      type: 'project_created',
      title: 'Project Created',
      description: 'New project PRJ-2024-0006 created for Gahn Eden Holdings',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      user: 'Admin',
      entityType: 'project',
      entityId: 6,
      entityName: 'PRJ-2024-0006',
    },
    {
      id: '9',
      type: 'invoice_overdue',
      title: 'Invoice Overdue',
      description: 'INV-2024-0018 is now 7 days overdue',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      user: 'System',
      entityType: 'invoice',
      entityId: 18,
      entityName: 'INV-2024-0018',
      metadata: { daysOverdue: 7, amount: 350000, currency: 'ZAR' },
    },
    {
      id: '10',
      type: 'contact_added',
      title: 'Contact Added',
      description: 'John Smith added as contact for Gahn Eden Holdings',
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      user: 'Admin',
      entityType: 'client',
      entityId: 12,
      entityName: 'Gahn Eden Holdings',
      metadata: { contactName: 'John Smith', role: 'CFO' },
    },
  ]
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'project_created':
    case 'project_updated':
      return FolderKanban
    case 'project_stage_changed':
      return ChevronRight
    case 'project_completed':
      return CheckCircle
    case 'invoice_created':
    case 'invoice_sent':
      return FileText
    case 'invoice_paid':
      return DollarSign
    case 'invoice_overdue':
      return XCircle
    case 'client_created':
    case 'client_updated':
    case 'contact_added':
      return Users
    case 'document_uploaded':
      return Upload
    case 'document_downloaded':
      return Download
    case 'message_sent':
    case 'message_received':
      return MessageSquare
    case 'milestone_completed':
      return CheckCircle
    case 'user_login':
      return Users
    default:
      return Activity
  }
}

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case 'project_created':
    case 'project_completed':
    case 'invoice_paid':
    case 'milestone_completed':
      return 'text-green-600 bg-green-50'
    case 'project_stage_changed':
    case 'project_updated':
      return 'text-blue-600 bg-blue-50'
    case 'invoice_created':
    case 'invoice_sent':
      return 'text-purple-600 bg-purple-50'
    case 'invoice_overdue':
      return 'text-red-600 bg-red-50'
    case 'client_created':
    case 'client_updated':
    case 'contact_added':
      return 'text-indigo-600 bg-indigo-50'
    case 'document_uploaded':
    case 'document_downloaded':
      return 'text-amber-600 bg-amber-50'
    case 'message_sent':
    case 'message_received':
      return 'text-jasper-emerald bg-jasper-emerald/10'
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
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  return formatDate(date.toISOString())
}

const getEntityLink = (entityType?: string, entityId?: number) => {
  if (!entityType || !entityId) return null
  switch (entityType) {
    case 'project':
      return `/projects/${entityId}`
    case 'invoice':
      return `/invoices/${entityId}`
    case 'client':
      return `/clients/${entityId}`
    default:
      return null
  }
}

interface ActivityLogProps {
  limit?: number
  showHeader?: boolean
  showFilters?: boolean
  compact?: boolean
}

export function ActivityLog({
  limit,
  showHeader = true,
  showFilters = false,
  compact = false,
}: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))
    setActivities(generateMockActivities())
    setLoading(false)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadActivities()
    setIsRefreshing(false)
  }

  const filteredActivities = filterType === 'all'
    ? activities
    : activities.filter(a => {
        if (filterType === 'projects') return a.type.startsWith('project') || a.type === 'milestone_completed'
        if (filterType === 'invoices') return a.type.startsWith('invoice')
        if (filterType === 'clients') return a.type.startsWith('client') || a.type === 'contact_added'
        if (filterType === 'documents') return a.type.startsWith('document')
        if (filterType === 'messages') return a.type.startsWith('message')
        return true
      })

  const displayedActivities = limit ? filteredActivities.slice(0, limit) : filteredActivities

  if (loading) {
    return (
      <div className="card">
        {showHeader && (
          <div className="card-header">
            <h3 className="font-semibold text-jasper-carbon">Activity Log</h3>
          </div>
        )}
        <div className="p-8 text-center">
          <div className="animate-pulse text-jasper-slate">Loading activities...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('card', compact && 'border-0 shadow-none')}>
      {/* Header */}
      {showHeader && (
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-jasper-emerald" />
            <h3 className="font-semibold text-jasper-carbon">Activity Log</h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4 text-jasper-slate', isRefreshing && 'animate-spin')} />
          </button>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-jasper-slate flex-shrink-0" />
          {['all', 'projects', 'invoices', 'clients', 'documents', 'messages'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                filterType === type
                  ? 'bg-jasper-emerald text-white'
                  : 'bg-surface-secondary text-jasper-slate hover:bg-surface-tertiary'
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Activity List */}
      <div className={cn('divide-y divide-border', compact && 'divide-y-0')}>
        {displayedActivities.length === 0 ? (
          <div className="p-8 text-center text-jasper-slate">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activities found</p>
          </div>
        ) : (
          displayedActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type)
            const colorClass = getActivityColor(activity.type)
            const link = getEntityLink(activity.entityType, activity.entityId)

            const content = (
              <div
                className={cn(
                  'flex gap-3 p-4 transition-colors',
                  link && 'hover:bg-surface-secondary cursor-pointer',
                  compact && 'py-3'
                )}
              >
                {/* Timeline connector for non-compact mode */}
                {!compact && (
                  <div className="relative flex flex-col items-center">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center z-10', colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {index < displayedActivities.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border-light mt-2" />
                    )}
                  </div>
                )}

                {/* Compact mode icon */}
                {compact && (
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn(
                        'font-medium text-jasper-carbon',
                        compact ? 'text-sm' : 'text-base'
                      )}>
                        {activity.title}
                      </p>
                      <p className={cn(
                        'text-jasper-slate mt-0.5',
                        compact ? 'text-xs' : 'text-sm'
                      )}>
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={cn(
                        'text-jasper-slate-light whitespace-nowrap',
                        compact ? 'text-xs' : 'text-sm'
                      )}>
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                      {!compact && activity.user && (
                        <p className="text-xs text-jasper-slate-light mt-0.5">
                          by {activity.user}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )

            return link ? (
              <Link key={activity.id} href={link}>
                {content}
              </Link>
            ) : (
              <div key={activity.id}>{content}</div>
            )
          })
        )}
      </div>

      {/* View All Link */}
      {limit && activities.length > limit && (
        <div className="border-t border-border p-3">
          <Link
            href="/activity"
            className="w-full text-sm text-jasper-emerald hover:text-jasper-emerald-dark transition-colors text-center block"
          >
            View all activity
          </Link>
        </div>
      )}
    </div>
  )
}
