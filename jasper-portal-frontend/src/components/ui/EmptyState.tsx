'use client'

import Link from 'next/link'
import {
  FolderKanban,
  Users,
  FileText,
  MessageSquare,
  Inbox,
  Search,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type EmptyStateType =
  | 'projects'
  | 'clients'
  | 'invoices'
  | 'messages'
  | 'search'
  | 'activity'
  | 'generic'

interface EmptyStateProps {
  type: EmptyStateType
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

const emptyStateConfig: Record<EmptyStateType, {
  icon: typeof FolderKanban
  title: string
  description: string
  actionLabel?: string
  iconColor: string
  bgColor: string
}> = {
  projects: {
    icon: FolderKanban,
    title: 'No projects yet',
    description: 'Create your first project to start tracking your pipeline and deliverables.',
    actionLabel: 'Create Project',
    iconColor: 'text-jasper-emerald',
    bgColor: 'bg-jasper-emerald/10',
  },
  clients: {
    icon: Users,
    title: 'No clients yet',
    description: 'Add your first client to start building your customer relationships.',
    actionLabel: 'Add Client',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  invoices: {
    icon: FileText,
    title: 'No invoices yet',
    description: 'Create your first invoice to start tracking payments and revenue.',
    actionLabel: 'Create Invoice',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  messages: {
    icon: MessageSquare,
    title: 'No messages',
    description: 'Your inbox is empty. Messages from clients will appear here.',
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria to find what you\'re looking for.',
    iconColor: 'text-jasper-slate',
    bgColor: 'bg-jasper-slate/10',
  },
  activity: {
    icon: Inbox,
    title: 'No activity yet',
    description: 'Recent activity and updates will appear here as you use the platform.',
    iconColor: 'text-jasper-slate',
    bgColor: 'bg-jasper-slate/10',
  },
  generic: {
    icon: Inbox,
    title: 'Nothing here yet',
    description: 'This section is empty. Content will appear here once available.',
    iconColor: 'text-jasper-slate',
    bgColor: 'bg-jasper-slate/10',
  },
}

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const Icon = config.icon

  const displayTitle = title || config.title
  const displayDescription = description || config.description
  const displayActionLabel = actionLabel || config.actionLabel

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {/* Decorative background pattern */}
      <div className="relative mb-6">
        <div className={cn(
          'w-20 h-20 rounded-2xl flex items-center justify-center',
          config.bgColor
        )}>
          <Icon className={cn('w-10 h-10', config.iconColor)} />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-jasper-emerald/20" />
        <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-jasper-slate/20" />
      </div>

      {/* Text content */}
      <h3 className="text-lg font-semibold text-jasper-carbon mb-2">
        {displayTitle}
      </h3>
      <p className="text-sm text-jasper-slate max-w-sm mb-6">
        {displayDescription}
      </p>

      {/* Action button */}
      {(displayActionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Link
            href={actionHref}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {displayActionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {displayActionLabel}
          </button>
        )
      )}
    </div>
  )
}

// Compact version for inline use in cards
export function EmptyStateCompact({
  type,
  title,
  description,
  className,
}: Omit<EmptyStateProps, 'actionLabel' | 'actionHref' | 'onAction'>) {
  const config = emptyStateConfig[type]
  const Icon = config.icon

  const displayTitle = title || config.title
  const displayDescription = description || config.description

  return (
    <div className={cn('flex flex-col items-center justify-center py-8 px-4 text-center', className)}>
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
        config.bgColor
      )}>
        <Icon className={cn('w-6 h-6', config.iconColor)} />
      </div>
      <p className="text-sm font-medium text-jasper-carbon mb-1">
        {displayTitle}
      </p>
      <p className="text-xs text-jasper-slate max-w-xs">
        {displayDescription}
      </p>
    </div>
  )
}
