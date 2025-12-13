'use client'

import ComingSoon from '@/components/ComingSoon'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="Manage your account, profile information, and notification preferences."
      icon={<Settings className="w-10 h-10 text-jasper-emerald" />}
      features={[
        'Update profile information',
        'Change password and security settings',
        'Manage notification preferences',
        'Link social accounts',
        'Update company details',
      ]}
    />
  )
}
