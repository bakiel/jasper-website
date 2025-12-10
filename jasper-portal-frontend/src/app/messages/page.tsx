'use client'

import { Sidebar, Header } from '@/components/layout'
import { MessageCenter } from '@/components/messages'

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <Sidebar />
      <main className="pl-64 transition-all duration-300">
        <Header title="Messages" subtitle="Communicate with clients" />
        <div className="p-6">
          <div className="h-[calc(100vh-140px)]">
            <MessageCenter />
          </div>
        </div>
      </main>
    </div>
  )
}
