import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const cents = amount / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatDateRelative(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    inquiry: 'stage-inquiry',
    proposal: 'stage-proposal',
    negotiation: 'stage-negotiation',
    contracted: 'stage-contracted',
    discovery: 'stage-contracted',
    in_progress: 'stage-in-progress',
    review: 'stage-in-progress',
    revision: 'stage-in-progress',
    completed: 'stage-completed',
    on_hold: 'badge-warning',
    cancelled: 'badge-error',
  }
  return colors[stage] || 'badge-neutral'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'badge-neutral',
    sent: 'badge-info',
    viewed: 'badge-info',
    paid: 'badge-success',
    overdue: 'badge-error',
    cancelled: 'badge-neutral',
  }
  return colors[status] || 'badge-neutral'
}

export function formatStage(stage: string): string {
  return stage
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function formatPackage(pkg: string): string {
  const names: Record<string, string> = {
    starter: 'Starter',
    growth: 'Growth',
    scale: 'Scale',
    enterprise: 'Enterprise',
    custom: 'Custom',
  }
  return names[pkg] || pkg
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
