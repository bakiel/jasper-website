'use client'

import { useState } from 'react'
import {
  Search,
  RefreshCw,
  Building2,
  User,
  Globe,
  Briefcase,
  MapPin,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

const CRM_API_URL = process.env.NEXT_PUBLIC_CRM_API_URL || 'http://127.0.0.1:8001'

interface Lead {
  id: string
  name: string
  company?: string
  research_status: string
  last_researched_at?: string
  company_info?: CompanyProfile
  person_info?: PersonProfile
  similar_deals?: SimilarDeal[]
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

interface ResearchPanelProps {
  lead: Lead
  onResearchComplete: (updatedLead: Lead) => void
}

export function ResearchPanel({ lead, onResearchComplete }: ResearchPanelProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'light' | 'deep'>('light')

  const handleRunResearch = async () => {
    setIsRunning(true)
    try {
      // Call jasper-crm Research Agent API
      const response = await fetch(`${CRM_API_URL}/api/v1/agents/research/${lead.id}?mode=${mode}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Research request failed')
      }

      const result = await response.json()

      // Update lead with research results
      onResearchComplete({
        ...lead,
        research_status: result.research_status || mode,
        last_researched_at: result.last_researched_at || new Date().toISOString(),
        company_info: result.company_info || lead.company_info,
        person_info: result.person_info || lead.person_info,
        similar_deals: result.similar_deals || lead.similar_deals,
      })
    } catch (error) {
      console.error('Research failed:', error)
      // Still update status locally on error
      onResearchComplete({
        ...lead,
        research_status: 'error',
      })
    } finally {
      setIsRunning(false)
    }
  }

  const hasResearch = lead.research_status !== 'none'

  return (
    <div className="space-y-6">
      {/* Research Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-jasper-carbon">Research Agent</h3>
          <p className="text-sm text-jasper-slate mt-0.5">
            {lead.research_status === 'none' && 'No research performed yet'}
            {lead.research_status === 'light' && 'Light research completed'}
            {lead.research_status === 'deep' && 'Deep research completed'}
            {lead.last_researched_at && ` · ${formatDate(lead.last_researched_at)}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'light' | 'deep')}
            className="input w-auto text-sm"
            disabled={isRunning}
          >
            <option value="light">Light Mode</option>
            <option value="deep">Deep Mode</option>
          </select>

          <button
            onClick={handleRunResearch}
            disabled={isRunning}
            className="btn-primary"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run Research
              </>
            )}
          </button>
        </div>
      </div>

      {/* Research Status Indicator */}
      {isRunning && (
        <div className="bg-jasper-emerald/5 border border-jasper-emerald/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-jasper-emerald animate-spin" />
            <div>
              <p className="font-medium text-jasper-carbon">Research in progress</p>
              <p className="text-sm text-jasper-slate">
                {mode === 'light' ? 'Gathering basic company and person info...' : 'Performing deep research with DFI requirements...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Research State */}
      {!hasResearch && !isRunning && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-jasper-slate/50 mx-auto mb-4" />
          <h4 className="font-medium text-jasper-carbon mb-2">No research yet</h4>
          <p className="text-sm text-jasper-slate max-w-md mx-auto">
            Run the Research Agent to gather company and person information,
            find similar deals, and enrich this lead's profile.
          </p>
        </div>
      )}

      {/* Research Results */}
      {hasResearch && !isRunning && (
        <div className="space-y-6">
          {/* Company Info */}
          {lead.company_info && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-surface-secondary px-4 py-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-jasper-emerald" />
                <h4 className="font-medium text-jasper-carbon">Company Intel</h4>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium text-jasper-carbon">{lead.company_info.name}</h5>
                    {lead.company_info.industry && (
                      <span className="text-sm text-jasper-slate">{lead.company_info.industry}</span>
                    )}
                  </div>
                  {lead.company_info.website && (
                    <a
                      href={lead.company_info.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-jasper-emerald hover:underline text-sm flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      Website
                    </a>
                  )}
                </div>

                {lead.company_info.description && (
                  <p className="text-sm text-jasper-slate">{lead.company_info.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {lead.company_info.employee_count && (
                    <div className="flex items-center gap-2 text-jasper-slate">
                      <Users className="h-4 w-4" />
                      {lead.company_info.employee_count} employees
                    </div>
                  )}
                  {lead.company_info.headquarters && (
                    <div className="flex items-center gap-2 text-jasper-slate">
                      <MapPin className="h-4 w-4" />
                      {lead.company_info.headquarters}
                    </div>
                  )}
                </div>

                {lead.company_info.linkedin_url && (
                  <a
                    href={lead.company_info.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-jasper-slate hover:text-jasper-emerald transition-colors"
                  >
                    View on LinkedIn
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Person Info */}
          {lead.person_info && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-surface-secondary px-4 py-3 flex items-center gap-2">
                <User className="h-4 w-4 text-jasper-emerald" />
                <h4 className="font-medium text-jasper-carbon">Person Intel</h4>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-medium text-jasper-carbon">{lead.person_info.name}</h5>
                    {lead.person_info.role && (
                      <span className="text-sm text-jasper-slate">{lead.person_info.role}</span>
                    )}
                  </div>
                  {lead.person_info.linkedin_url && (
                    <a
                      href={lead.person_info.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-jasper-emerald hover:underline text-sm flex items-center gap-1"
                    >
                      LinkedIn
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {lead.person_info.bio && (
                  <p className="text-sm text-jasper-slate">{lead.person_info.bio}</p>
                )}

                {lead.person_info.experience && lead.person_info.experience.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium text-jasper-carbon mb-2">Experience</h6>
                    <ul className="space-y-1">
                      {lead.person_info.experience.map((exp, index) => (
                        <li key={index} className="text-sm text-jasper-slate flex items-start gap-2">
                          <Briefcase className="h-4 w-4 mt-0.5 flex-shrink-0 text-jasper-slate-light" />
                          {exp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Similar Deals */}
          {lead.similar_deals && lead.similar_deals.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-surface-secondary px-4 py-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-jasper-emerald" />
                <h4 className="font-medium text-jasper-carbon">Similar Won Deals</h4>
              </div>
              <div className="divide-y divide-border">
                {lead.similar_deals.map((deal, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-jasper-carbon">{deal.deal_name}</h5>
                      <div className="flex items-center gap-3 text-sm text-jasper-slate mt-0.5">
                        <span>{deal.company}</span>
                        {deal.deal_size && <span>R{(deal.deal_size / 1000000).toFixed(1)}M</span>}
                        {deal.dfi && <span className="text-jasper-emerald">{deal.dfi}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-jasper-carbon">
                        {(deal.similarity_score * 100).toFixed(0)}% match
                      </div>
                      <span className={cn(
                        'badge text-xs mt-1',
                        deal.outcome === 'won' ? 'badge-success' : 'badge-neutral'
                      )}>
                        {deal.outcome === 'won' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Won
                          </>
                        ) : (
                          deal.outcome
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
