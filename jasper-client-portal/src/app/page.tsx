'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import Image from 'next/image'
import OnboardingWelcome from '@/components/OnboardingWelcome'
import {
  clientProjectsApi,
  clientDashboardApi,
  clientProfileApi,
  Project,
  Activity,
} from '@/lib/api'
import { sanitizeText } from '@/lib/sanitize'
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  MessageSquare,
  Receipt,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  TrendingUp,
  Calendar,
  Search,
  Plus,
  Inbox,
} from 'lucide-react'

const statusConfig = {
  intake: { label: 'Intake', color: 'stage-intake', icon: Clock },
  scoping: { label: 'Scoping', color: 'stage-scoping', icon: Clock },
  active: { label: 'In Progress', color: 'stage-active', icon: TrendingUp },
  review: { label: 'Under Review', color: 'stage-review', icon: AlertCircle },
  complete: { label: 'Complete', color: 'stage-complete', icon: CheckCircle2 },
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
}

// Map activity to display format with XSS sanitization
function mapActivity(activity: Activity): { message: string; time: string; type: string } {
  const typeMap: Record<string, string> = {
    document: 'document',
    message: 'message',
    project: 'milestone',
    milestone: 'milestone',
  }
  // Sanitize user-generated content to prevent XSS
  const rawMessage = activity.details || `${activity.action} on ${activity.entity_type}`
  return {
    message: sanitizeText(rawMessage),
    time: formatDate(activity.created_at),
    type: typeMap[activity.entity_type] || 'milestone',
  }
}

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState({
    activeProjects: 0,
    unreadMessages: 0,
    documents: 0,
    nextMilestone: null as string | null,
  })
  const [dataLoading, setDataLoading] = useState(true)

  // Fetch dashboard data from API
  const fetchDashboardData = useCallback(async () => {
    if (!user) return

    setDataLoading(true)
    try {
      // Fetch all data in parallel
      const [projectsResponse, statsResponse, activityResponse] = await Promise.allSettled([
        clientProjectsApi.list({ page: 1, page_size: 5 }),
        clientDashboardApi.getStats(),
        clientDashboardApi.getActivity(5),
      ])

      // Process projects
      if (projectsResponse.status === 'fulfilled') {
        setProjects(projectsResponse.value.projects || [])
      }

      // Process stats
      if (statsResponse.status === 'fulfilled') {
        const s = statsResponse.value
        setStats({
          activeProjects: s.active_projects || 0,
          unreadMessages: s.unread_messages || 0,
          documents: s.documents_count || 0,
          nextMilestone: null, // Will be fetched from milestones endpoint
        })
      }

      // Process activities
      if (activityResponse.status === 'fulfilled') {
        setActivities(activityResponse.value.activities || [])
      }

      // Fetch upcoming milestones for next milestone display
      try {
        const milestonesResponse = await clientDashboardApi.getUpcomingMilestones()
        if (milestonesResponse.milestones && milestonesResponse.milestones.length > 0) {
          const nextMilestone = milestonesResponse.milestones[0]
          setStats(prev => ({
            ...prev,
            nextMilestone: nextMilestone.name,
          }))
        }
      } catch {
        // Silently handle milestone fetch error
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setDataLoading(false)
    }
  }, [user])

  // Fetch data when user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      fetchDashboardData()
    }
  }, [user, isLoading, fetchDashboardData])

  // Check if user needs onboarding
  useEffect(() => {
    if (user && !user.onboarding_completed) {
      // Check localStorage as fallback
      const onboardingDone = localStorage.getItem('jasper_onboarding_completed')
      if (!onboardingDone) {
        setShowOnboarding(true)
      }
    }
  }, [user])

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false)
    localStorage.setItem('jasper_onboarding_completed', 'true')
    // Update user profile via API to mark onboarding complete
    try {
      await clientProfileApi.completeOnboarding()
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  if (isLoading || (user && dataLoading && projects.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-jasper-emerald animate-spin" />
          <span className="text-jasper-slate text-sm">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Auth context will redirect
  }

  const firstName = user.name?.split(' ')[0] || 'there'
  const hasProjects = projects.length > 0
  const hasActivities = activities.length > 0

  return (
    <>
      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingWelcome
          userName={firstName}
          onComplete={handleOnboardingComplete}
        />
      )}

      <div className="min-h-screen bg-surface-primary">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface-secondary border-r border-border flex flex-col z-40">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Image
                src="/images/jasper-icon.png"
                alt="JASPER"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div>
                <span className="font-semibold text-jasper-carbon tracking-tight">JASPER</span>
                <p className="text-jasper-slate-light text-xs">Client Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <a href="/" className="nav-item nav-item-active">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </a>
            <a href="/projects" className="nav-item">
              <FolderKanban className="w-5 h-5" />
              My Projects
              {stats.activeProjects > 0 && (
                <span className="ml-auto text-xs text-jasper-slate">{stats.activeProjects}</span>
              )}
            </a>
            <a href="/documents" className="nav-item">
              <FileText className="w-5 h-5" />
              Documents
              {stats.documents > 0 && (
                <span className="ml-auto text-xs text-jasper-slate">{stats.documents}</span>
              )}
            </a>
            <a href="/messages" className="nav-item">
              <MessageSquare className="w-5 h-5" />
              Messages
              {stats.unreadMessages > 0 && (
                <span className="ml-auto bg-jasper-emerald text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.unreadMessages}
                </span>
              )}
            </a>
            <a href="/invoices" className="nav-item">
              <Receipt className="w-5 h-5" />
              Invoices
            </a>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-jasper-emerald/20 flex items-center justify-center">
                <span className="text-jasper-emerald font-medium">
                  {user.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-jasper-carbon truncate">{user.name}</p>
                <p className="text-xs text-jasper-slate truncate">{user.company || user.email}</p>
              </div>
            </div>

            <div className="space-y-1">
              <a href="/settings" className="nav-item">
                <Settings className="w-5 h-5" />
                Settings
              </a>
              <button onClick={logout} className="nav-item w-full text-left hover:text-red-400 hover:bg-red-500/10">
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="ml-64">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-surface-primary/80 backdrop-blur-xl border-b border-border">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-jasper-carbon">Dashboard</h1>
                  <p className="text-jasper-slate text-sm mt-0.5">Welcome back, {firstName}!</p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Search */}
                  <button className="flex items-center gap-2 px-4 py-2 bg-surface-secondary border border-border rounded-lg text-jasper-slate text-sm hover:border-jasper-emerald/50 transition-colors">
                    <Search className="w-4 h-4" />
                    <span>Search...</span>
                    <kbd className="ml-2 px-1.5 py-0.5 bg-surface-tertiary rounded text-xs">⌘K</kbd>
                  </button>

                  {/* Notifications */}
                  <button className="relative p-2 text-jasper-slate hover:text-jasper-carbon hover:bg-surface-secondary rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    {stats.unreadMessages > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-jasper-emerald rounded-full" />
                    )}
                  </button>

                  {/* User Menu */}
                  <button className="flex items-center gap-2 p-2 hover:bg-surface-secondary rounded-lg transition-colors">
                    <div className="w-8 h-8 rounded-full bg-jasper-emerald/20 flex items-center justify-center">
                      <span className="text-jasper-emerald font-medium text-sm">
                        {user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="stat-card">
                <div className="stat-icon bg-jasper-emerald/20">
                  <FolderKanban className="w-6 h-6 text-jasper-emerald" />
                </div>
                <div>
                  <p className="stat-label">Active Projects</p>
                  <p className="stat-value">{stats.activeProjects}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon bg-blue-500/20">
                  <MessageSquare className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="stat-label">Unread Messages</p>
                  <p className="stat-value">{stats.unreadMessages}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon bg-purple-500/20">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="stat-label">Documents</p>
                  <p className="stat-value">{stats.documents}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon bg-yellow-500/20">
                  <Calendar className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="stat-label">Next Milestone</p>
                  <p className="stat-value text-lg">{stats.nextMilestone || '—'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Projects */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="card-header flex items-center justify-between">
                    <h2 className="font-semibold text-jasper-carbon">Your Projects</h2>
                    {hasProjects && (
                      <a href="/projects" className="text-sm text-jasper-emerald hover:underline flex items-center gap-1">
                        View all <ChevronRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {hasProjects ? (
                    <div className="divide-y divide-border">
                      {projects.map(project => {
                        const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.active
                        const StatusIcon = status.icon
                        return (
                          <a
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="flex items-center gap-4 p-5 hover:bg-surface-tertiary/50 transition-colors group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-jasper-slate font-mono">{project.reference}</span>
                                <span className={`badge ${status.color}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {status.label}
                                </span>
                              </div>
                              <h3 className="font-medium text-jasper-carbon truncate">{project.name}</h3>
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex-1 progress-bar max-w-xs">
                                  <div
                                    className="progress-fill"
                                    style={{ width: `${project.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-jasper-slate">{project.progress}%</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-jasper-slate-light">Updated</p>
                              <p className="text-sm text-jasper-slate">{formatDate(project.updated_at || project.created_at)}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-jasper-slate-light group-hover:text-jasper-emerald transition-colors" />
                          </a>
                        )
                      })}
                    </div>
                  ) : (
                    /* Empty State */
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center mx-auto mb-4">
                        <Inbox className="w-8 h-8 text-jasper-slate-light" />
                      </div>
                      <h3 className="text-lg font-medium text-jasper-carbon mb-2">No Projects Yet</h3>
                      <p className="text-jasper-slate text-sm mb-6 max-w-sm mx-auto">
                        Once your project begins, you&apos;ll see it here with real-time progress updates and deliverables.
                      </p>
                      <a
                        href="https://jasperfinance.org/contact"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-jasper-emerald hover:bg-jasper-emerald-dark text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Start a Project
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="font-semibold text-jasper-carbon">Recent Activity</h2>
                  </div>

                  {hasActivities ? (
                    <div className="divide-y divide-border">
                      {activities.map(activity => {
                        const displayActivity = mapActivity(activity)
                        return (
                          <div key={activity.id} className="p-4 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-jasper-emerald/15 flex items-center justify-center flex-shrink-0">
                              {displayActivity.type === 'document' && <FileText className="w-4 h-4 text-jasper-emerald" />}
                              {displayActivity.type === 'message' && <MessageSquare className="w-4 h-4 text-jasper-emerald" />}
                              {displayActivity.type === 'milestone' && <CheckCircle2 className="w-4 h-4 text-jasper-emerald" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-jasper-carbon">{displayActivity.message}</p>
                              <p className="text-xs text-jasper-slate-light mt-1">{displayActivity.time}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Clock className="w-8 h-8 text-jasper-slate-light mx-auto mb-3" />
                      <p className="text-sm text-jasper-slate">No recent activity</p>
                      <p className="text-xs text-jasper-slate-light mt-1">
                        Updates will appear here as your project progresses
                      </p>
                    </div>
                  )}
                </div>

                {/* Getting Started Guide */}
                <div className="card p-5 bg-gradient-to-br from-jasper-emerald/10 to-jasper-emerald/5 border-jasper-emerald/20">
                  <h4 className="font-medium text-jasper-carbon text-sm mb-3">Getting Started</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-jasper-emerald/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-jasper-emerald" />
                      </div>
                      <span className="text-xs text-jasper-slate">Account created and verified</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-jasper-slate-light">2</span>
                      </div>
                      <span className="text-xs text-jasper-slate">Complete your profile settings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-jasper-slate-light">3</span>
                      </div>
                      <span className="text-xs text-jasper-slate">Wait for your project to be assigned</span>
                    </li>
                  </ul>
                </div>

                {/* Help Card */}
                <div className="card p-5">
                  <h4 className="font-medium text-jasper-carbon text-sm">Need Help?</h4>
                  <p className="text-xs text-jasper-slate mt-1 mb-4">
                    Our team is here to assist you with any questions about your projects.
                  </p>
                  <div className="space-y-2">
                    <a
                      href="mailto:support@jasperfinance.org"
                      className="flex items-center gap-2 text-xs text-jasper-emerald font-medium hover:underline"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Contact Support
                    </a>
                    <a
                      href="https://jasperfinance.org/faq"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-jasper-emerald font-medium hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Visit Help Centre
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
