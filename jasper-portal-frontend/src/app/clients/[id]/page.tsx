'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout'
import { MessageCenter } from '@/components/messages'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Send,
  Edit,
  MoreHorizontal,
  ExternalLink,
  ChevronRight,
  Loader2,
  CheckCircle,
  Clock,
  User,
  Briefcase,
  TrendingUp,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react'
import { formatCurrency, formatDate, formatStage, getStageColor, getInitials, cn } from '@/lib/utils'
import { companiesApi, projectsApi, invoicesApi } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

interface Company {
  id: number
  name: string
  trading_name?: string
  industry?: string
  country?: string
  city?: string
  website?: string
  phone?: string
  email?: string
  status: string
  lead_source?: string
  referred_by?: string
  dfi_targets?: string[]
  project_value_min?: number
  project_value_max?: number
  notes?: string
  total_revenue: number
  outstanding_balance: number
  created_at: string
  updated_at: string
}

interface Contact {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  job_title?: string
  is_primary: boolean
  is_decision_maker: boolean
  created_at: string
}

interface Project {
  id: number
  reference: string
  name: string
  stage: string
  package: string
  value: number
  currency: string
  progress_percent: number
  target_completion?: string
  created_at: string
}

interface Invoice {
  id: number
  invoice_number: string
  status: string
  total_amount: number
  currency: string
  due_date: string
  created_at: string
}

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

const invoiceStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const industries: Record<string, string> = {
  financial_services: 'Financial Services',
  technology: 'Technology',
  manufacturing: 'Manufacturing',
  agriculture: 'Agriculture',
  mining: 'Mining',
  healthcare: 'Healthcare',
  retail: 'Retail',
  real_estate: 'Real Estate',
  energy: 'Energy',
  infrastructure: 'Infrastructure',
  education: 'Education',
  tourism: 'Tourism',
  other: 'Other',
}

const industryOptions = Object.entries(industries).map(([value, label]) => ({ value, label }))

const clientStatusOptions = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'client', label: 'Client' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'lost', label: 'Lost' },
]

const leadSourceOptions = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'conference', label: 'Conference/Event' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
]

interface EditClientForm {
  name: string
  trading_name: string
  industry: string
  country: string
  city: string
  website: string
  phone: string
  email: string
  status: string
  lead_source: string
  referred_by: string
  notes: string
}

