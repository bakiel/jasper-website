'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Send,
  Edit,
  Printer,
  CreditCard,
  DollarSign,
  FileText,
  Mail,
  Loader2,
  Copy,
  Check,
  X,
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'
import { invoicesApi, companiesApi } from '@/lib/api'

interface InvoiceItem {
  id: number
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Invoice {
  id: number
  invoice_number: string
  project_id?: number
  project_reference?: string
  project_name?: string
  company_id: number
  company_name?: string
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
  terms?: string
  items?: InvoiceItem[]
  created_at: string
  updated_at: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const paymentMethods: Record<string, string> = {
  bank_transfer: 'Bank Transfer (EFT)',
  credit_card: 'Credit Card',
  crypto_usdt: 'USDT (Cryptocurrency)',
  other: 'Other',
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const invoiceId = Number(params.id)

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [sendingInvoice, setSendingInvoice] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'bank_transfer',
    reference: '',
  })

  useEffect(() => {
    if (invoiceId) fetchInvoice()
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      const data = await invoicesApi.get(invoiceId)
      setInvoice(data)
    } catch (error) {
      console.error('Failed to fetch invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!invoice) return
    setMarkingPaid(true)
    try {
      const updated = await invoicesApi.markPaid(invoice.id, {
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference || undefined,
      })
      setInvoice(updated)
      setShowPaymentModal(false)
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error)
    } finally {
      setMarkingPaid(false)
    }
  }

  const handleCopyInvoiceNumber = () => {
    if (invoice) {
      navigator.clipboard.writeText(invoice.invoice_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'sent':
      case 'viewed':
        return <Clock className="w-5 h-5 text-amber-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="flex items-center gap-3 text-jasper-slate">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading invoice...
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-jasper-slate mx-auto mb-4" />
          <p className="text-jasper-slate mb-4">Invoice not found</p>
          <Link href="/invoices" className="btn-primary">
            Back to Invoices
          </Link>
        </div>
      </div>
    )
  }

  const daysUntilDue = getDaysUntilDue(invoice.due_date)
  const isOverdue = daysUntilDue < 0 && invoice.status !== 'paid'

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header title={invoice.invoice_number} subtitle={invoice.company_name || 'Invoice'} />

      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 text-sm text-jasper-slate hover:text-jasper-carbon transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Invoice Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Header */}
            <div className="card">
              <div className="card-body">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Invoice Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold text-jasper-carbon">{invoice.invoice_number}</h1>
                      <button
                        onClick={handleCopyInvoiceNumber}
                        className="p-1 hover:bg-surface-secondary rounded transition-colors"
                        title="Copy invoice number"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-jasper-slate" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(invoice.status)}
                      <span className={cn('badge text-sm', statusColors[invoice.status] || 'badge-neutral')}>
                        {invoice.status}
                      </span>
                      {isOverdue && invoice.status !== 'paid' && (
                        <span className="text-sm text-red-600 font-medium">
                          {Math.abs(daysUntilDue)} days overdue
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="text-right">
                    <p className="text-sm text-jasper-slate">Total Amount</p>
                    <p className="text-3xl font-bold text-jasper-carbon">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
                  <div>
                    <p className="text-xs text-jasper-slate mb-1">Issue Date</p>
                    <p className="font-medium text-jasper-carbon">{formatDate(invoice.issue_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-jasper-slate mb-1">Due Date</p>
                    <p className={cn(
                      'font-medium',
                      isOverdue ? 'text-red-600' : 'text-jasper-carbon'
                    )}>
                      {formatDate(invoice.due_date)}
                      {!isOverdue && daysUntilDue <= 7 && daysUntilDue > 0 && invoice.status !== 'paid' && (
                        <span className="text-amber-600 text-sm ml-2">
                          ({daysUntilDue} days left)
                        </span>
                      )}
                    </p>
                  </div>
                  {invoice.paid_date && (
                    <div>
                      <p className="text-xs text-jasper-slate mb-1">Paid Date</p>
                      <p className="font-medium text-green-600">{formatDate(invoice.paid_date)}</p>
                    </div>
                  )}
                  {invoice.payment_method && (
                    <div>
                      <p className="text-xs text-jasper-slate mb-1">Payment Method</p>
                      <p className="font-medium text-jasper-carbon">
                        {paymentMethods[invoice.payment_method] || invoice.payment_method}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bill To / Project */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-jasper-carbon flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-jasper-emerald" />
                    Bill To
                  </h3>
                </div>
                <div className="card-body">
                  <Link
                    href={`/clients/${invoice.company_id}`}
                    className="font-medium text-jasper-carbon hover:text-jasper-emerald transition-colors"
                  >
                    {invoice.company_name || `Company #${invoice.company_id}`}
                  </Link>
                </div>
              </div>

              {invoice.project_id && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="font-semibold text-jasper-carbon flex items-center gap-2">
                      <FileText className="w-4 h-4 text-jasper-emerald" />
                      Project
                    </h3>
                  </div>
                  <div className="card-body">
                    <Link
                      href={`/projects/${invoice.project_id}`}
                      className="font-medium text-jasper-carbon hover:text-jasper-emerald transition-colors"
                    >
                      {invoice.project_reference || `Project #${invoice.project_id}`}
                    </Link>
                    {invoice.project_name && (
                      <p className="text-sm text-jasper-slate mt-1">{invoice.project_name}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-jasper-carbon">Line Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-secondary border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-jasper-slate">Description</th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-jasper-slate w-24">Qty</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-jasper-slate w-32">Unit Price</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-jasper-slate w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-4 py-4 text-jasper-carbon">{item.description}</td>
                          <td className="px-4 py-4 text-center text-jasper-carbon">{item.quantity}</td>
                          <td className="px-4 py-4 text-right text-jasper-carbon">
                            {formatCurrency(item.unit_price, invoice.currency)}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-jasper-carbon">
                            {formatCurrency(item.total, invoice.currency)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-4 text-jasper-carbon">
                          {invoice.invoice_type === 'deposit' ? 'Deposit Payment' :
                           invoice.invoice_type === 'final' ? 'Final Payment' :
                           'Professional Services'}
                        </td>
                        <td className="px-4 py-4 text-center text-jasper-carbon">1</td>
                        <td className="px-4 py-4 text-right text-jasper-carbon">
                          {formatCurrency(invoice.subtotal, invoice.currency)}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-jasper-carbon">
                          {formatCurrency(invoice.subtotal, invoice.currency)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t border-border p-4">
                <div className="max-w-xs ml-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-jasper-slate">Subtotal</span>
                    <span className="text-jasper-carbon">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-jasper-slate">
                        Discount {invoice.discount_percent > 0 && `(${invoice.discount_percent}%)`}
                      </span>
                      <span className="text-green-600">-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
                    </div>
                  )}
                  {invoice.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-jasper-slate">
                        Tax {invoice.tax_percent > 0 && `(${invoice.tax_percent}%)`}
                      </span>
                      <span className="text-jasper-carbon">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold text-jasper-carbon">Total</span>
                    <span className="font-bold text-lg text-jasper-carbon">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {invoice.notes && (
                  <div className="card">
                    <div className="card-header">
                      <h3 className="font-semibold text-jasper-carbon">Notes</h3>
                    </div>
                    <div className="card-body">
                      <p className="text-jasper-slate whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                  </div>
                )}
                {invoice.terms && (
                  <div className="card">
                    <div className="card-header">
                      <h3 className="font-semibold text-jasper-carbon">Terms & Conditions</h3>
                    </div>
                    <div className="card-body">
                      <p className="text-jasper-slate whitespace-pre-wrap">{invoice.terms}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-jasper-carbon">Actions</h3>
              </div>
              <div className="card-body space-y-2">
                {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="btn-primary w-full justify-start"
                  >
                    <CreditCard className="w-4 h-4" />
                    Mark as Paid
                  </button>
                )}
                {invoice.status === 'draft' && (
                  <button className="btn-secondary w-full justify-start">
                    <Send className="w-4 h-4" />
                    Send to Client
                  </button>
                )}
                <button className="btn-secondary w-full justify-start">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button className="btn-ghost w-full justify-start">
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </button>
                {invoice.status === 'draft' && (
                  <button className="btn-ghost w-full justify-start">
                    <Edit className="w-4 h-4" />
                    Edit Invoice
                  </button>
                )}
              </div>
            </div>

            {/* Payment Info (if paid) */}
            {invoice.status === 'paid' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-jasper-carbon flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Payment Received
                  </h3>
                </div>
                <div className="card-body space-y-3">
                  <div>
                    <p className="text-xs text-jasper-slate">Paid On</p>
                    <p className="font-medium text-jasper-carbon">{formatDate(invoice.paid_date!)}</p>
                  </div>
                  {invoice.payment_method && (
                    <div>
                      <p className="text-xs text-jasper-slate">Method</p>
                      <p className="font-medium text-jasper-carbon">
                        {paymentMethods[invoice.payment_method] || invoice.payment_method}
                      </p>
                    </div>
                  )}
                  {invoice.payment_reference && (
                    <div>
                      <p className="text-xs text-jasper-slate">Reference</p>
                      <p className="font-mono text-sm text-jasper-carbon">{invoice.payment_reference}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoice Meta */}
            <div className="card">
              <div className="card-body text-sm text-jasper-slate space-y-2">
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="text-jasper-carbon capitalize">{invoice.invoice_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="text-jasper-carbon">{formatDate(invoice.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated</span>
                  <span className="text-jasper-carbon">{formatDate(invoice.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoice ID</span>
                  <span className="font-mono text-jasper-carbon">#{invoice.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mark as Paid Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-jasper-carbon">Record Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-jasper-slate" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-surface-secondary rounded-lg p-4 text-center">
                <p className="text-sm text-jasper-slate mb-1">Amount</p>
                <p className="text-2xl font-bold text-jasper-carbon">
                  {formatCurrency(invoice.total, invoice.currency)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-jasper-carbon mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="input w-full"
                >
                  {Object.entries(paymentMethods).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-jasper-carbon mb-2">
                  Payment Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="e.g., Transaction ID, Check number"
                  className="input w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={markingPaid}
                className="btn-primary"
              >
                {markingPaid ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
