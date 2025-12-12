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
  X,
  Loader2,
  Building2,
  FolderKanban,
  Receipt,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'
import { useInvoices, useCompanies, useProjects } from '@/hooks/use-queries'
import { invoicesApi } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable, SkeletonCard } from '@/components/ui/Skeleton'

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

const invoiceTypeOptions = [
  { value: 'deposit', label: 'Deposit Invoice (50%)' },
  { value: 'progress', label: 'Progress Invoice' },
  { value: 'final', label: 'Final Invoice' },
  { value: 'full', label: 'Full Payment Invoice' },
]

interface InvoiceLineItem {
  description: string
  quantity: number
  unit_price: number
  amount: number
}

interface CreateInvoiceForm {
  company_id: number | ''
  project_id: number | ''
  invoice_type: string
  currency: string
  issue_date: string
  due_date: string
  tax_percent: number
  discount_percent: number
  notes: string
  line_items: InvoiceLineItem[]
}

const initialInvoiceForm: CreateInvoiceForm = {
  company_id: '',
  project_id: '',
  invoice_type: 'deposit',
  currency: 'ZAR',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  tax_percent: 15,
  discount_percent: 0,
  notes: '',
  line_items: [{ description: '', quantity: 1, unit_price: 0, amount: 0 }],
}

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  // Advanced Filters State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountMin, setAmountMin] = useState<number | ''>('')
  const [amountMax, setAmountMax] = useState<number | ''>('')

  // Create Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState<CreateInvoiceForm>(initialInvoiceForm)

  // Bulk Selection State
  const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set())
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  const queryClient = useQueryClient()

  // Use React Query for data fetching with automatic caching
  const { data, isLoading: loading, error } = useInvoices({
    page,
    page_size: 20,
    status: statusFilter || undefined,
  })

  // Fetch companies and projects for dropdowns
  const { data: companiesData } = useCompanies({ page: 1, page_size: 100 })
  const { data: projectsData } = useProjects({ page: 1, page_size: 100 })

  const invoices: Invoice[] = data?.invoices || []
  const total = data?.total || 0
  const companies = companiesData?.companies || []
  const projects = projectsData?.projects || []

  // Filter projects by selected company
  const filteredProjects = invoiceForm.company_id
    ? projects.filter((p: any) => p.company_id === invoiceForm.company_id)
    : projects

  // Calculate invoice totals
  const calculateTotals = () => {
    const subtotal = invoiceForm.line_items.reduce((sum, item) => sum + item.amount, 0)
    const discountAmount = (subtotal * invoiceForm.discount_percent) / 100
    const taxableAmount = subtotal - discountAmount
    const taxAmount = (taxableAmount * invoiceForm.tax_percent) / 100
    const total = taxableAmount + taxAmount
    return { subtotal, discountAmount, taxAmount, total }
  }

  // Handle form input changes
  const handleInvoiceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setInvoiceForm(prev => ({
      ...prev,
      [name]: name === 'company_id' || name === 'project_id' || name === 'tax_percent' || name === 'discount_percent'
        ? (value === '' ? '' : Number(value))
        : value
    }))

    // Reset project if company changes
    if (name === 'company_id') {
      setInvoiceForm(prev => ({ ...prev, project_id: '' }))
    }
  }

  // Handle line item changes
  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    setInvoiceForm(prev => {
      const newLineItems = [...prev.line_items]
      newLineItems[index] = {
        ...newLineItems[index],
        [field]: field === 'description' ? value : Number(value)
      }
      // Auto-calculate amount
      if (field === 'quantity' || field === 'unit_price') {
        newLineItems[index].amount = newLineItems[index].quantity * newLineItems[index].unit_price
      }
      return { ...prev, line_items: newLineItems }
    })
  }

  // Add new line item
  const addLineItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      line_items: [...prev.line_items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]
    }))
  }

  // Remove line item
  const removeLineItem = (index: number) => {
    if (invoiceForm.line_items.length > 1) {
      setInvoiceForm(prev => ({
        ...prev,
        line_items: prev.line_items.filter((_, i) => i !== index)
      }))
    }
  }

  // Handle create invoice submission
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)
    setCreateSuccess(false)

    try {
      if (!invoiceForm.company_id) {
        throw new Error('Please select a client')
      }

      const totals = calculateTotals()

      const invoiceData = {
        company_id: invoiceForm.company_id,
        project_id: invoiceForm.project_id || undefined,
        invoice_type: invoiceForm.invoice_type,
        currency: invoiceForm.currency,
        issue_date: invoiceForm.issue_date,
        due_date: invoiceForm.due_date,
        subtotal: totals.subtotal,
        tax_percent: invoiceForm.tax_percent,
        tax_amount: totals.taxAmount,
        discount_percent: invoiceForm.discount_percent,
        discount_amount: totals.discountAmount,
        total: totals.total,
        notes: invoiceForm.notes || undefined,
        line_items: invoiceForm.line_items.filter(item => item.description && item.amount > 0),
        status: 'draft',
      }

      await invoicesApi.create(invoiceData)

      setCreateSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['invoices'] })

      setTimeout(() => {
        setShowCreateModal(false)
        setInvoiceForm(initialInvoiceForm)
        setCreateSuccess(false)
      }, 1500)
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create invoice')
    } finally {
      setIsCreating(false)
    }
  }

  // Close modal and reset state
  const handleCloseInvoiceModal = () => {
    setShowCreateModal(false)
    setInvoiceForm(initialInvoiceForm)
    setCreateError(null)
    setCreateSuccess(false)
  }

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

  // Apply filters including advanced filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Search filter
      if (searchQuery && !invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Date range filter
      if (dateFrom) {
        const invoiceDate = new Date(invoice.issue_date)
        const fromDate = new Date(dateFrom)
        if (invoiceDate < fromDate) return false
      }
      if (dateTo) {
        const invoiceDate = new Date(invoice.issue_date)
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999) // Include the entire day
        if (invoiceDate > toDate) return false
      }

      // Amount range filter
      if (amountMin !== '' && invoice.total < amountMin) {
        return false
      }
      if (amountMax !== '' && invoice.total > amountMax) {
        return false
      }

      return true
    })
  }, [invoices, searchQuery, dateFrom, dateTo, amountMin, amountMax])

  // Check if any advanced filters are active
  const hasActiveFilters = dateFrom || dateTo || amountMin !== '' || amountMax !== ''

  // Clear all advanced filters
  const clearAdvancedFilters = () => {
    setDateFrom('')
    setDateTo('')
    setAmountMin('')
    setAmountMax('')
  }

  // CSV Export functionality
  // Sanitize CSV cell to prevent formula injection attacks
  const sanitizeCSVCell = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return ''

    const stringValue = String(value)

    // Dangerous formula prefixes that could execute code in Excel/Sheets
    const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r', '\n']

    let sanitized = stringValue

    // If starts with dangerous character, prefix with single quote to prevent formula execution
    if (dangerousPrefixes.some(prefix => sanitized.startsWith(prefix))) {
      sanitized = "'" + sanitized
    }

    // Escape double quotes by doubling them
    sanitized = sanitized.replace(/"/g, '""')

    return sanitized
  }

  const exportToCSV = () => {
    // Prepare CSV headers
    const headers = [
      'Invoice Number',
      'Type',
      'Status',
      'Issue Date',
      'Due Date',
      'Paid Date',
      'Subtotal',
      'Discount %',
      'Discount Amount',
      'Tax %',
      'Tax Amount',
      'Total',
      'Currency',
      'Payment Method',
      'Payment Reference',
      'Notes',
    ]

    // Prepare CSV rows from filtered invoices - ALL fields sanitized
    const rows = filteredInvoices.map(invoice => [
      sanitizeCSVCell(invoice.invoice_number),
      sanitizeCSVCell(invoice.invoice_type),
      sanitizeCSVCell(invoice.status),
      sanitizeCSVCell(formatDate(invoice.issue_date)),
      sanitizeCSVCell(formatDate(invoice.due_date)),
      sanitizeCSVCell(invoice.paid_date ? formatDate(invoice.paid_date) : ''),
      sanitizeCSVCell(invoice.subtotal.toFixed(2)),
      sanitizeCSVCell(invoice.discount_percent.toString()),
      sanitizeCSVCell(invoice.discount_amount.toFixed(2)),
      sanitizeCSVCell(invoice.tax_percent.toString()),
      sanitizeCSVCell(invoice.tax_amount.toFixed(2)),
      sanitizeCSVCell(invoice.total.toFixed(2)),
      sanitizeCSVCell(invoice.currency),
      sanitizeCSVCell(invoice.payment_method),
      sanitizeCSVCell(invoice.payment_reference),
      sanitizeCSVCell(invoice.notes),
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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

  // Bulk selection functions
  const toggleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set())
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)))
    }
  }

  const toggleSelectInvoice = (id: number) => {
    const newSelected = new Set(selectedInvoices)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedInvoices(newSelected)
  }

  const isAllSelected = filteredInvoices.length > 0 && selectedInvoices.size === filteredInvoices.length
  const isPartiallySelected = selectedInvoices.size > 0 && selectedInvoices.size < filteredInvoices.length

  // Bulk export selected invoices
  const exportSelectedToCSV = () => {
    const selectedList = filteredInvoices.filter(inv => selectedInvoices.has(inv.id))
    if (selectedList.length === 0) return

    const headers = [
      'Invoice Number', 'Type', 'Status', 'Issue Date', 'Due Date',
      'Subtotal', 'Tax Amount', 'Total', 'Currency'
    ]

    const rows = selectedList.map(invoice => [
      sanitizeCSVCell(invoice.invoice_number),
      sanitizeCSVCell(invoice.invoice_type),
      sanitizeCSVCell(invoice.status),
      sanitizeCSVCell(formatDate(invoice.issue_date)),
      sanitizeCSVCell(formatDate(invoice.due_date)),
      sanitizeCSVCell(invoice.subtotal.toFixed(2)),
      sanitizeCSVCell(invoice.tax_amount.toFixed(2)),
      sanitizeCSVCell(invoice.total.toFixed(2)),
      sanitizeCSVCell(invoice.currency),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `selected_invoices_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Clear selection when filters change
  const clearSelection = () => setSelectedInvoices(new Set())

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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-wrap gap-3">
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

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(
                  'btn-secondary flex items-center gap-2',
                  hasActiveFilters && 'border-jasper-emerald text-jasper-emerald'
                )}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 bg-jasper-emerald text-white text-xs rounded-full flex items-center justify-center">
                    {[dateFrom, dateTo, amountMin !== '' ? 1 : 0, amountMax !== '' ? 1 : 0].filter(Boolean).length}
                  </span>
                )}
                {showAdvancedFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex gap-2">
              {/* Export CSV Button */}
              <button
                onClick={exportToCSV}
                disabled={filteredInvoices.length === 0}
                className="btn-secondary"
                title="Export filtered invoices to CSV"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>

              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4" />
                New Invoice
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="card p-4">
              <div className="flex flex-wrap gap-6 items-end">
                {/* Date Range */}
                <div className="flex gap-3 items-end">
                  <div>
                    <label className="input-label flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Issue Date From
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="input w-40"
                    />
                  </div>
                  <span className="text-jasper-slate pb-3">to</span>
                  <div>
                    <label className="input-label flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Issue Date To
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="input w-40"
                    />
                  </div>
                </div>

                {/* Amount Range */}
                <div className="flex gap-3 items-end">
                  <div>
                    <label className="input-label flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Amount Min
                    </label>
                    <input
                      type="number"
                      value={amountMin}
                      onChange={(e) => setAmountMin(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      className="input w-32"
                    />
                  </div>
                  <span className="text-jasper-slate pb-3">to</span>
                  <div>
                    <label className="input-label flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Amount Max
                    </label>
                    <input
                      type="number"
                      value={amountMax}
                      onChange={(e) => setAmountMax(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="No limit"
                      min="0"
                      className="input w-32"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearAdvancedFilters}
                    className="btn-ghost text-status-error hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-jasper-slate">Active filters:</span>
                  {dateFrom && (
                    <span className="badge badge-info flex items-center gap-1">
                      From: {formatDate(dateFrom)}
                      <button onClick={() => setDateFrom('')} className="hover:text-blue-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {dateTo && (
                    <span className="badge badge-info flex items-center gap-1">
                      To: {formatDate(dateTo)}
                      <button onClick={() => setDateTo('')} className="hover:text-blue-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {amountMin !== '' && (
                    <span className="badge badge-success flex items-center gap-1">
                      Min: {formatCurrency(amountMin, 'ZAR')}
                      <button onClick={() => setAmountMin('')} className="hover:text-green-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {amountMax !== '' && (
                    <span className="badge badge-success flex items-center gap-1">
                      Max: {formatCurrency(amountMax, 'ZAR')}
                      <button onClick={() => setAmountMax('')} className="hover:text-green-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bulk Action Bar */}
        {selectedInvoices.size > 0 && (
          <div className="card p-4 bg-jasper-emerald/5 border-jasper-emerald">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-jasper-carbon">
                  {selectedInvoices.size} invoice{selectedInvoices.size > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-jasper-slate hover:text-jasper-carbon"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportSelectedToCSV}
                  className="btn-secondary text-sm py-1.5"
                >
                  <Download className="w-4 h-4" />
                  Export Selected
                </button>
                <button
                  className="btn-secondary text-sm py-1.5"
                  title="Send selected invoices"
                >
                  <Send className="w-4 h-4" />
                  Send All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        {loading ? (
          <SkeletonTable rows={5} columns={8} />
        ) : filteredInvoices.length === 0 ? (
          searchQuery || statusFilter || hasActiveFilters ? (
            <div className="card">
              <EmptyState
                type="search"
                title="No invoices match your criteria"
                description="Try adjusting your search or filters to find invoices."
              />
            </div>
          ) : (
            <div className="card">
              <EmptyState
                type="invoices"
                onAction={() => setShowCreateModal(true)}
              />
            </div>
          )
        ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isPartiallySelected
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-border text-jasper-emerald focus:ring-jasper-emerald cursor-pointer"
                    />
                  </th>
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
                {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className={cn(
                      'group',
                      selectedInvoices.has(invoice.id) && 'bg-jasper-emerald/5'
                    )}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedInvoices.has(invoice.id)}
                          onChange={() => toggleSelectInvoice(invoice.id)}
                          className="w-4 h-4 rounded border-border text-jasper-emerald focus:ring-jasper-emerald cursor-pointer"
                        />
                      </td>
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
                  ))}
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
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={handleCloseInvoiceModal}
            />

            {/* Modal */}
            <div className="relative bg-surface-primary rounded-xl shadow-modal w-full max-w-3xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-jasper-emerald/10 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-jasper-emerald" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-jasper-carbon">Create New Invoice</h2>
                    <p className="text-sm text-jasper-slate">Generate a new invoice for a client</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseInvoiceModal}
                  className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-jasper-slate" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateInvoice} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="p-6 space-y-6">
                  {/* Success Message */}
                  {createSuccess && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800">Invoice created successfully!</span>
                    </div>
                  )}

                  {/* Error Message */}
                  {createError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-800">{createError}</span>
                    </div>
                  )}

                  {/* Client & Project Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">
                        Client <span className="text-status-error">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jasper-slate-light" />
                        <select
                          name="company_id"
                          value={invoiceForm.company_id}
                          onChange={handleInvoiceInputChange}
                          className="input pl-10"
                          required
                        >
                          <option value="">Select a client...</option>
                          {companies.map((company: any) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="input-label">Project (Optional)</label>
                      <div className="relative">
                        <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jasper-slate-light" />
                        <select
                          name="project_id"
                          value={invoiceForm.project_id}
                          onChange={handleInvoiceInputChange}
                          className="input pl-10"
                          disabled={!invoiceForm.company_id}
                        >
                          <option value="">Select a project...</option>
                          {filteredProjects.map((project: any) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Type & Currency Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="input-label">Invoice Type</label>
                      <select
                        name="invoice_type"
                        value={invoiceForm.invoice_type}
                        onChange={handleInvoiceInputChange}
                        className="input"
                      >
                        {invoiceTypeOptions.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="input-label">Issue Date</label>
                      <input
                        type="date"
                        name="issue_date"
                        value={invoiceForm.issue_date}
                        onChange={handleInvoiceInputChange}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="input-label">Due Date</label>
                      <input
                        type="date"
                        name="due_date"
                        value={invoiceForm.due_date}
                        onChange={handleInvoiceInputChange}
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Line Items */}
                  <div>
                    <label className="input-label">Line Items</label>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface-secondary">
                            <th className="px-3 py-2 text-left font-medium text-jasper-slate">Description</th>
                            <th className="px-3 py-2 text-center font-medium text-jasper-slate w-20">Qty</th>
                            <th className="px-3 py-2 text-right font-medium text-jasper-slate w-32">Unit Price</th>
                            <th className="px-3 py-2 text-right font-medium text-jasper-slate w-32">Amount</th>
                            <th className="px-3 py-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceForm.line_items.map((item, index) => (
                            <tr key={index} className="border-t border-border-light">
                              <td className="px-2 py-2">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                  placeholder="Item description..."
                                  className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-jasper-emerald"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                                  min="1"
                                  className="w-full px-2 py-1.5 text-sm text-center border border-border rounded focus:outline-none focus:ring-1 focus:ring-jasper-emerald"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  value={item.unit_price}
                                  onChange={(e) => handleLineItemChange(index, 'unit_price', e.target.value)}
                                  min="0"
                                  step="0.01"
                                  className="w-full px-2 py-1.5 text-sm text-right border border-border rounded focus:outline-none focus:ring-1 focus:ring-jasper-emerald"
                                />
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-jasper-carbon">
                                {formatCurrency(item.amount, invoiceForm.currency)}
                              </td>
                              <td className="px-2 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeLineItem(index)}
                                  className="p-1 text-jasper-slate hover:text-status-error transition-colors"
                                  disabled={invoiceForm.line_items.length === 1}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-3 py-2 border-t border-border-light">
                        <button
                          type="button"
                          onClick={addLineItem}
                          className="text-sm text-jasper-emerald hover:text-jasper-emerald-dark font-medium"
                        >
                          + Add Line Item
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Totals & Options Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Notes */}
                    <div>
                      <label className="input-label">Notes</label>
                      <textarea
                        name="notes"
                        value={invoiceForm.notes}
                        onChange={handleInvoiceInputChange}
                        placeholder="Additional notes for the invoice..."
                        rows={4}
                        className="input resize-none"
                      />
                    </div>

                    {/* Totals */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="input-label">Currency</label>
                          <select
                            name="currency"
                            value={invoiceForm.currency}
                            onChange={handleInvoiceInputChange}
                            className="input"
                          >
                            <option value="ZAR">ZAR</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                        <div>
                          <label className="input-label">Tax %</label>
                          <input
                            type="number"
                            name="tax_percent"
                            value={invoiceForm.tax_percent}
                            onChange={handleInvoiceInputChange}
                            min="0"
                            max="100"
                            className="input"
                          />
                        </div>
                      </div>

                      <div className="bg-surface-secondary rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-jasper-slate">Subtotal</span>
                          <span className="text-jasper-carbon">{formatCurrency(calculateTotals().subtotal, invoiceForm.currency)}</span>
                        </div>
                        {invoiceForm.discount_percent > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-jasper-slate">Discount ({invoiceForm.discount_percent}%)</span>
                            <span className="text-status-error">-{formatCurrency(calculateTotals().discountAmount, invoiceForm.currency)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-jasper-slate">Tax ({invoiceForm.tax_percent}%)</span>
                          <span className="text-jasper-carbon">{formatCurrency(calculateTotals().taxAmount, invoiceForm.currency)}</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
                          <span className="text-jasper-carbon">Total</span>
                          <span className="text-jasper-emerald">{formatCurrency(calculateTotals().total, invoiceForm.currency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface-secondary">
                  <button
                    type="button"
                    onClick={handleCloseInvoiceModal}
                    className="btn-secondary"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isCreating || createSuccess}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : createSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Created!
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Invoice
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
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
