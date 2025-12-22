'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import {
  ArrowLeft,
  Phone,
  Mail,
  Linkedin,
  Globe,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Target,
  DollarSign,
  FileText,
  MessageSquare,
  Search,
  Zap,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Flame,
  ThermometerSun,
  Snowflake,
  Edit,
  MoreVertical,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import Link from 'next/link'

// Agent Panel Components
import { ResearchPanel } from '@/components/agents/ResearchPanel'
import { CommsPanel } from '@/components/agents/CommsPanel'
import { CallBriefPanel } from '@/components/agents/CallBriefPanel'

// Types
interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  role?: string
  linkedin?: string
  source: string
  source_detail?: string
  score: number
  tier: 'hot' | 'warm' | 'cold'
  status: string
  project_description?: string
  project_type?: string
  deal_size?: number
  target_dfi?: string
  timeline?: string
  research_status: string
  last_researched_at?: string
  company_info?: CompanyProfile
  person_info?: PersonProfile
  similar_deals?: SimilarDeal[]
  bant: BANTQualification
  last_contact_at?: string
  last_contact_channel?: string
  next_action?: string
  next_action_date?: string
  has_call_scheduled: boolean
  next_call_at?: string
  total_calls: number
  responded: boolean
  emails_opened: number
  asked_about_pricing: boolean
  requested_proposal: boolean
  escalated: boolean
  escalation_reason?: string
  tags: string[]
  notes?: string
  created_at: string
  updated_at: string
}

interface CompanyProfile {
  name: string
  website?: string
  industry?: string
  description?: string
  employee_count?: string
  headquarters?: string
  linkedin_url?: string
}

interface PersonProfile {
  name: string
  role?: string
  linkedin_url?: string
  bio?: string
  experience?: string[]
}

interface SimilarDeal {
  deal_name: string
  company: string
  deal_size?: number
  dfi?: string
  similarity_score: number
  outcome: string
}

interface BANTQualification {
  budget_qualified: boolean
  budget_notes?: string
  authority_qualified: boolean
  authority_notes?: string
  need_qualified: boolean
  need_notes?: string
  timeline_qualified: boolean
  timeline_notes?: string
}

interface Message {
  id: string
  channel: 'whatsapp' | 'email'
  direction: 'inbound' | 'outbound'
  content: string
  subject?: string
  created_at: string
  intent?: string
}

// Tier indicator
function TierIndicator({ tier, score }: { tier: string; score: number }) {
  const config = {
    hot: {
      label: 'Hot Lead',
      classes: 'bg-red-500',
      textClass: 'text-red-600',
      emoji: '🔥',
    },
    warm: {
      label: 'Warm Lead',
      classes: 'bg-amber-500',
      textClass: 'text-amber-600',
      emoji: '🌡️',
    },
    cold: {
      label: 'Cold Lead',
      classes: 'bg-blue-500',
      textClass: 'text-blue-600',
      emoji: '❄️',
    },
  }

  const tierConfig = config[tier as keyof typeof config] || config.cold

  return (
    <div className="flex items-center gap-3">
      <div className={cn('h-16 w-16 rounded-xl flex items-center justify-center text-3xl', tierConfig.classes.replace('bg-', 'bg-opacity-20 bg-'))}>
        {tierConfig.emoji}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={cn('text-3xl font-bold', tierConfig.textClass)}>{score}</span>
          <span className="text-jasper-slate text-sm">/ 100</span>
        </div>
        <span className={cn('text-sm font-medium', tierConfig.textClass)}>{tierConfig.label}</span>
      </div>
    </div>
  )
}

