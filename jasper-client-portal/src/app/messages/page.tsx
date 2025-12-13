'use client'

import ComingSoon from '@/components/ComingSoon'
import { MessageSquare } from 'lucide-react'

export default function MessagesPage() {
  return (
    <ComingSoon
      title="Messages"
      description="Communicate directly with your JASPER team through secure, threaded conversations."
      icon={<MessageSquare className="w-10 h-10 text-jasper-emerald" />}
      features={[
        'Direct messaging with your project team',
        'File attachments and sharing',
        'Email notifications for new messages',
        'Message history and search',
        'Project-specific conversations',
      ]}
    />
  )
}
