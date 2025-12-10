'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout'
import {
  TrendingUp,
  TrendingDown,
  FolderKanban,
  FileText,
  DollarSign,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { formatCurrency, formatDate, formatStage, getStageColor, cn } from '@/lib/utils'
import { dashboardApi, projectsApi, invoicesApi } from '@/lib/api'
import Link from 'next/link'

interface DashboardData {
  total_clients: number
  active_projects: number
  pipeline_summary: Record<string, number>
  revenue_this_month: number
  pending_payments: number
  recent_inquiries: Array<{
    id: number
    name: string
    status: string
    created_at: string
  }>
}

interface Project {
  id: number
  reference: string
  name: string
  stage: string
  progress_percent: number
  company_id: number
  value: number
  currency: string
  target_completion?: string
}

interface Invoice {
  id: number
  invoice_number: string
  status: string
  total: number
  currency: string
  due_date: string
  company_id: number
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardData, projectsData, invoicesData] = await Promise.all([
          dashboardApi.getMetrics(),
          projectsApi.list({ page_size: 5 }),
          invoicesApi.list({ status: 'sent', page_size: 5 }),
        ])
        setDashboard(dashboardData)
        setRecentProjects(projectsData.projects || [])
        setPendingInvoices(invoicesData.invoices || [])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-jasper-slate">Loading dashboard...</div>
      </div>
    )
  }

  // Convert pipeline_summary object to array for display
  const pipelineStages = dashboard?.pipeline_summary
    ? Object.entries(dashboard.pipeline_summary)
        .filter(([_, count]) => count > 0)
        .map(([stage, count]) => ({ stage, count, value: 0 }))
    : []

  const totalClients = dashboard?.total_clients || 0
  const activeProjects = dashboard?.active_projects || 0
  const revenueThisMonth = dashboard?.revenue_this_month || 0
  const pendingPayments = dashboard?.pending_payments || 0

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header title="Dashboard" subtitle="Welcome back! Here's your business overview." />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Projects"
            value={activeProjects}
            icon={FolderKanban}
            color="emerald"
          />
          <StatCard
            title="Total Clients"
            value={totalClients}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Revenue This Month"
            value={formatCurrency(revenueThisMonth * 100, 'USD')}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Pending Payments"
            value={formatCurrency(pendingPayments * 100, 'USD')}
            icon={FileText}
            color="amber"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Overview */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-semibold text-jasper-carbon">Pipeline Overview</h2>
                <Link href="/projects" className="text-sm text-jasper-emerald hover:text-jasper-emerald-dark flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {pipelineStages.map((stage) => (
                    <PipelineStageRow
                      key={stage.stage}
                      stage={stage.stage}
                      count={stage.count}
                      value={stage.value}
                    />
                  ))}
                  {pipelineStages.length === 0 && (
                    <p className="text-sm text-jasper-slate text-center py-4">No projects in pipeline</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Recent Inquiries */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-jasper-carbon">Recent Inquiries</h3>
              </div>
              <div className="divide-y divide-border">
                {dashboard?.recent_inquiries?.slice(0, 4).map((inquiry) => (
                  <div key={inquiry.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-jasper-carbon text-sm">{inquiry.name}</p>
                      <p className="text-xs text-jasper-slate">{formatDate(inquiry.created_at)}</p>
                    </div>
                    <span className="badge badge-info text-xs">{inquiry.status}</span>
                  </div>
                ))}
                {(!dashboard?.recent_inquiries || dashboard.recent_inquiries.length === 0) && (
                  <p className="text-sm text-jasper-slate text-center py-4">No recent inquiries</p>
                )}
              </div>
            </div>

            {/* Outstanding Balance */}
            <div className="card bg-gradient-to-br from-jasper-navy to-jasper-graphite text-white">
              <div className="card-body">
                <p className="text-sm text-gray-300 mb-1">Pending Payments</p>
                <p className="text-2xl font-bold">{formatCurrency(pendingPayments * 100, 'USD')}</p>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <Link href="/invoices" className="text-sm text-jasper-emerald-light hover:text-white flex items-center gap-1">
                    View pending invoices <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects & Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-jasper-carbon">Recent Projects</h2>
              <Link href="/projects" className="text-sm text-jasper-emerald hover:text-jasper-emerald-dark">
                View all
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between p-4 hover:bg-surface-secondary transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-jasper-slate">{project.reference}</span>
                      <span className={cn('badge', getStageColor(project.stage))}>
                        {formatStage(project.stage)}
                      </span>
                    </div>
                    <p className="font-medium text-jasper-carbon truncate">{project.name}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-medium text-jasper-carbon">
                      {formatCurrency(project.value, project.currency)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-jasper-slate">
                      <div className="w-16 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-jasper-emerald rounded-full"
                          style={{ width: `${project.progress_percent}%` }}
                        />
                      </div>
                      <span>{project.progress_percent}%</span>
                    </div>
                  </div>
                </Link>
              ))}
              {recentProjects.length === 0 && (
                <p className="text-sm text-jasper-slate text-center py-8">No recent projects</p>
              )}
            </div>
          </div>

          {/* Pending Invoices */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-jasper-carbon">Pending Invoices</h2>
              <Link href="/invoices" className="text-sm text-jasper-emerald hover:text-jasper-emerald-dark">
                View all
              </Link>
            </div>
            <div className="divide-y divide-border">
              {pendingInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-4 hover:bg-surface-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      invoice.status === 'overdue' ? 'bg-red-100' : 'bg-amber-100'
                    )}>
                      {invoice.status === 'overdue' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-jasper-carbon">{invoice.invoice_number}</p>
                      <p className="text-sm text-jasper-slate">Due {formatDate(invoice.due_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-jasper-carbon">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </p>
                    <span className={cn(
                      'badge',
                      invoice.status === 'overdue' ? 'badge-error' : 'badge-warning'
                    )}>
                      {invoice.status}
                    </span>
                  </div>
                </Link>
              ))}
              {pendingInvoices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-jasper-emerald mb-2" />
                  <p className="text-sm text-jasper-slate">All invoices are paid!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'emerald',
}: {
  title: string
  value: string | number
  icon: any
  trend?: { value: number; positive: boolean }
  color?: 'emerald' | 'amber' | 'blue' | 'purple'
}) {
  const colorClasses = {
    emerald: 'bg-jasper-emerald/10 text-jasper-emerald',
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="card card-hover p-6">
      <div className="flex items-start justify-between">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend.positive ? 'text-status-success' : 'text-status-error'
          )}>
            {trend.positive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-jasper-slate">{title}</p>
        <p className="text-2xl font-semibold text-jasper-carbon mt-1">{value}</p>
      </div>
    </div>
  )
}

// Pipeline Stage Row Component
function PipelineStageRow({
  stage,
  count,
  value,
}: {
  stage: string
  count: number
  value: number
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-24">
        <span className={cn('badge', getStageColor(stage))}>
          {formatStage(stage)}
        </span>
      </div>
      <div className="flex-1">
        <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-jasper-emerald rounded-full transition-all duration-500"
            style={{ width: `${Math.min((count / 10) * 100, 100)}%` }}
          />
        </div>
      </div>
      <div className="w-16 text-right">
        <span className="text-sm font-medium text-jasper-carbon">{count}</span>
      </div>
      <div className="w-24 text-right">
        <span className="text-sm text-jasper-slate">{formatCurrency(value, 'USD')}</span>
      </div>
    </div>
  )
}
