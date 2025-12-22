'use client'

import { useState } from 'react'
import {
  FileText,
  RefreshCw,
  Download,
  Printer,
  Sparkles,
  User,
  Building2,
  Target,
  DollarSign,
  MessageSquare,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Phone,
  Copy,
  Check,
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface Lead {
  id: string
  name: string
  company?: string
  role?: string
  phone?: string
  score: number
  tier: string
  project_description?: string
  project_type?: string
  deal_size?: number
  target_dfi?: string
  timeline?: string
  source: string
  research_status: string
  company_info?: any
  person_info?: any
  similar_deals?: SimilarDeal[]
  bant: BANTQualification
  has_call_scheduled: boolean
  next_call_at?: string
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

interface CallBrief {
  generated_at: string
  quick_facts: Record<string, string>
  company_intel?: string
  person_intel?: string
  dfi_requirements?: string
  conversation_summary?: string
  similar_deals: SimilarDeal[]
  pricing_context?: string
  suggested_questions: string[]
  objection_handlers: Record<string, string>
  key_points: string[]
}

interface CallBriefPanelProps {
  lead: Lead
}

export function CallBriefPanel({ lead }: CallBriefPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [brief, setBrief] = useState<CallBrief | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleGenerateBrief = async () => {
    setIsGenerating(true)
    try {
      // TODO: Replace with actual API call
      // const result = await callCoachApi.generateBrief(lead.id)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock generated brief
      const mockBrief: CallBrief = {
        generated_at: new Date().toISOString(),
        quick_facts: {
          name: lead.name,
          company: lead.company || 'Unknown',
          role: lead.role || 'Unknown',
          score: `${lead.score} (${lead.tier})`,
          source: lead.source,
          project_type: lead.project_type || 'Unknown',
          deal_size: lead.deal_size ? `R${(lead.deal_size / 1000000).toFixed(1)}M` : 'Not specified',
          target_dfi: lead.target_dfi || 'Not specified',
        },
        company_intel: lead.company_info?.description || 'Solar Power Ghana is a leading renewable energy developer in West Africa with 120MW of operational capacity. They have a strong track record with international DFIs and are well-positioned in the Ghanaian energy market.',
        person_intel: lead.person_info?.bio || 'John Mensah is an experienced CFO with 15 years in project finance. Previously at Standard Bank, he has deep understanding of DFI requirements and financial modelling standards.',
        dfi_requirements: lead.target_dfi === 'IFC' ? `IFC Financial Model Requirements:
• Model must follow FAST Standard
• DSCR minimum 1.35x (recommended 1.5x)
• IRR calculation with sensitivity analysis
• Full audit trail and documentation
• 20-year projection period typical for solar
• Currency risk analysis required` : undefined,
        conversation_summary: `Previous engagement summary:
• Initial inquiry via website on 10 Dec
• Good first call on 12 Dec - confirmed project scope
• Has requested pricing information
• Timeline: Need model by Feb 2026 for IFC submission`,
        similar_deals: lead.similar_deals || [],
        pricing_context: `Recommended package: Pro ($65K-$85K)
Based on:
- 50MW solar project (standard complexity)
- IFC financing (requires additional compliance)
- Q1 deadline (achievable timeline)

Similar project (Senegal Solar) was $72K
May negotiate to $60K with reduced scope`,
        suggested_questions: [
          'Have you started discussions with IFC yet? Do you have a loan officer assigned?',
          'What\'s your target debt-to-equity ratio for this project?',
          'Are there any local content requirements we should factor into the model?',
          'Who else is involved in the financing decision besides yourself?',
          'What\'s your ideal timeline for receiving the first draft?',
        ],
        objection_handlers: {
          'Your price is too high': 'Our models have a 95% first-time DFI approval rate. A model rejected for errors costs you 3-6 months and damages your credibility. We\'ve worked with IFC on 15+ projects - we know exactly what they need.',
          'We need more time to decide': 'I understand. However, given your Feb deadline, starting now gives us buffer for revisions. IFC review alone takes 4-6 weeks. What specific concerns can I address to help you decide?',
          'Can you guarantee IFC approval?': 'We can\'t guarantee approval as that depends on project fundamentals, but we guarantee our model will meet all IFC technical requirements. Our track record: 23 of 24 models approved on first submission.',
        },
        key_points: [
          'Emphasise JASPER\'s IFC track record (15+ approved projects)',
          'Mention similar Senegal Solar project - same size, same DFI',
          'Highlight Feb 2026 deadline risk - need to start soon',
          'CFO background at Standard Bank - speak his language',
          'Project has completed feasibility and EIA - ready to move',
        ],
      }

      setBrief(mockBrief)
    } catch (error) {
      console.error('Failed to generate brief:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-jasper-carbon">Call Brief</h3>
          <p className="text-sm text-jasper-slate mt-0.5">
            {brief ? `Generated ${formatDate(brief.generated_at)}` : 'Generate a brief for your next call'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {brief && (
            <>
              <button onClick={handlePrint} className="btn-ghost text-sm">
                <Printer className="h-4 w-4" />
              </button>
              <button className="btn-ghost text-sm">
                <Download className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={handleGenerateBrief}
            disabled={isGenerating}
            className="btn-primary"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {brief ? 'Regenerate' : 'Generate Brief'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generating State */}
      {isGenerating && (
        <div className="bg-jasper-emerald/5 border border-jasper-emerald/20 rounded-lg p-6 text-center">
          <RefreshCw className="h-8 w-8 text-jasper-emerald animate-spin mx-auto mb-4" />
          <h4 className="font-medium text-jasper-carbon mb-1">Generating Call Brief</h4>
          <p className="text-sm text-jasper-slate">
            Analysing lead data, DFI requirements, and conversation history...
          </p>
        </div>
      )}

      {/* No Brief State */}
      {!brief && !isGenerating && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-jasper-slate/50 mx-auto mb-4" />
          <h4 className="font-medium text-jasper-carbon mb-2">No call brief yet</h4>
          <p className="text-sm text-jasper-slate max-w-md mx-auto">
            Generate a call brief to get DFI requirements, suggested questions,
            objection handlers, and key talking points for your next call.
          </p>
        </div>
      )}

      {/* Brief Content */}
      {brief && !isGenerating && (
        <div className="space-y-6 print:space-y-4">
          {/* Quick Facts */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-surface-secondary px-4 py-3 flex items-center gap-2">
              <User className="h-4 w-4 text-jasper-emerald" />
              <h4 className="font-medium text-jasper-carbon">Quick Facts</h4>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {Object.entries(brief.quick_facts).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-jasper-slate-light capitalize">{key.replace('_', ' ')}</span>
                    <p className="font-medium text-jasper-carbon">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Company Intel */}
          {brief.company_intel && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-surface-secondary px-4 py-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-jasper-emerald" />
                <h4 className="font-medium text-jasper-carbon">Company Intel</h4>
              </div>
              <div className="p-4">
                <p className="text-sm text-jasper-slate whitespace-pre-wrap">{brief.company_intel}</p>
              </div>
            </div>
          )}

          {/* DFI Requirements */}
          {brief.dfi_requirements && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-surface-secondary px-4 py-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-jasper-emerald" />
                <h4 className="font-medium text-jasper-carbon">DFI Requirements ({lead.target_dfi})</h4>
              </div>
              <div className="p-4">
                <pre className="text-sm text-jasper-slate whitespace-pre-wrap font-sans">{brief.dfi_requirements}</pre>
              </div>
            </div>
          )}

          {/* Conversation Summary */}
          {brief.conversation_summary && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-surface-secondary px-4 py-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-jasper-emerald" />
                <h4 className="font-medium text-jasper-carbon">Conversation Summary</h4>
              </div>
              <div className="p-4">
                <pre className="text-sm text-jasper-slate whitespace-pre-wrap font-sans">{brief.conversation_summary}</pre>
              </div>
            </div>
          )}

          {/* Pricing Context */}
          {brief.pricing_context && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-surface-secondary px-4 py-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-jasper-emerald" />
                <h4 className="font-medium text-jasper-carbon">Pricing Context</h4>
              </div>
              <div className="p-4">
                <pre className="text-sm text-jasper-slate whitespace-pre-wrap font-sans">{brief.pricing_context}</pre>
              </div>
            </div>
          )}

          {/* Suggested Questions */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-surface-secondary px-4 py-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-jasper-emerald" />
              <h4 className="font-medium text-jasper-carbon">Suggested Questions</h4>
            </div>
            <div className="p-4">
              <ul className="space-y-3">
                {brief.suggested_questions.map((question, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-jasper-emerald/10 flex items-center justify-center text-xs font-medium text-jasper-emerald">
                      {index + 1}
                    </span>
                    <span className="text-sm text-jasper-slate">{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Objection Handlers */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-surface-secondary px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-jasper-emerald" />
              <h4 className="font-medium text-jasper-carbon">Objection Handlers</h4>
            </div>
            <div className="divide-y divide-border">
              {Object.entries(brief.objection_handlers).map(([objection, response], index) => (
                <div key={index} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-jasper-carbon text-sm">"{objection}"</h5>
                    <button
                      onClick={() => handleCopy(response, `objection-${index}`)}
                      className="p-1 rounded hover:bg-surface-secondary transition-colors"
                      title="Copy response"
                    >
                      {copied === `objection-${index}` ? (
                        <Check className="h-4 w-4 text-jasper-emerald" />
                      ) : (
                        <Copy className="h-4 w-4 text-jasper-slate" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-jasper-slate">{response}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Points */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-surface-secondary px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-jasper-emerald" />
              <h4 className="font-medium text-jasper-carbon">Key Points to Highlight</h4>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {brief.key_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-jasper-slate">
                    <CheckCircle2 className="h-4 w-4 text-jasper-emerald flex-shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Call Scheduled Info */}
          {lead.has_call_scheduled && lead.next_call_at && (
            <div className="bg-jasper-emerald/5 border border-jasper-emerald/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-jasper-emerald/10">
                  <Calendar className="h-5 w-5 text-jasper-emerald" />
                </div>
                <div>
                  <h4 className="font-medium text-jasper-carbon">Call Scheduled</h4>
                  <p className="text-sm text-jasper-slate">{formatDate(lead.next_call_at)}</p>
                </div>
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="ml-auto btn-primary text-sm">
                    <Phone className="h-4 w-4" />
                    Call Now
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
