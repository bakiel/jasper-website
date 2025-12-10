'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Send,
  ChevronLeft,
  Clock,
  Check,
  CheckCheck,
  User,
  Building2,
  Loader2,
  X,
  Reply,
} from 'lucide-react'
import { messagesApi, MessageData, ThreadData, MessageCreateData } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface MessageCenterProps {
  companyId?: number
  companyName?: string
  projectId?: number
  onClose?: () => void
}

export function MessageCenter({ companyId, companyName, projectId, onClose }: MessageCenterProps) {
  const { user } = useAuth()
  const [threads, setThreads] = useState<ThreadData[]>([])
  const [selectedThread, setSelectedThread] = useState<ThreadData | null>(null)
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [replyTo, setReplyTo] = useState<MessageData | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load threads or messages based on props
  useEffect(() => {
    if (companyId) {
      // Direct company view - skip thread list
      setSelectedThread({
        company_id: companyId,
        company_name: companyName || 'Client',
        project_id: projectId || null,
        project_name: null,
        last_message: null,
        message_count: 0,
        unread_count: 0,
      })
      fetchMessages(companyId, projectId)
    } else {
      fetchThreads()
    }
  }, [companyId, projectId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchThreads = async () => {
    setLoading(true)
    try {
      const data = await messagesApi.getThreads()
      setThreads(data.threads)
    } catch (error) {
      console.error('Failed to fetch threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (cId: number, pId?: number) => {
    setLoading(true)
    try {
      const data = await messagesApi.getCompanyMessages(cId, pId)
      setMessages(data.messages.reverse()) // Oldest first for chat view
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectThread = (thread: ThreadData) => {
    setSelectedThread(thread)
    fetchMessages(thread.company_id, thread.project_id || undefined)
  }

  const handleBackToThreads = () => {
    setSelectedThread(null)
    setMessages([])
    setNewMessage('')
    setSubject('')
    setReplyTo(null)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return

    setSending(true)
    try {
      const senderName = user ? `${user.first_name} ${user.last_name}` : 'Admin'
      const senderId = user?.id || 1

      const messageData: MessageCreateData = {
        company_id: selectedThread.company_id,
        project_id: selectedThread.project_id || undefined,
        content: newMessage.trim(),
        subject: subject.trim() || undefined,
        parent_id: replyTo?.id,
      }

      const sent = await messagesApi.send(messageData, senderName, senderId)
      setMessages((prev) => [...prev, sent])
      setNewMessage('')
      setSubject('')
      setReplyTo(null)
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Thread List View
  if (!selectedThread && !companyId) {
    return (
      <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-border overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-jasper-emerald" />
            <h2 className="font-semibold text-jasper-carbon">Messages</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-surface-secondary rounded">
              <X className="w-5 h-5 text-jasper-slate" />
            </button>
          )}
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-jasper-emerald animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-jasper-slate">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No conversations yet</p>
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.company_id}
                onClick={() => handleSelectThread(thread)}
                className="w-full p-4 border-b border-border hover:bg-surface-secondary transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-jasper-emerald/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-jasper-emerald" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-jasper-carbon truncate">
                        {thread.company_name}
                      </span>
                      {thread.last_message && (
                        <span className="text-xs text-jasper-slate">
                          {formatMessageTime(thread.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    {thread.last_message && (
                      <p className="text-sm text-jasper-slate truncate mt-1">
                        {thread.last_message.sender_type === 'admin' && 'You: '}
                        {thread.last_message.content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-jasper-slate">
                        {thread.message_count} message{thread.message_count !== 1 ? 's' : ''}
                      </span>
                      {thread.unread_count > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-jasper-emerald text-white rounded-full">
                          {thread.unread_count} new
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // Message View
  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        {!companyId && (
          <button
            onClick={handleBackToThreads}
            className="p-1 hover:bg-surface-secondary rounded"
          >
            <ChevronLeft className="w-5 h-5 text-jasper-slate" />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-jasper-emerald/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-jasper-emerald" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-jasper-carbon">{selectedThread?.company_name}</h2>
          <p className="text-xs text-jasper-slate">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-surface-secondary rounded">
            <X className="w-5 h-5 text-jasper-slate" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-jasper-emerald animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-jasper-slate">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No messages yet</p>
            <p className="text-sm mt-1">Send the first message below</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.sender_type === 'admin' ? 'flex-row-reverse' : ''
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  msg.sender_type === 'admin'
                    ? 'bg-jasper-emerald text-white'
                    : 'bg-surface-secondary text-jasper-slate'
                )}
              >
                {msg.sender_type === 'admin' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Building2 className="w-4 h-4" />
                )}
              </div>
              <div
                className={cn(
                  'max-w-[70%] rounded-lg p-3',
                  msg.sender_type === 'admin'
                    ? 'bg-jasper-emerald text-white'
                    : 'bg-surface-secondary text-jasper-carbon'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium opacity-80">{msg.sender_name}</span>
                  <span className="text-xs opacity-60">{formatMessageTime(msg.created_at)}</span>
                </div>
                {msg.subject && (
                  <p className="font-medium text-sm mb-1">{msg.subject}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.sender_type === 'admin' && (
                  <div className="flex items-center justify-end gap-1 mt-1 text-xs opacity-60">
                    {msg.is_read ? (
                      <CheckCheck className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-surface-secondary border-t border-border flex items-center gap-2">
          <Reply className="w-4 h-4 text-jasper-slate" />
          <span className="text-sm text-jasper-slate truncate flex-1">
            Replying to: {replyTo.content.substring(0, 50)}...
          </span>
          <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-surface-tertiary rounded">
            <X className="w-4 h-4 text-jasper-slate" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border space-y-2">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (optional)"
          className="input w-full text-sm"
        />
        <div className="flex items-end gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={2}
            className="input flex-1 resize-none"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="btn-primary p-3 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
