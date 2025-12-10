'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout'
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { formatCurrency, formatDate, formatStage, formatPackage, getStageColor, cn } from '@/lib/utils'
import { useProjects } from '@/hooks/use-queries'

interface Project {
  id: number
  reference: string
  name: string
  company_id: number
  stage: string
  package: string
  value: number
  currency: string
  progress_percent: number
  target_completion?: string
  inquiry_date: string
  created_at: string
}

const stageFilters = [
  { value: '', label: 'All Stages' },
  { value: 'inquiry', label: 'Inquiry' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'contracted', label: 'Contracted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
]

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [page, setPage] = useState(1)

  // Use React Query for data fetching with automatic caching
  const { data, isLoading: loading, error } = useProjects({
    page,
    page_size: 20,
    stage: stageFilter || undefined,
  })

  const projects: Project[] = data?.projects || []
  const total = data?.total || 0

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.reference.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header title="Projects" subtitle={`${total} total projects in your pipeline`} />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jasper-slate-light" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-64"
              />
            </div>

            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="input w-40"
            >
              {stageFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Projects Table */}
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Project Name</th>
                  <th>Stage</th>
                  <th>Package</th>
                  <th>Value</th>
                  <th>Progress</th>
                  <th>Target Date</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-jasper-slate">
                      Loading projects...
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-jasper-slate">
                      No projects found
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="group">
                      <td>
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-mono text-sm text-jasper-emerald hover:text-jasper-emerald-dark"
                        >
                          {project.reference}
                        </Link>
                      </td>
                      <td>
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium text-jasper-carbon hover:text-jasper-emerald transition-colors"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td>
                        <span className={cn('badge', getStageColor(project.stage))}>
                          {formatStage(project.stage)}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-jasper-slate">
                          {formatPackage(project.package)}
                        </span>
                      </td>
                      <td>
                        <span className="font-medium text-jasper-carbon">
                          {formatCurrency(project.value, project.currency)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-surface-tertiary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-jasper-emerald rounded-full transition-all duration-500"
                              style={{ width: `${project.progress_percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-jasper-slate w-8">
                            {project.progress_percent}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-jasper-slate">
                          {project.target_completion
                            ? formatDate(project.target_completion)
                            : '-'}
                        </span>
                      </td>
                      <td>
                        <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-surface-secondary rounded-lg transition-all">
                          <MoreHorizontal className="w-4 h-4 text-jasper-slate" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <p className="text-sm text-jasper-slate">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} projects
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= total}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Projects Grid View (Alternative) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.slice(0, 6).map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="card card-hover p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-xs text-jasper-slate">{project.reference}</span>
                <span className={cn('badge', getStageColor(project.stage))}>
                  {formatStage(project.stage)}
                </span>
              </div>

              <h3 className="font-semibold text-jasper-carbon mb-2 line-clamp-2">
                {project.name}
              </h3>

              <div className="flex items-center gap-4 text-sm text-jasper-slate mb-4">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(project.value, project.currency)}
                </div>
                {project.target_completion && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(project.target_completion)}
                  </div>
                )}
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-jasper-slate">Progress</span>
                  <span className="font-medium text-jasper-carbon">{project.progress_percent}%</span>
                </div>
                <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-jasper-emerald rounded-full transition-all duration-500"
                    style={{ width: `${project.progress_percent}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
