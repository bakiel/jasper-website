'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout'
import {
  Plus,
  Search,
  Download,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  MoreHorizontal,
  Eye,
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'
import { useInvoices } from '@/hooks/use-queries'

interface Invoice {
  id: number
  invoice_number: string
  project_id?: number
  company_id: number
  invoice_type: string
  status: string
  subtotal: number
  discount_percent: number
  discount_amount: number
  tax_percent: number
  tax_amount: number
  total: number
  currency: string
  issue_date: string
  due_date: string
  paid_date?: string
  payment_method?: string
  payment_reference?: string
  notes?: string
  created_at: string
}

const statusFilters = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
]

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  // Use React Query for data fetching with automatic caching
  const { data, isLoading: loading, error } = useInvoices({
    page,
    page_size: 20,
    status: statusFilter || undefined,
  })

  const invoices: Invoice[] = data?.invoices || []
  const total = data?.total || 0

  // Calculate stats with useMemo for performance
  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalPaid = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0)
    const totalPending = invoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'viewed')
      .reduce((sum, inv) => sum + inv.total, 0)
    const totalOverdue = invoices
      .filter((inv) => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0)

    return { total_invoiced: totalInvoiced, total_paid: totalPaid, total_pending: totalPending, total_overdue: totalOverdue }
  }, [invoices])

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4 text-status-success" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-status-error" />
      case 'sent':
      case 'viewed':
        return <Clock className="w-4 h-4 text-status-warning" />
      default:
        return <FileText className="w-4 h-4 text-jasper-slate" />
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header title="Invoices" subtitle="Manage and track all your invoices" />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Invoiced"
            value={formatCurrency(stats.total_invoiced, 'USD')}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Paid"
            value={formatCurrency(stats.total_paid, 'USD')}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="Pending"
            value={formatCurrency(stats.total_pending, 'USD')}
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Overdue"
            value={formatCurrency(stats.total_overdue, 'USD')}
            icon={AlertCircle}
            color="red"
          />
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jasper-slate-light" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-40"
            >
              {statusFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>

        {/* Invoices Table */}
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th className="text-right">Amount</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-jasper-slate">
                      Loading invoices...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-jasper-slate">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="group">
                      <td>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-mono text-sm text-jasper-emerald hover:text-jasper-emerald-dark font-medium"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td>
                        <span className="text-sm text-jasper-slate capitalize">
                          {invoice.invoice_type}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(invoice.status)}
                          <span className={cn('badge', getStatusColor(invoice.status))}>
                            {invoice.status}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-jasper-slate">
                          {formatDate(invoice.issue_date)}
                        </span>
                      </td>
                      <td>
                        <span className={cn(
                          'text-sm',
                          invoice.status === 'overdue' ? 'text-status-error font-medium' : 'text-jasper-slate'
                        )}>
                          {formatDate(invoice.due_date)}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="font-semibold text-jasper-carbon">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-jasper-slate" />
                          </Link>
                          <button
                            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4 text-jasper-slate" />
                          </button>
                          {invoice.status === 'draft' && (
                            <button
                              className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                              title="Send"
                            >
                              <Send className="w-4 h-4 text-jasper-slate" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <p className="text-sm text-jasper-slate">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} invoices
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= total}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  icon: any
  color: 'blue' | 'green' | 'amber' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-jasper-slate">{title}</p>
          <p className="text-xl font-semibold text-jasper-carbon">{value}</p>
        </div>
      </div>
    </div>
  )
}