// BANT Checklist
function BANTChecklist({ bant }: { bant: BANTQualification }) {
  const items = [
    { key: 'budget', label: 'Budget', qualified: bant.budget_qualified, notes: bant.budget_notes },
    { key: 'authority', label: 'Authority', qualified: bant.authority_qualified, notes: bant.authority_notes },
    { key: 'need', label: 'Need', qualified: bant.need_qualified, notes: bant.need_notes },
    { key: 'timeline', label: 'Timeline', qualified: bant.timeline_qualified, notes: bant.timeline_notes },
  ]

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="flex items-start gap-3">
          {item.qualified ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-jasper-slate-light mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <span className={cn('font-medium', item.qualified ? 'text-jasper-carbon' : 'text-jasper-slate')}>
              {item.label}
            </span>
            {item.notes && (
              <p className="text-sm text-jasper-slate mt-0.5">{item.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Status badge
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
    <span className={cn('badge text-sm', statusConfig[status] || 'badge-neutral')}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const CRM_API_URL = process.env.NEXT_PUBLIC_CRM_API_URL || 'http://127.0.0.1:8001'

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'research' | 'comms' | 'brief'>('research')

  useEffect(() => {
    async function fetchLead() {
      try {
        // Fetch lead from jasper-crm API
        const response = await fetch(`${CRM_API_URL}/api/v1/leads/${leadId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch lead')
        }
        const data = await response.json()
        // API returns {"success": true, "lead": {...}}
        const apiLead = data.lead || data

        // Transform API response to our Lead interface
        const transformedLead: Lead = {
          id: apiLead.id,
          name: apiLead.name,
          email: apiLead.email,
          phone: apiLead.phone,
          company: apiLead.company,
          role: apiLead.role,
          linkedin: apiLead.linkedin,
          source: apiLead.source || 'website',
          source_detail: apiLead.source_detail,
          score: apiLead.score || 0,
          tier: apiLead.tier || 'cold',
          status: apiLead.status || 'new',
          project_description: apiLead.message || apiLead.project_description,
          project_type: apiLead.project_type || apiLead.sector,
          deal_size: apiLead.deal_size || apiLead.estimated_value,
          target_dfi: apiLead.target_dfis?.[0],
          timeline: apiLead.timeline,
          research_status: apiLead.research_status || 'none',
          last_researched_at: apiLead.last_researched_at,
          company_info: apiLead.company_info,
          person_info: apiLead.person_info,
          similar_deals: apiLead.similar_deals || [],
          bant: apiLead.bant || {
            budget_qualified: false,
            authority_qualified: false,
            need_qualified: false,
            timeline_qualified: false,
          },
          last_contact_at: apiLead.last_contacted_at,
          last_contact_channel: apiLead.last_contact_channel,
          next_action: apiLead.next_action,
          next_action_date: apiLead.next_action_date,
          has_call_scheduled: apiLead.has_call_scheduled || false,
          next_call_at: apiLead.next_call_at,
          total_calls: apiLead.total_calls || 0,
          responded: apiLead.responded || false,
          emails_opened: apiLead.emails_opened || 0,
          asked_about_pricing: apiLead.asked_about_pricing || false,
          requested_proposal: apiLead.requested_proposal || false,
          escalated: apiLead.escalated || false,
          escalation_reason: apiLead.escalation_reason,
          tags: apiLead.tags || [],
          notes: apiLead.notes,
          created_at: apiLead.created_at,
          updated_at: apiLead.updated_at,
        }

        setLead(transformedLead)

        // TODO: Fetch messages from communication history endpoint when available
        setMessages([])
      } catch (error) {
        console.error('Failed to fetch lead:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLead()
  }, [leadId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-jasper-slate">Loading lead...</div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-jasper-slate mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-jasper-carbon mb-2">Lead not found</h2>
          <p className="text-jasper-slate mb-4">The lead you're looking for doesn't exist.</p>
          <Link href="/leads" className="btn-primary">
            Back to Leads
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Leads', href: '/leads' },
          { label: lead.name },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-jasper-slate" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-jasper-carbon">{lead.name}</h1>
              <StatusBadge status={lead.status} />
              {lead.escalated && (
                <span className="badge badge-error">Escalated</span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-jasper-slate">
              {lead.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {lead.company}
                </span>
              )}
              {lead.role && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {lead.role}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button className="btn-primary">
            <Send className="h-4 w-4" />
            Send Message
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lead Info */}
        <div className="space-y-6">
          {/* Score Card */}
          <div className="card p-6">
            <TierIndicator tier={lead.tier} score={lead.score} />

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="font-medium text-jasper-carbon mb-4">Contact</h3>
              <div className="space-y-3">
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-3 text-sm text-jasper-slate hover:text-jasper-emerald transition-colors">
                    <Mail className="h-4 w-4" />
                    {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-3 text-sm text-jasper-slate hover:text-jasper-emerald transition-colors">
                    <Phone className="h-4 w-4" />
                    {lead.phone}
                  </a>
                )}
                {lead.linkedin && (
                  <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-jasper-slate hover:text-jasper-emerald transition-colors">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn Profile
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Project Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-medium text-jasper-carbon">Project Details</h3>
            </div>
            <div className="card-body space-y-4">
              {lead.project_description && (
                <p className="text-sm text-jasper-slate">{lead.project_description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {lead.project_type && (
                  <div>
                    <span className="text-jasper-slate-light">Type</span>
                    <p className="font-medium text-jasper-carbon capitalize">{lead.project_type.replace('_', ' ')}</p>
                  </div>
                )}
                {lead.deal_size && (
                  <div>
                    <span className="text-jasper-slate-light">Deal Size</span>
                    <p className="font-medium text-jasper-carbon">R{(lead.deal_size / 1000000).toFixed(1)}M</p>
                  </div>
                )}
                {lead.target_dfi && (
                  <div>
                    <span className="text-jasper-slate-light">Target DFI</span>
                    <p className="font-medium text-jasper-emerald">{lead.target_dfi}</p>
                  </div>
                )}
                {lead.timeline && (
                  <div>
                    <span className="text-jasper-slate-light">Timeline</span>
                    <p className="font-medium text-jasper-carbon">{lead.timeline}</p>
                  </div>
                )}
              </div>

              {lead.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {lead.tags.map((tag) => (
                    <span key={tag} className="badge badge-neutral text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BANT Qualification */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-medium text-jasper-carbon">Qualification (BANT)</h3>
            </div>
            <div className="card-body">
              <BANTChecklist bant={lead.bant} />
            </div>
          </div>

          {/* Activity */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-medium text-jasper-carbon">Activity</h3>
            </div>
            <div className="card-body space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-jasper-slate">Created</span>
                <span className="text-jasper-carbon">{formatDate(lead.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-jasper-slate">Last Contact</span>
                <span className="text-jasper-carbon">{lead.last_contact_at ? formatDate(lead.last_contact_at) : 'Never'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-jasper-slate">Emails Opened</span>
                <span className="text-jasper-carbon">{lead.emails_opened}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-jasper-slate">Total Calls</span>
                <span className="text-jasper-carbon">{lead.total_calls}</span>
              </div>
              {lead.has_call_scheduled && lead.next_call_at && (
                <div className="flex justify-between">
                  <span className="text-jasper-slate">Next Call</span>
                  <span className="text-jasper-emerald font-medium">{formatDate(lead.next_call_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Agent Panels */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Tabs */}
          <div className="card">
            <div className="border-b border-border">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('research')}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2',
                    activeTab === 'research'
                      ? 'border-jasper-emerald text-jasper-emerald'
                      : 'border-transparent text-jasper-slate hover:text-jasper-carbon'
                  )}
                >
                  <Search className="h-4 w-4" />
                  Research
                </button>
                <button
                  onClick={() => setActiveTab('comms')}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2',
                    activeTab === 'comms'
                      ? 'border-jasper-emerald text-jasper-emerald'
                      : 'border-transparent text-jasper-slate hover:text-jasper-carbon'
                  )}
                >
                  <MessageSquare className="h-4 w-4" />
                  Communication
                </button>
                <button
                  onClick={() => setActiveTab('brief')}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2',
                    activeTab === 'brief'
                      ? 'border-jasper-emerald text-jasper-emerald'
                      : 'border-transparent text-jasper-slate hover:text-jasper-carbon'
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Call Brief
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'research' && (
                <ResearchPanel
                  lead={lead}
                  onResearchComplete={(updatedLead) => setLead(prev => prev ? { ...prev, ...updatedLead } : prev)}
                />
              )}
              {activeTab === 'comms' && (
                <CommsPanel
                  lead={lead}
                  messages={messages}
                  onMessageSent={(newMessage) => setMessages([...messages, newMessage])}
                />
              )}
              {activeTab === 'brief' && (
                <CallBriefPanel lead={lead} />
              )}
            </div>
          </div>

          {/* Next Action Card */}
          {lead.next_action && (
            <div className="card bg-jasper-emerald/5 border-jasper-emerald/20">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-jasper-emerald/10">
                    <Zap className="h-5 w-5 text-jasper-emerald" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-jasper-carbon">Next Action</h4>
                    <p className="text-sm text-jasper-slate mt-1">{lead.next_action}</p>
                    {lead.next_action_date && (
                      <p className="text-sm text-jasper-emerald mt-2">
                        Due: {formatDate(lead.next_action_date)}
                      </p>
                    )}
                  </div>
                  <button className="btn-primary text-sm">
                    Mark Complete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h3 className="font-medium text-jasper-carbon">Notes</h3>
                <button className="text-jasper-slate hover:text-jasper-emerald transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
              <div className="card-body">
                <p className="text-sm text-jasper-slate">{lead.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
