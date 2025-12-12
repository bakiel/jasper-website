'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  Command,
  Users,
  FolderKanban,
  FileText,
  Settings,
  Home,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompanies, useProjects, useInvoices } from '@/hooks/use-queries'

interface SearchResult {
  id: string | number
  title: string
  subtitle?: string
  type: 'client' | 'project' | 'invoice' | 'page'
  href: string
  icon: typeof Users
}

const quickLinks: SearchResult[] = [
  { id: 'dashboard', title: 'Dashboard', type: 'page', href: '/', icon: Home },
  { id: 'clients', title: 'Clients', subtitle: 'View all clients', type: 'page', href: '/clients', icon: Users },
  { id: 'projects', title: 'Projects', subtitle: 'View all projects', type: 'page', href: '/projects', icon: FolderKanban },
  { id: 'invoices', title: 'Invoices', subtitle: 'View all invoices', type: 'page', href: '/invoices', icon: FileText },
  { id: 'settings', title: 'Settings', subtitle: 'Account preferences', type: 'page', href: '/settings', icon: Settings },
]

const typeIcons: Record<string, typeof Users> = {
  client: Users,
  project: FolderKanban,
  invoice: FileText,
  page: Home,
}

const typeColors: Record<string, string> = {
  client: 'bg-blue-100 text-blue-600',
  project: 'bg-jasper-emerald/10 text-jasper-emerald',
  invoice: 'bg-purple-100 text-purple-600',
  page: 'bg-jasper-slate/10 text-jasper-slate',
}

interface GlobalSearchProps {
  className?: string
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fetch data for search
  const { data: clientsData, isLoading: clientsLoading } = useCompanies({ page: 1, page_size: 100 })
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ page: 1, page_size: 100 })
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({ page: 1, page_size: 100 })

  const isLoading = clientsLoading || projectsLoading || invoicesLoading

  // Build search results
  const searchResults: SearchResult[] = (() => {
    if (!query.trim()) {
      return quickLinks
    }

    const results: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    // Search clients
    const clients = clientsData?.companies || []
    clients
      .filter((c: any) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.email?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach((c: any) => {
        results.push({
          id: `client-${c.id}`,
          title: c.name,
          subtitle: c.email || c.country,
          type: 'client',
          href: `/clients/${c.id}`,
          icon: Users,
        })
      })

    // Search projects
    const projects = projectsData?.projects || []
    projects
      .filter((p: any) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.reference?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach((p: any) => {
        results.push({
          id: `project-${p.id}`,
          title: p.name,
          subtitle: p.reference,
          type: 'project',
          href: `/projects/${p.id}`,
          icon: FolderKanban,
        })
      })

    // Search invoices
    const invoices = invoicesData?.invoices || []
    invoices
      .filter((i: any) =>
        i.invoice_number?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3)
      .forEach((i: any) => {
        results.push({
          id: `invoice-${i.id}`,
          title: i.invoice_number,
          subtitle: `${i.status} - ${i.currency} ${i.total}`,
          type: 'invoice',
          href: `/invoices/${i.id}`,
          icon: FileText,
        })
      })

    // Search pages
    quickLinks
      .filter((l) =>
        l.title.toLowerCase().includes(lowerQuery) ||
        l.subtitle?.toLowerCase().includes(lowerQuery)
      )
      .forEach((l) => results.push(l))

    return results
  })()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when open
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Navigation within results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, searchResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (searchResults[selectedIndex]) {
          router.push(searchResults[selectedIndex].href)
          setIsOpen(false)
        }
        break
    }
  }

  const handleSelect = (result: SearchResult) => {
    router.push(result.href)
    setIsOpen(false)
  }

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm text-jasper-slate rounded-lg',
          'bg-surface-secondary hover:bg-surface-tertiary border border-border',
          'transition-colors duration-200',
          className
        )}
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-surface-tertiary rounded border border-border-light">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog */}
          <div className="relative flex items-start justify-center pt-[15vh] px-4">
            <div className="w-full max-w-xl bg-surface-primary rounded-xl shadow-modal overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-5 h-5 text-jasper-slate flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSelectedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search clients, projects, invoices..."
                  className="flex-1 bg-transparent text-jasper-carbon placeholder:text-jasper-slate-light focus:outline-none text-base"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 hover:bg-surface-secondary rounded"
                  >
                    <X className="w-4 h-4 text-jasper-slate" />
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-[50vh] overflow-y-auto">
                {isLoading && query ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-jasper-slate" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-jasper-slate">No results found for "{query}"</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {!query && (
                      <div className="px-4 py-2 text-xs font-medium text-jasper-slate-light uppercase tracking-wider">
                        Quick Links
                      </div>
                    )}
                    {searchResults.map((result, index) => {
                      const Icon = result.icon || typeIcons[result.type]
                      const colorClass = typeColors[result.type]

                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                            selectedIndex === index
                              ? 'bg-jasper-emerald/5'
                              : 'hover:bg-surface-secondary'
                          )}
                        >
                          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-jasper-carbon truncate">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-sm text-jasper-slate truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          {selectedIndex === index && (
                            <ArrowRight className="w-4 h-4 text-jasper-emerald flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface-secondary text-xs text-jasper-slate">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-surface-tertiary rounded">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-surface-tertiary rounded">↓</kbd>
                    to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-surface-tertiary rounded">↵</kbd>
                    to select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-surface-tertiary rounded">esc</kbd>
                  to close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
