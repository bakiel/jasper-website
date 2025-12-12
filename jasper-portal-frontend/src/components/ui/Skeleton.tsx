'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

// Base skeleton element with shimmer animation
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-jasper-slate/10',
        className
      )}
    />
  )
}

// Card skeleton for dashboard stats
export function SkeletonCard() {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  )
}

// Table row skeleton
export function SkeletonTableRow({ columns = 6 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton className={cn(
            'h-4',
            i === 0 ? 'w-20' : i === columns - 1 ? 'w-8' : 'w-full max-w-[120px]'
          )} />
        </td>
      ))}
    </tr>
  )
}

// Full table skeleton
export function SkeletonTable({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="card">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i}>
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonTableRow key={i} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Grid card skeleton for clients/projects grid view
export function SkeletonGridCard() {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border flex justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  )
}

// Grid skeleton
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonGridCard key={i} />
      ))}
    </div>
  )
}

// Dashboard stats skeleton
export function SkeletonDashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// List item skeleton for sidebar lists
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

// Activity log skeleton
export function SkeletonActivityLog({ items = 5 }: { items?: number }) {
  return (
    <div className="card">
      <div className="card-header">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: items }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    </div>
  )
}

// Pipeline row skeleton
export function SkeletonPipelineRow() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="w-24 h-6 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-2 rounded-full" />
      </div>
      <Skeleton className="w-16 h-4" />
      <Skeleton className="w-24 h-4" />
    </div>
  )
}

// Full page loading skeleton
export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-surface-secondary p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats */}
      <SkeletonDashboardStats />

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonTable rows={5} columns={5} />
        </div>
        <div>
          <SkeletonActivityLog items={4} />
        </div>
      </div>
    </div>
  )
}
