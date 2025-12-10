'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout'
import {
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  TrendingUp,
  Users,
  X,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { formatCurrency, getInitials, cn } from '@/lib/utils'
import { useCompanies } from '@/hooks/use-queries'
import { companiesApi, CompanyCreateData } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

interface Company {
  id: number
  name: string
  status: string
  country: string
  email?: string
  phone?: string
  website?: string
  lead_source?: string
  total_revenue: number
  outstanding_balance: number
  created_at: string
}

const statusFilters = [
  { value: '', label: 'All Status' },
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'client', label: 'Client' },
  { value: 'inactive', label: 'Inactive' },
]

const statusColors: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-700',
  prospect: 'bg-purple-100 text-purple-700',
  qualified: 'bg-amber-100 text-amber-700',
  proposal_sent: 'bg-orange-100 text-orange-700',
  negotiation: 'bg-yellow-100 text-yellow-700',
  client: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  lost: 'bg-red-100 text-red-700',
}

const industries = [
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'technology', label: 'Technology' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'mining', label: 'Mining' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'retail', label: 'Retail' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'energy', label: 'Energy' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'education', label: 'Education' },
  { value: 'tourism', label: 'Tourism' },
  { value: 'other', label: 'Other' },
]

const leadSources = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'conference', label: 'Conference/Event' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
]

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [createSuccess, setCreateSuccess] = useState<{ companyId: number; contactId: number } | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const queryClient = useQueryClient()

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    tradingName: '',
    industry: 'other',
    country: 'South Africa',
    city: '',
    website: '',
    companyPhone: '',
    companyEmail: '',
    leadSource: '',
    referredBy: '',
    notes: '',
    // Primary contact
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    contactJobTitle: '',
    isDecisionMaker: true,
  })

  // Use React Query for data fetching with automatic caching
  const { data, isLoading: loading, error } = useCompanies({
    page,
    page_size: 20,
    status: statusFilter || undefined,
  })

  const companies: Company[] = data?.companies || []
  const total = data?.total || 0

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate stats
  const clientCount = companies.filter((c) => c.status === 'client').length
  const leadCount = companies.filter((c) => c.status === 'lead' || c.status === 'prospect').length
  const totalRevenue = companies.reduce((sum, c) => sum + c.total_revenue, 0)

  const resetForm = () => {
    setFormData({
      companyName: '',
      tradingName: '',
      industry: 'other',
      country: 'South Africa',
      city: '',
      website: '',
      companyPhone: '',
      companyEmail: '',
      leadSource: '',
      referredBy: '',
      notes: '',
      contactFirstName: '',
      contactLastName: '',
      contactEmail: '',
      contactPhone: '',
      contactJobTitle: '',
      isDecisionMaker: true,
    })
    setCreateSuccess(null)
    setCreateError(null)
    setInviteStatus('idle')
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    resetForm()
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)

    try {
      const payload: CompanyCreateData = {
        name: formData.companyName,
        trading_name: formData.tradingName || undefined,
        industry: formData.industry,
        country: formData.country,
        city: formData.city || undefined,
        website: formData.website || undefined,
        phone: formData.companyPhone || undefined,
        email: formData.companyEmail || undefined,
        lead_source: formData.leadSource || undefined,
        referred_by: formData.referredBy || undefined,
        notes: formData.notes || undefined,
        primary_contact: {
          first_name: formData.contactFirstName,
          last_name: formData.contactLastName,
          email: formData.contactEmail,
          phone: formData.contactPhone || undefined,
          job_title: formData.contactJobTitle || undefined,
          is_primary: true,
          is_decision_maker: formData.isDecisionMaker,
        },
      }

      const result = await companiesApi.create(payload)

      // Find the primary contact ID
      const primaryContact = result.contacts?.find((c: any) => c.is_primary) || result.contacts?.[0]

      setCreateSuccess({
        companyId: result.id,
        contactId: primaryContact?.id,
      })

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create client')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSendInvite = async () => {
    if (!createSuccess) return

    setIsSendingInvite(true)
    setInviteStatus('sending')

    try {
      await companiesApi.sendInvite(createSuccess.companyId, createSuccess.contactId)
      setInviteStatus('sent')
    } catch (err: any) {
      setInviteStatus('error')
      setCreateError(err.message || 'Failed to send invitation')
    } finally {
      setIsSendingInvite(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header title="Clients" subtitle="Manage your client relationships" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-jasper-emerald/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-jasper-emerald" />
              </div>
              <div>
                <p className="text-sm text-jasper-slate">Active Clients</p>
                <p className="text-2xl font-semibold text-jasper-carbon">{clientCount}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-jasper-slate">New Leads</p>
                <p className="text-2xl font-semibold text-jasper-carbon">{leadCount}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-jasper-slate">Total Revenue</p>
                <p className="text-2xl font-semibold text-jasper-carbon">
                  {formatCurrency(totalRevenue, 'USD')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jasper-slate-light" />
              <input
                type="text"
                placeholder="Search clients..."
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

          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-jasper-slate">
              Loading clients...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="col-span-full text-center py-12 text-jasper-slate">
              No clients found
            </div>
          ) : (
            filteredCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/clients/${company.id}`}
                className="card card-hover p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-jasper-navy/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-semibold text-jasper-navy">
                      {getInitials(company.name)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-jasper-carbon truncate">
                        {company.name}
                      </h3>
                    </div>
                    <span className={cn('badge text-xs', statusColors[company.status] || 'badge-neutral')}>
                      {company.status}
                    </span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-4 space-y-2">
                  {company.email && (
                    <div className="flex items-center gap-2 text-sm text-jasper-slate">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{company.email}</span>
                    </div>
                  )}
                  {company.country && (
                    <div className="flex items-center gap-2 text-sm text-jasper-slate">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{company.country}</span>
                    </div>
                  )}
                </div>

                {/* Revenue */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs text-jasper-slate">Total Revenue</p>
                    <p className="font-semibold text-jasper-carbon">
                      {formatCurrency(company.total_revenue, 'USD')}
                    </p>
                  </div>
                  {company.outstanding_balance > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-jasper-slate">Outstanding</p>
                      <p className="font-semibold text-status-warning">
                        {formatCurrency(company.outstanding_balance, 'USD')}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-jasper-slate">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} clients
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

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-jasper-carbon">
                {createSuccess ? 'Client Created' : 'Add New Client'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-jasper-slate" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {createSuccess ? (
                // Success State - Show invite options
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-jasper-carbon mb-2">
                    Client Created Successfully!
                  </h3>
                  <p className="text-jasper-slate mb-6">
                    {formData.companyName} has been added to your client list.
                  </p>

                  {/* Invite Status */}
                  {inviteStatus === 'idle' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800 mb-3">
                        Would you like to send a portal invitation to{' '}
                        <strong>{formData.contactFirstName} {formData.contactLastName}</strong>?
                      </p>
                      <p className="text-xs text-blue-600 mb-4">
                        They will receive a magic link to access their client portal.
                      </p>
                      <button
                        onClick={handleSendInvite}
                        disabled={isSendingInvite}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        {isSendingInvite ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Portal Invitation
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {inviteStatus === 'sent' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Invitation sent to {formData.contactEmail}</span>
                      </div>
                    </div>
                  )}

                  {inviteStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 text-red-800 mb-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Failed to send invitation</span>
                      </div>
                      <p className="text-sm text-red-600">{createError}</p>
                      <button
                        onClick={handleSendInvite}
                        className="mt-3 text-sm text-red-700 underline hover:no-underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3 justify-center">
                    <Link
                      href={`/clients/${createSuccess.companyId}`}
                      className="btn-secondary"
                    >
                      View Client
                    </Link>
                    <button onClick={handleCloseModal} className="btn-primary">
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                // Create Form
                <form onSubmit={handleCreateClient}>
                  {createError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-5 h-5" />
                        <span>{createError}</span>
                      </div>
                    </div>
                  )}

                  {/* Company Information */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-jasper-carbon mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-jasper-emerald" />
                      Company Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-jasper-carbon mb-1">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="input w-full"
                          placeholder="e.g., Acme Corporation"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-jasper-carbon mb-1">
                          Trading Name
                        </label>
                        <input
                          type="text"
                          value={formData.tradingName}
                          onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                          className="input w-full"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-jasper-carbon mb-1">
                          Industry
                        </label>
                        <select
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                          className="input w-full"
                        >
                          {industries.map((ind) => (
                            <option key={ind.value} value={ind.value}>
                              {ind.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-jasper-carbon mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-jasper-carbon mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="input w-full"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-jasper-carbon mb-1">
                          Website
                        </label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="input w-full"
                          placeholder="https://"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-jasper-carbon mb-1">
                          Lead Source
                        </label>
                        <select
                          value={formData.leadSource}
                          onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                          className="input w-full"
                        >
                          <option value="">Select source...</option>
                          {leadSources.map((src) => (
                            <option key={src.value} value={src.value}>
                              {src.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Primary Contact */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-jasper-carbon mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-jasper-emerald" />
                      Primary Contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-jasper-carbon mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.contactFirstName}
                          onChange={(e) => setFormData({ ...formData, contactFirstName: e.target.value })}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-jasper-carbon mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.contactLastName}
                          onChange={(e) => setFormData({ ...formData, contactLastName: e.target.value })}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-jasper-carbon mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                          className="input w-full"
                          placeholder="contact@company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-jasper-carbon mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.contactPhone}
                          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                          className="input w-full"
                          placeholder="+27 ..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-jasper-carbon mb-1">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={formData.contactJobTitle}
                          onChange={(e) => setFormData({ ...formData, contactJobTitle: e.target.value })}
                          className="input w-full"
                          placeholder="e.g., CEO, CFO, Project Manager"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isDecisionMaker}
                            onChange={(e) => setFormData({ ...formData, isDecisionMaker: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-jasper-emerald focus:ring-jasper-emerald"
                          />
                          <span className="text-sm text-jasper-carbon">Decision Maker</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-jasper-carbon mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="input w-full"
                      rows={3}
                      placeholder="Any additional notes about this client..."
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 justify-end pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Create Client
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
