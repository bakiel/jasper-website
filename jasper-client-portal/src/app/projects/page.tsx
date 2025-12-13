'use client'

import ComingSoon from '@/components/ComingSoon'
import { FolderKanban } from 'lucide-react'

export default function ProjectsPage() {
  return (
    <ComingSoon
      title="My Projects"
      description="Track all your financial modelling projects in one place with real-time status updates."
      icon={<FolderKanban className="w-10 h-10 text-jasper-emerald" />}
      features={[
        'View all active and completed projects',
        'Track milestones and deliverables',
        'See real-time progress updates',
        'Access project documentation',
        'Communicate with your project team',
      ]}
    />
  )
}