export default function ClientDetailPage() {
  const params = useParams()
  const clientId = Number(params.id)

  const [company, setCompany] = useState<Company | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'invoices' | 'messages'>('overview')
  const [sendingInvite, setSendingInvite] = useState<number | null>(null)
  const [inviteStatus, setInviteStatus] = useState<{ contactId: number; status: 'sent' | 'error'; message?: string } | null>(null)

  // Edit Client Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [editForm, setEditForm] = useState<EditClientForm>({
    name: '',
    trading_name: '',
    industry: '',
    country: '',
    city: '',
    website: '',
    phone: '',
    email: '',
    status: '',
    lead_source: '',
    referred_by: '',
    notes: '',
  })

  // Add Contact Modal State
  const [showAddContactModal, setShowAddContactModal] = useState(false)
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [addContactError, setAddContactError] = useState<string | null>(null)
  const [addContactSuccess, setAddContactSuccess] = useState(false)
  const [contactForm, setContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    is_primary: false,
    is_decision_maker: false,
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    if (clientId) fetchData()
  }, [clientId])

  const fetchData = async () => {
    try {
      const [companyData, contactsData, projectsData, invoicesData] = await Promise.all([
        companiesApi.get(clientId),
        companiesApi.getContacts(clientId).catch(() => []),
        projectsApi.list({ company_id: clientId, page_size: 100 }).catch(() => ({ projects: [] })),
        invoicesApi.list({ company_id: clientId, page_size: 100 }).catch(() => ({ invoices: [] })),
      ])
      setCompany(companyData)
      setContacts(contactsData || [])
      setProjects(projectsData.projects || [])
      setInvoices(invoicesData.invoices || [])
    } catch (error) {
      console.error('Failed to fetch client:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvite = async (contactId: number) => {
    setSendingInvite(contactId)
    setInviteStatus(null)
    try {
      await companiesApi.sendInvite(clientId, contactId)
      setInviteStatus({ contactId, status: 'sent' })
    } catch (error: any) {
      setInviteStatus({ contactId, status: 'error', message: error.message })
    } finally {
      setSendingInvite(null)
    }
  }

  // Open Edit Modal with current company data
  const openEditModal = () => {
    if (company) {
      setEditForm({
        name: company.name || '',
        trading_name: company.trading_name || '',
        industry: company.industry || '',
        country: company.country || '',
        city: company.city || '',
        website: company.website || '',
        phone: company.phone || '',
        email: company.email || '',
        status: company.status || '',
        lead_source: company.lead_source || '',
        referred_by: company.referred_by || '',
        notes: company.notes || '',
      })
      setShowEditModal(true)
    }
  }

  // Handle edit form input changes
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  // Handle update client submission
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(false)

    try {
      if (!editForm.name.trim()) {
        throw new Error('Company name is required')
      }

      const updateData = {
        name: editForm.name.trim(),
        trading_name: editForm.trading_name.trim() || undefined,
        industry: editForm.industry || undefined,
        country: editForm.country.trim() || undefined,
        city: editForm.city.trim() || undefined,
        website: editForm.website.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        email: editForm.email.trim() || undefined,
        status: editForm.status || undefined,
        lead_source: editForm.lead_source || undefined,
        referred_by: editForm.referred_by.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
      }

      const updatedCompany = await companiesApi.update(clientId, updateData)
      setCompany(updatedCompany)
      setUpdateSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['companies'] })

      setTimeout(() => {
        setShowEditModal(false)
        setUpdateSuccess(false)
      }, 1500)
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update client')
    } finally {
      setIsUpdating(false)
    }
  }

  // Close edit modal and reset
  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setUpdateError(null)
    setUpdateSuccess(false)
  }

  // Handle contact form input changes
  const handleContactInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setContactForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Handle add contact submission
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddingContact(true)
    setAddContactError(null)
    setAddContactSuccess(false)

    try {
      if (!contactForm.first_name.trim() || !contactForm.email.trim()) {
        throw new Error('First name and email are required')
      }

      const contactData = {
        first_name: contactForm.first_name.trim(),
        last_name: contactForm.last_name.trim() || undefined,
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim() || undefined,
        job_title: contactForm.job_title.trim() || undefined,
        is_primary: contactForm.is_primary,
        is_decision_maker: contactForm.is_decision_maker,
      }

      // Add contact via API (would need to add this to companiesApi)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(contactData),
      })

      if (!response.ok) {
        throw new Error('Failed to add contact')
      }

      const newContact = await response.json()
      setContacts(prev => [...prev, newContact])
      setAddContactSuccess(true)

      setTimeout(() => {
        setShowAddContactModal(false)
        setContactForm({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          job_title: '',
          is_primary: false,
          is_decision_maker: false,
        })
        setAddContactSuccess(false)
      }, 1500)
    } catch (err: any) {
      setAddContactError(err.message || 'Failed to add contact')
    } finally {
      setIsAddingContact(false)
    }
  }

  // Close add contact modal and reset
  const handleCloseAddContactModal = () => {
    setShowAddContactModal(false)
    setAddContactError(null)
    setAddContactSuccess(false)
    setContactForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      job_title: '',
      is_primary: false,
      is_decision_maker: false,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="flex items-center gap-3 text-jasper-slate">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading client...
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-jasper-slate mx-auto mb-4" />
          <p className="text-jasper-slate mb-4">Client not found</p>
          <Link href="/clients" className="btn-primary">
            Back to Clients
          </Link>
        </div>
      </div>
    )
  }

  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0]
  const activeProjects = projects.filter((p) => !['final', 'cancelled'].includes(p.stage))
  const completedProjects = projects.filter((p) => p.stage === 'final')
  const pendingInvoices = invoices.filter((i) => ['sent', 'viewed', 'overdue'].includes(i.status))
  const paidInvoices = invoices.filter((i) => i.status === 'paid')

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header title={company.name} subtitle={company.trading_name || industries[company.industry || ''] || 'Client'} />

      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-sm text-jasper-slate hover:text-jasper-carbon transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-jasper-emerald/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-jasper-emerald" />
              </div>
              <div>
                <p className="text-sm text-jasper-slate">Active Projects</p>
                <p className="text-2xl font-semibold text-jasper-carbon">{activeProjects.length}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-jasper-slate">Total Revenue</p>
                <p className="text-2xl font-semibold text-jasper-carbon">
                  {formatCurrency(company.total_revenue, 'USD')}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-jasper-slate">Pending Invoices</p>
                <p className="text-2xl font-semibold text-jasper-carbon">{pendingInvoices.length}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                company.outstanding_balance > 0 ? 'bg-red-100' : 'bg-green-100'
              )}>
                <DollarSign className={cn(
                  'w-6 h-6',
                  company.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'
                )} />
              </div>
              <div>
                <p className="text-sm text-jasper-slate">Outstanding</p>
                <p className={cn(
                  'text-2xl font-semibold',
                  company.outstanding_balance > 0 ? 'text-red-600' : 'text-jasper-carbon'
                )}>
                  {formatCurrency(company.outstanding_balance, 'USD')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'overview'
                ? 'border-jasper-emerald text-jasper-emerald'
                : 'border-transparent text-jasper-slate hover:text-jasper-carbon'
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'projects'
                ? 'border-jasper-emerald text-jasper-emerald'
                : 'border-transparent text-jasper-slate hover:text-jasper-carbon'
            )}
          >
            <Briefcase className="w-4 h-4" />
            Projects
            {projects.length > 0 && (
              <span className="badge badge-secondary text-xs">{projects.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'invoices'
                ? 'border-jasper-emerald text-jasper-emerald'
                : 'border-transparent text-jasper-slate hover:text-jasper-carbon'
            )}
          >
            <FileText className="w-4 h-4" />
            Invoices
            {invoices.length > 0 && (
              <span className="badge badge-secondary text-xs">{invoices.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'messages'
                ? 'border-jasper-emerald text-jasper-emerald'
                : 'border-transparent text-jasper-slate hover:text-jasper-carbon'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Messages
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Info */}
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-jasper-carbon">Company Information</h2>
                  <div className="flex items-center gap-2">
                    <span className={cn('badge text-sm', statusColors[company.status] || 'badge-neutral')}>
                      {company.status}
                    </span>
                    <button
                      onClick={openEditModal}
                      className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-jasper-slate" />
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {company.industry && (
                      <InfoItem
                        icon={Building2}
                        label="Industry"
                        value={industries[company.industry] || company.industry}
                      />
                    )}
                    {(company.city || company.country) && (
                      <InfoItem
                        icon={MapPin}
                        label="Location"
                        value={[company.city, company.country].filter(Boolean).join(', ')}
                      />
                    )}
                    {company.email && (
                      <InfoItem
                        icon={Mail}
                        label="Email"
                        value={company.email}
                        href={`mailto:${company.email}`}
                      />
                    )}
                    {company.phone && (
                      <InfoItem
                        icon={Phone}
                        label="Phone"
                        value={company.phone}
                        href={`tel:${company.phone}`}
                      />
                    )}
                    {company.website && (
                      <InfoItem
                        icon={Globe}
                        label="Website"
                        value={company.website.replace(/^https?:\/\//, '')}
                        href={company.website}
                        external
                      />
                    )}
                    {company.lead_source && (
                      <InfoItem
                        icon={TrendingUp}
                        label="Lead Source"
                        value={company.lead_source.replace(/_/g, ' ')}
                      />
                    )}
                  </div>

                  {company.notes && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <p className="text-sm text-jasper-slate mb-2">Notes</p>
                      <p className="text-jasper-carbon">{company.notes}</p>
                    </div>
                  )}

                  {company.dfi_targets && company.dfi_targets.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <p className="text-sm text-jasper-slate mb-3">Target DFIs</p>
                      <div className="flex flex-wrap gap-2">
                        {company.dfi_targets.map((dfi) => (
                          <span key={dfi} className="badge badge-info">
                            {dfi}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contacts */}
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-jasper-carbon">
                    Contacts
                    <span className="ml-2 text-sm font-normal text-jasper-slate">
                      ({contacts.length})
                    </span>
                  </h2>
                  <button
                    onClick={() => setShowAddContactModal(true)}
                    className="btn-secondary text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Contact
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {contacts.length === 0 ? (
                    <div className="p-6 text-center text-jasper-slate">
                      No contacts added yet
                    </div>
                  ) : (
                    contacts.map((contact) => (
                      <div key={contact.id} className="p-4 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-jasper-navy/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-jasper-navy">
                              {getInitials(`${contact.first_name} ${contact.last_name}`)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-jasper-carbon">
                                {contact.first_name} {contact.last_name}
                              </span>
                              {contact.is_primary && (
                                <span className="badge badge-success text-xs">Primary</span>
                              )}
                              {contact.is_decision_maker && (
                                <span className="badge badge-info text-xs">Decision Maker</span>
                              )}
                            </div>
                            {contact.job_title && (
                              <p className="text-sm text-jasper-slate">{contact.job_title}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-jasper-slate">
                              <a
                                href={`mailto:${contact.email}`}
                                className="flex items-center gap-1 hover:text-jasper-emerald transition-colors"
                              >
                                <Mail className="w-3 h-3" />
                                {contact.email}
                              </a>
                              {contact.phone && (
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="flex items-center gap-1 hover:text-jasper-emerald transition-colors"
                                >
                                  <Phone className="w-3 h-3" />
                                  {contact.phone}
                                </a>
                              )}
                            </div>
                            {inviteStatus?.contactId === contact.id && (
                              <div className={cn(
                                'mt-2 text-sm flex items-center gap-1',
                                inviteStatus.status === 'sent' ? 'text-green-600' : 'text-red-600'
                              )}>
                                {inviteStatus.status === 'sent' ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Portal invitation sent
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3 h-3" />
                                    {inviteStatus.message || 'Failed to send invite'}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendInvite(contact.id)}
                          disabled={sendingInvite === contact.id}
                          className="btn-ghost text-sm whitespace-nowrap"
                        >
                          {sendingInvite === contact.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {sendingInvite === contact.id ? 'Sending...' : 'Send Invite'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-jasper-carbon">Quick Actions</h3>
                </div>
                <div className="card-body space-y-2">
                  <Link href={`/projects/new?company_id=${company.id}`} className="btn-primary w-full justify-start">
                    <Briefcase className="w-4 h-4" />
                    Create Project
                  </Link>
                  <Link href={`/invoices/new?company_id=${company.id}`} className="btn-secondary w-full justify-start">
                    <FileText className="w-4 h-4" />
                    Create Invoice
                  </Link>
                  <button
                    onClick={() => setActiveTab('messages')}
                    className="btn-ghost w-full justify-start"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send Message
                  </button>
                  <button
                    onClick={openEditModal}
                    className="btn-ghost w-full justify-start"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Client
                  </button>
                </div>
              </div>

              {/* Recent Projects */}
              {projects.length > 0 && (
                <div className="card">
                  <div className="card-header flex items-center justify-between">
                    <h3 className="font-semibold text-jasper-carbon">Recent Projects</h3>
                    <button
                      onClick={() => setActiveTab('projects')}
                      className="text-sm text-jasper-emerald hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="divide-y divide-border">
                    {projects.slice(0, 3).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="flex items-center justify-between p-4 hover:bg-surface-secondary transition-colors"
                      >
                        <div>
                          <p className="font-medium text-jasper-carbon text-sm">{project.reference}</p>
                          <p className="text-xs text-jasper-slate">{project.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn('badge text-xs', getStageColor(project.stage))}>
                            {formatStage(project.stage)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-jasper-slate" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta Info */}
              <div className="card">
                <div className="card-body text-sm text-jasper-slate space-y-2">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="text-jasper-carbon">{formatDate(company.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated</span>
                    <span className="text-jasper-carbon">{formatDate(company.updated_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client ID</span>
                    <span className="font-mono text-jasper-carbon">#{company.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-jasper-carbon">Projects</h2>
                <p className="text-sm text-jasper-slate">
                  {activeProjects.length} active, {completedProjects.length} completed
                </p>
              </div>
              <Link href={`/projects/new?company_id=${company.id}`} className="btn-primary">
                <Briefcase className="w-4 h-4" />
                New Project
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="card p-12 text-center">
                <Briefcase className="w-12 h-12 text-jasper-slate mx-auto mb-4" />
                <p className="text-jasper-slate mb-4">No projects yet</p>
                <Link href={`/projects/new?company_id=${company.id}`} className="btn-primary inline-flex">
                  Create First Project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="card card-hover p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-jasper-carbon">{project.reference}</p>
                        <p className="text-sm text-jasper-slate">{project.name}</p>
                      </div>
                      <span className={cn('badge text-xs', getStageColor(project.stage))}>
                        {formatStage(project.stage)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="text-jasper-slate">Value</span>
                      <span className="font-medium text-jasper-carbon">
                        {formatCurrency(project.value, project.currency)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-jasper-slate">Progress</span>
                        <span className="font-medium text-jasper-emerald">{project.progress_percent}%</span>
                      </div>
                      <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-jasper-emerald rounded-full transition-all"
                          style={{ width: `${project.progress_percent}%` }}
                        />
                      </div>
                    </div>

                    {project.target_completion && (
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                        <span className="text-jasper-slate flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Target
                        </span>
                        <span className="text-jasper-carbon">{formatDate(project.target_completion)}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-jasper-carbon">Invoices</h2>
                <p className="text-sm text-jasper-slate">
                  {pendingInvoices.length} pending, {paidInvoices.length} paid
                </p>
              </div>
              <Link href={`/invoices/new?company_id=${company.id}`} className="btn-primary">
                <FileText className="w-4 h-4" />
                New Invoice
              </Link>
            </div>

            {invoices.length === 0 ? (
              <div className="card p-12 text-center">
                <FileText className="w-12 h-12 text-jasper-slate mx-auto mb-4" />
                <p className="text-jasper-slate mb-4">No invoices yet</p>
                <Link href={`/invoices/new?company_id=${company.id}`} className="btn-primary inline-flex">
                  Create First Invoice
                </Link>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-surface-secondary border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-jasper-slate">Invoice</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-jasper-slate">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-jasper-slate">Amount</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-jasper-slate">Due Date</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-jasper-slate"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-surface-secondary/50 transition-colors">
                        <td className="px-4 py-4">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="font-medium text-jasper-carbon hover:text-jasper-emerald"
                          >
                            {invoice.invoice_number}
                          </Link>
                          <p className="text-xs text-jasper-slate">{formatDate(invoice.created_at)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn('badge text-xs', invoiceStatusColors[invoice.status] || 'badge-neutral')}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-jasper-carbon">
                          {formatCurrency(invoice.total_amount, invoice.currency)}
                        </td>
                        <td className="px-4 py-4 text-sm text-jasper-slate">
                          {formatDate(invoice.due_date)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="btn-ghost text-sm"
                          >
                            View
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="h-[600px]">
            <MessageCenter
              companyId={company.id}
              companyName={company.name}
            />
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={handleCloseEditModal}
            />

            <div className="relative bg-surface-primary rounded-xl shadow-modal w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-jasper-emerald/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-jasper-emerald" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-jasper-carbon">Edit Client</h2>
                    <p className="text-sm text-jasper-slate">Update client information</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-jasper-slate" />
                </button>
              </div>

              <form onSubmit={handleUpdateClient} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="p-6 space-y-6">
                  {updateSuccess && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800">Client updated successfully!</span>
                    </div>
                  )}

                  {updateError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-800">{updateError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">
                        Company Name <span className="text-status-error">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditInputChange}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="input-label">Trading Name</label>
                      <input
                        type="text"
                        name="trading_name"
                        value={editForm.trading_name}
                        onChange={handleEditInputChange}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Industry</label>
                      <select
                        name="industry"
                        value={editForm.industry}
                        onChange={handleEditInputChange}
                        className="input"
                      >
                        <option value="">Select industry...</option>
                        {industryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Status</label>
                      <select
                        name="status"
                        value={editForm.status}
                        onChange={handleEditInputChange}
                        className="input"
                      >
                        {clientStatusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={editForm.country}
                        onChange={handleEditInputChange}
                        placeholder="e.g., South Africa"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="input-label">City</label>
                      <input
                        type="text"
                        name="city"
                        value={editForm.city}
                        onChange={handleEditInputChange}
                        placeholder="e.g., Johannesburg"
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditInputChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="input-label">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditInputChange}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={editForm.website}
                      onChange={handleEditInputChange}
                      placeholder="https://..."
                      className="input"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Lead Source</label>
                      <select
                        name="lead_source"
                        value={editForm.lead_source}
                        onChange={handleEditInputChange}
                        className="input"
                      >
                        <option value="">Select source...</option>
                        {leadSourceOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Referred By</label>
                      <input
                        type="text"
                        name="referred_by"
                        value={editForm.referred_by}
                        onChange={handleEditInputChange}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Notes</label>
                    <textarea
                      name="notes"
                      value={editForm.notes}
                      onChange={handleEditInputChange}
                      rows={3}
                      className="input resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface-secondary">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="btn-secondary"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isUpdating || updateSuccess}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : updateSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Saved!
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={handleCloseAddContactModal}
            />

            <div className="relative bg-surface-primary rounded-xl shadow-modal w-full max-w-lg max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-jasper-emerald/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-jasper-emerald" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-jasper-carbon">Add Contact</h2>
                    <p className="text-sm text-jasper-slate">Add a new contact to {company.name}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseAddContactModal}
                  className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-jasper-slate" />
                </button>
              </div>

              <form onSubmit={handleAddContact} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="p-6 space-y-4">
                  {addContactSuccess && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800">Contact added successfully!</span>
                    </div>
                  )}

                  {addContactError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-800">{addContactError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">
                        First Name <span className="text-status-error">*</span>
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={contactForm.first_name}
                        onChange={handleContactInputChange}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="input-label">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        value={contactForm.last_name}
                        onChange={handleContactInputChange}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">
                      Email <span className="text-status-error">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleContactInputChange}
                      className="input"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={contactForm.phone}
                        onChange={handleContactInputChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="input-label">Job Title</label>
                      <input
                        type="text"
                        name="job_title"
                        value={contactForm.job_title}
                        onChange={handleContactInputChange}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_primary"
                        checked={contactForm.is_primary}
                        onChange={handleContactInputChange}
                        className="w-4 h-4 rounded border-border text-jasper-emerald focus:ring-jasper-emerald"
                      />
                      <span className="text-sm text-jasper-carbon">Primary Contact</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_decision_maker"
                        checked={contactForm.is_decision_maker}
                        onChange={handleContactInputChange}
                        className="w-4 h-4 rounded border-border text-jasper-emerald focus:ring-jasper-emerald"
                      />
                      <span className="text-sm text-jasper-carbon">Decision Maker</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface-secondary">
                  <button
                    type="button"
                    onClick={handleCloseAddContactModal}
                    className="btn-secondary"
                    disabled={isAddingContact}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isAddingContact || addContactSuccess}
                  >
                    {isAddingContact ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : addContactSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Added!
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Contact
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

function InfoItem({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: any
  label: string
  value: string
  href?: string
  external?: boolean
}) {
  const content = (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-jasper-emerald" />
      </div>
      <div>
        <p className="text-xs text-jasper-slate">{label}</p>
        <p className={cn(
          'font-medium',
          href ? 'text-jasper-emerald hover:underline' : 'text-jasper-carbon'
        )}>
          {value}
          {external && <ExternalLink className="w-3 h-3 inline ml-1" />}
        </p>
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        {content}
      </a>
    )
  }

  return content
}
