'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: 'Dashboard', href: '/', icon: <Home className="w-4 h-4" /> }, ...items]
    : items

  return (
    <nav className={cn('flex items-center', className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isFirst = index === 0

          return (
            <li key={index} className="flex items-center gap-1">
              {/* Separator */}
              {!isFirst && (
                <ChevronRight className="w-4 h-4 text-jasper-slate-light flex-shrink-0" />
              )}

              {/* Breadcrumb item */}
              {isLast ? (
                <span
                  className="font-medium text-jasper-carbon truncate max-w-[200px]"
                  aria-current="page"
                >
                  {item.icon && <span className="mr-1.5 inline-flex">{item.icon}</span>}
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 text-jasper-slate hover:text-jasper-emerald transition-colors"
                >
                  {item.icon}
                  <span className={cn(isFirst && !item.icon ? '' : 'hidden sm:inline')}>
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-jasper-slate">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Preset breadcrumb patterns for common pages
export function ClientBreadcrumbs({ clientName }: { clientName: string }) {
  return (
    <Breadcrumbs
      items={[
        { label: 'Clients', href: '/clients' },
        { label: clientName },
      ]}
    />
  )
}

export function ProjectBreadcrumbs({
  projectName,
  clientName,
  clientId,
}: {
  projectName: string
  clientName?: string
  clientId?: number
}) {
  const items: BreadcrumbItem[] = [{ label: 'Projects', href: '/projects' }]

  if (clientName && clientId) {
    items.push({ label: clientName, href: `/clients/${clientId}` })
  }

  items.push({ label: projectName })

  return <Breadcrumbs items={items} />
}

export function InvoiceBreadcrumbs({
  invoiceNumber,
  clientName,
  clientId,
}: {
  invoiceNumber: string
  clientName?: string
  clientId?: number
}) {
  const items: BreadcrumbItem[] = [{ label: 'Invoices', href: '/invoices' }]

  if (clientName && clientId) {
    items.push({ label: clientName, href: `/clients/${clientId}` })
  }

  items.push({ label: invoiceNumber })

  return <Breadcrumbs items={items} />
}
