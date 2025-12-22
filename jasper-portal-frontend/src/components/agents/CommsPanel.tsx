'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Mail,
  Send,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Phone,
  Calendar,
  DollarSign,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

const CRM_API_URL = process.env.NEXT_PUBLIC_CRM_API_URL || 'http://127.0.0.1:8001'

interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
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

interface CommsPanelProps {
  lead: Lead
  messages: Message[]
  onMessageSent: (message: Message) => void
}

// Intent badge
function IntentBadge({ intent }: { intent: string }) {
  const intentConfig: Record<string, { icon: typeof HelpCircle; label: string; classes: string }> = {
    question: { icon: HelpCircle, label: 'Question', classes: 'bg-blue-100 text-blue-800' },
    pricing: { icon: DollarSign, label: 'Pricing', classes: 'bg-amber-100 text-amber-800' },
    schedule_call: { icon: Calendar, label: 'Schedule Call', classes: 'bg-purple-100 text-purple-800' },
    ready_to_buy: { icon: Check, label: 'Ready to Buy', classes: 'bg-green-100 text-green-800' },
    objection: { icon: AlertTriangle, label: 'Objection', classes: 'bg-red-100 text-red-800' },
  }

  const config = intentConfig[intent] || { icon: MessageSquare, label: intent, classes: 'bg-gray-100 text-gray-800' }
  const Icon = config.icon

  return (
    <span className={cn('badge text-xs flex items-center gap-1', config.classes)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

// Channel icon
function ChannelIcon({ channel }: { channel: string }) {
  if (channel === 'whatsapp') {
    return (
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
        <MessageSquare className="h-4 w-4 text-green-600" />
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
      <Mail className="h-4 w-4 text-gray-600" />
    </div>
  )
}

export function CommsPanel({ lead, messages, onMessageSent }: CommsPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp')
  const [copied, setCopied] = useState(false)

  const handleGenerateResponse = async () => {
    setIsGenerating(true)
    try {
      // Get the last inbound message for context
      const lastInboundMessage = messages.filter(m => m.direction === 'inbound').slice(-1)[0]
      const context = lastInboundMessage?.content || ''

      // Call jasper-crm Comms Agent API
      const response = await fetch(`${CRM_API_URL}/api/v1/agents/comms/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          channel: channel,
          context: context,
          lead_name: lead.name,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate response')
      }

      const result = await response.json()
      setGeneratedResponse(result.response || result.message || `Hi ${lead.name.split(' ')[0]},

Thank you for your interest in JASPER's financial modelling services.

Would you like me to prepare a detailed proposal with pricing options?

Best regards,
Bakiel`)
    } catch (error) {
      console.error('Failed to generate response:', error)
      // Fallback response
      setGeneratedResponse(`Hi ${lead.name.split(' ')[0]},

Thank you for reaching out. I'd be happy to assist you with your project.

Could you share more details about your requirements?

Best regards,
JASPER Team`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim()) return

    // Create new message
    const message: Message = {
      id: Date.now().toString(),
      channel,
      direction: 'outbound',
      content: newMessage,
      created_at: new Date().toISOString(),
    }

    onMessageSent(message)
    setNewMessage('')
    setGeneratedResponse(null)
  }

  const handleCopy = () => {
    if (generatedResponse) {
      navigator.clipboard.writeText(generatedResponse)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleUseGenerated = () => {
    if (generatedResponse) {
      setNewMessage(generatedResponse)
      setGeneratedResponse(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-jasper-carbon">Communication</h3>
          <p className="text-sm text-jasper-slate mt-0.5">
            {messages.length} messages in conversation
          </p>
        </div>

        <button
          onClick={handleGenerateResponse}
          disabled={isGenerating}
          className="btn-secondary"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Response
            </>
          )}
        </button>
      </div>

      {/* Generated Response Preview */}
      {generatedResponse && (
        <div className="bg-jasper-emerald/5 border border-jasper-emerald/20 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-jasper-emerald" />
              <span className="text-sm font-medium text-jasper-carbon">AI Generated Response</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded hover:bg-jasper-emerald/10 transition-colors"
                title="Copy"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-jasper-emerald" />
                ) : (
                  <Copy className="h-4 w-4 text-jasper-slate" />
                )}
              </button>
            </div>
          </div>
          <pre className="text-sm text-jasper-slate whitespace-pre-wrap font-sans">
            {generatedResponse}
          </pre>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleUseGenerated}
              className="btn-primary text-sm"
            >
              Use This Response
            </button>
            <button
              onClick={() => setGeneratedResponse(null)}
              className="btn-secondary text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Message Composer */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-surface-secondary px-4 py-2 flex items-center gap-4">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as 'whatsapp' | 'email')}
            className="input w-auto text-sm py-1.5"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
          </select>

          <span className="text-sm text-jasper-slate">
            to: {channel === 'whatsapp' ? lead.phone : lead.email}
          </span>
        </div>

        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="w-full p-4 text-sm text-jasper-carbon placeholder:text-jasper-slate-light focus:outline-none resize-none"
          rows={4}
        />

        <div className="px-4 py-3 bg-surface-secondary flex items-center justify-between">
          <span className="text-xs text-jasper-slate-light">
            Press Shift + Enter for new line
          </span>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="btn-primary text-sm"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </div>

      {/* Conversation History */}
      <div>
        <h4 className="text-sm font-medium text-jasper-carbon mb-4">Conversation History</h4>

        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-10 w-10 text-jasper-slate/50 mx-auto mb-3" />
            <p className="text-sm text-jasper-slate">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.direction === 'outbound' && 'flex-row-reverse'
                )}
              >
                <ChannelIcon channel={message.channel} />

                <div className={cn(
                  'flex-1 max-w-[80%]',
                  message.direction === 'outbound' && 'flex flex-col items-end'
                )}>
                  <div className={cn(
                    'rounded-lg p-4',
                    message.direction === 'inbound'
                      ? 'bg-surface-secondary'
                      : 'bg-jasper-emerald/10'
                  )}>
                    {message.subject && (
                      <p className="font-medium text-jasper-carbon text-sm mb-2">
                        {message.subject}
                      </p>
                    )}
                    <p className="text-sm text-jasper-slate whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-jasper-slate-light">
                      {formatDate(message.created_at)}
                    </span>
                    {message.intent && (
                      <IntentBadge intent={message.intent} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
