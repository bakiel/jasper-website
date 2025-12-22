'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout'
import {
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Linkedin,
  MoreVertical,
  TrendingUp,
  Users,
  Target,
  Flame,
  ThermometerSun,
  Snowflake,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import Link from 'next/link'

// Lead types matching our Python models
interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  role?: string
  linkedin?: string
  source: string
  score: number
  tier: 'hot' | 'warm' | 'cold'
  status: string
  project_description?: string
  project_type?: string
  deal_size?: number
  target_dfi?: string
  research_status: string
  last_contact_at?: string
  created_at: string
  responded: boolean
  has_call_scheduled: boolean
}

interface LeadStats {
  total: number
  hot: number
  warm: number
  cold: number
  new_today: number
  response_rate: number
}

// Tier badge component
function TierBadge({ tier, score }: { tier: string; score: number }) {
  const config = {
    hot: {
      icon: Flame,
      label: 'Hot',
      classes: 'bg-red-100 text-red-800 border-red-200',
      emoji: '🔥',
    },
    warm: {
      icon: ThermometerSun,
      label: 'Warm',
      classes: 'bg-amber-100 text-amber-800 border-amber-200',
      emoji: '🌡️',
    },
    cold: {
      icon: Snowflake,
      label: 'Cold',
      classes: 'bg-blue-100 text-blue-800 border-blue-200',
      emoji: '❄️',
    },
  }

  const tierConfig = config[tier as keyof typeof config] || config.cold
  const Icon = tierConfig.icon

  return (
    <span className={cn('badge border flex items-center gap-1', tierConfig.classes)}>
      <span>{tierConfig.emoji}</span>
      <span>{score}</span>
    </span>
  )
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    engaged: 'bg-indigo-100 text-indigo-800',
    qualified: 'bg-emerald-100 text-emerald-800',
    proposal: 'bg-amber-100 text-amber-800',
    negotiation: 'bg-orange-100 text-orange-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-gray-100 text-gray-800',
    nurture: 'bg-cyan-100 text-cyan-800',
  }

  return (
    <span className={cn('badge', statusConfig[status] || 'badge-neutral')}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// Source badge component
function SourceBadge({ source }: { source: string }) {
  const sourceConfig: Record<string, { label: string; classes: string }> = {
    website: { label: 'Website', classes: 'bg-purple-50 text-purple-700' },
    whatsapp: { label: 'WhatsApp', classes: 'bg-green-50 text-green-700' },
    apollo: { label: 'Apollo', classes: 'bg-blue-50 text-blue-700' },
    cold_email: { label: 'Cold Email', classes: 'bg-gray-50 text-gray-700' },
    dfi_monitor: { label: 'DFI Monitor', classes: 'bg-amber-50 text-amber-700' },
    linkedin: { label: 'LinkedIn', classes: 'bg-indigo-50 text-indigo-700' },
    referral: { label: 'Referral', classes: 'bg-emerald-50 text-emerald-700' },
  }

  const config = sourceConfig[source] || { label: source, classes: 'bg-gray-50 text-gray-700' }

  return (
    <span className={cn('badge text-xs', config.classes)}>
      {config.label}
    </span>
  )
}

// Stat card component
function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  trend?: string
  color: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-jasper-slate">{label}</p>
          <p className="text-2xl font-semibold text-jasper-carbon mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-jasper-slate-light mt-1">{trend}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', color)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const CRM_API_URL = process.env.NEXT_PUBLIC_CRM_API_URL || 'http://127.0.0.1:8001'

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch leads and tier distribution from jasper-crm API
        const [leadsRes, tierRes, statsRes] = await Promise.all([
          fetch(`${CRM_API_URL}/api/v1/leads`),
          fetch(`${CRM_API_URL}/api/v1/agents/score/tier-distribution`),
          fetch(`${CRM_API_URL}/api/v1/leads/stats`).catch(() => null),
        ])

        if (!leadsRes.ok) throw new Error('Failed to fetch leads')

        const leadsResponse = await leadsRes.json()
        const tierData = await tierRes.json()
        const statsData = statsRes?.ok ? await statsRes.json() : null

        // API returns {"success": true, "leads": [...]}
        const leadsData = leadsResponse.leads || leadsResponse || []

        // Transform API response to our Lead interface
        const transformedLeads: Lead[] = leadsData.map((lead: any) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          role: lead.role,
          linkedin: lead.linkedin,
          source: lead.source,
          score: lead.score || 0,
          tier: lead.tier || 'cold',
          status: lead.status,
          project_description: lead.message || lead.project_description,
          project_type: lead.project_type || lead.sector,
          deal_size: lead.deal_size || lead.estimated_value,
          target_dfi: lead.target_dfis?.[0],
          research_status: lead.research_status || 'none',
          last_contact_at: lead.last_contacted_at,
          created_at: lead.created_at,
          responded: lead.responded || false,
          has_call_scheduled: lead.has_call_scheduled || false,
        }))

        // Calculate stats from data or use API response
        const calculatedStats: LeadStats = {
          total: transformedLeads.length,
          hot: tierData.hot || transformedLeads.filter((l: Lead) => l.score >= 70).length,
          warm: tierData.warm || transformedLeads.filter((l: Lead) => l.score >= 40 && l.score < 70).length,
          cold: tierData.cold || transformedLeads.filter((l: Lead) => l.score < 40).length,
          new_today: statsData?.new_today || 0,
          response_rate: statsData?.response_rate || Math.round(
            (transformedLeads.filter((l: Lead) => l.responded).length / transformedLeads.length) * 100
          ) || 0,
        }

        setLeads(transformedLeads)
        setStats(calculatedStats)
      } catch (error) {
        console.error('Failed to fetch leads:', error)
        // Set empty data on error
        setLeads([])
        setStats({ total: 0, hot: 0, warm: 0, cold: 0, new_today: 0, response_rate: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchQuery === '' ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTier = filterTier === 'all' || lead.tier === filterTier
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus

    return matchesSearch && matchesTier && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-jasper-slate">Loading leads...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header
        title="Lead Intelligence"
        subtitle="Track, score, and manage your sales pipeline"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={stats?.total || 0}
          icon={Users}
          trend={`+${stats?.new_today || 0} today`}
          color="bg-jasper-emerald"
        />
        <StatCard
          label="Hot Leads"
          value={stats?.hot || 0}
          icon={Flame}
          trend="Score 70+"
          color="bg-red-500"
        />
        <StatCard
          label="Warm Leads"
          value={stats?.warm || 0}
          icon={ThermometerSun}
          trend="Score 40-69"
          color="bg-amber-500"
        />
        <StatCard
          label="Response Rate"
          value={`${stats?.response_rate || 0}%`}
          icon={TrendingUp}
          trend="Last 30 days"
          color="bg-blue-500"
        />
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-jasper-slate" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3 items-center">
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="input w-auto"
              >
                <option value="all">All Tiers</option>
                <option value="hot">🔥 Hot (70+)</option>
                <option value="warm">🌡️ Warm (40-69)</option>
                <option value="cold">❄️ Cold (&lt;40)</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input w-auto"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="engaged">Engaged</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>

              <button className="btn-secondary">
                <Filter className="h-4 w-4" />
                More Filters
              </button>

              <Link href="/leads/new" className="btn-primary">
                <Plus className="h-4 w-4" />
                Add Lead
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Score</th>
                <th>Status</th>
                <th>Source</th>
                <th>Project</th>
                <th>Deal Size</th>
                <th>Last Contact</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-jasper-emerald/10 flex items-center justify-center text-jasper-emerald font-medium">
                        {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-medium text-jasper-carbon hover:text-jasper-emerald transition-colors"
                        >
                          {lead.name}
                        </Link>
                        <div className="text-sm text-jasper-slate">
                          {lead.company && <span>{lead.company}</span>}
                          {lead.role && <span className="text-jasper-slate-light"> · {lead.role}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <TierBadge tier={lead.tier} score={lead.score} />
                  </td>
                  <td>
                    <StatusBadge status={lead.status} />
                  </td>
                  <td>
                    <SourceBadge source={lead.source} />
                  </td>
                  <td>
                    <div className="max-w-xs">
                      <div className="text-sm text-jasper-carbon truncate">
                        {lead.project_description || '-'}
                      </div>
                      {lead.target_dfi && (
                        <span className="text-xs text-jasper-emerald">
                          Target: {lead.target_dfi}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {lead.deal_size ? (
                      <span className="font-medium text-jasper-carbon">
                        R{(lead.deal_size / 1000000).toFixed(1)}M
                      </span>
                    ) : (
                      <span className="text-jasper-slate-light">-</span>
                    )}
                  </td>
                  <td>
                    <div className="text-sm">
                      {lead.last_contact_at ? (
                        <>
                          <div className="text-jasper-carbon">
                            {formatDate(lead.last_contact_at)}
                          </div>
                          <div className="flex gap-2 mt-1">
                            {lead.responded && (
                              <span className="text-xs text-green-600">Responded</span>
                            )}
                            {lead.has_call_scheduled && (
                              <span className="text-xs text-blue-600">Call scheduled</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-jasper-slate-light">Never</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-2 rounded-lg hover:bg-surface-secondary"
                          title="Call"
                        >
                          <Phone className="h-4 w-4 text-jasper-slate" />
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="p-2 rounded-lg hover:bg-surface-secondary"
                          title="Email"
                        >
                          <Mail className="h-4 w-4 text-jasper-slate" />
                        </a>
                      )}
                      {lead.linkedin && (
                        <a
                          href={lead.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-surface-secondary"
                          title="LinkedIn"
                        >
                          <Linkedin className="h-4 w-4 text-jasper-slate" />
                        </a>
                      )}
                      <Link
                        href={`/leads/${lead.id}`}
                        className="p-2 rounded-lg hover:bg-surface-secondary"
                        title="View Details"
                      >
                        <ChevronRight className="h-4 w-4 text-jasper-slate" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="text-jasper-slate">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No leads found</p>
                      <p className="text-sm text-jasper-slate-light mt-1">
                        {searchQuery || filterTier !== 'all' || filterStatus !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Add your first lead to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
