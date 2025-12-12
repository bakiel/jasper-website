'use client'

import { Header } from '@/components/layout'
import { MessageCenter } from '@/components/messages'

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header title="Messages" subtitle="Communicate with clients" />
      <div className="p-6">
        <div className="h-[calc(100vh-140px)]">
          <MessageCenter />
        </div>
      </div>
    </div>
  )
}
