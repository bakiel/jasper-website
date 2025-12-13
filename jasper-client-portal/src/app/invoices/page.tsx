'use client'

import ComingSoon from '@/components/ComingSoon'
import { Receipt } from 'lucide-react'

export default function InvoicesPage() {
  return (
    <ComingSoon
      title="Invoices & Billing"
      description="View and manage your invoices, payment history, and billing information."
      icon={<Receipt className="w-10 h-10 text-jasper-emerald" />}
      features={[
        'View all invoices and payment status',
        'Download invoice PDFs',
        'Track payment history',
        'Multiple payment options',
        'Billing notifications',
      ]}
    />
  )
}
