'use client'

import { useState, useEffect } from 'react'
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
  X,
  Loader2,
  Building2,
  FolderKanban,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { formatCurrency, formatDate, formatStage, formatPackage, getStageColor, cn } from '@/lib/utils'
import { sanitizeInput, truncate, INPUT_LIMITS } from '@/lib/sanitize'
import { useProjects, useCompanies } from '@/hooks/use-queries'
import { projectsApi } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable, SkeletonGrid } from '@/components/ui/Skeleton'

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

const packageOptions = [
  { value: 'growth', label: 'Growth', price: '$12,000' },
  { value: 'institutional', label: 'Institutional', price: '$25,000' },
  { value: 'infrastructure', label: 'Infrastructure', price: '$45,000' },
  { value: 'strategic', label: 'Strategic', price: '$85,000+' },
]

const sectorOptions = [
  { value: 'agriculture', label: 'Agriculture & Agribusiness' },
  { value: 'energy', label: 'Energy & Renewable' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'mining', label: 'Mining & Resources' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'other', label: 'Other' },
]

interface CreateProjectForm {
  company_id: number | ''
  name: string
  description: string
  package: string
  value: number | ''
  currency: string
  target_completion: string
  sector: string
  location: string
  funding_amount: number | ''
  target_dfis: string
}

const initialFormState: CreateProjectForm = {
  company_id: '',
  name: '',
  description: '',
  package: 'startup',
  value: '',
  currency: 'ZAR',
  target_completion: '',
  sector: '',
  location: '',
  funding_amount: '',
  target_dfis: '',
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [page, setPage] = useState(1)

  // Create Project Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)
  const [formData, setFormData] = useState<CreateProjectForm>(initialFormState)

  const queryClient = useQueryClient()

  // Use React Query for data fetching with automatic caching
  const { data, isLoading: loading, error } = useProjects({
    page,
    page_size: 20,
    stage: stageFilter || undefined,
  })

  // Fetch companies for the dropdown
  const { data: companiesData } = useCompanies({ page: 1, page_size: 100 })

  const projects: Project[] = data?.projects || []
  const total = data?.total || 0
  const companies = companiesData?.companies || []

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'company_id' || name === 'value' || name === 'funding_amount'
        ? (value === '' ? '' : Number(value))
        : value
    }))
  }

  // Handle create project submission
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)
    setCreateSuccess(false)

    try {
      // Validate required fields
      if (!formData.company_id || !formData.name || !formData.package) {
        throw new Error('Please fill in all required fields')
      }

      // Validate input lengths
      if (formData.name.length > INPUT_LIMITS.name) {
        throw new Error(`Project name must be ${INPUT_LIMITS.name} characters or less`)
      }
      if (formData.description && formData.description.length > INPUT_LIMITS.description) {
        throw new Error(`Description must be ${INPUT_LIMITS.description} characters or less`)
      }
      if (formData.location && formData.location.length > INPUT_LIMITS.address) {
        throw new Error(`Location must be ${INPUT_LIMITS.address} characters or less`)
      }

      // Sanitize all text inputs before sending to API
      const projectData = {
        company_id: formData.company_id,
        name: truncate(sanitizeInput(formData.name), INPUT_LIMITS.name),
        description: formData.description ? truncate(sanitizeInput(formData.description), INPUT_LIMITS.description) : undefined,
        package: formData.package,
        value: formData.value || 0,
        currency: formData.currency,
        target_completion: formData.target_completion || undefined,
        sector: formData.sector || undefined,
        location: formData.location ? truncate(sanitizeInput(formData.location), INPUT_LIMITS.address) : undefined,
        funding_amount: formData.funding_amount || undefined,
        target_dfis: formData.target_dfis ? truncate(sanitizeInput(formData.target_dfis), INPUT_LIMITS.description) : undefined,
        stage: 'inquiry',
      }

      await projectsApi.create(projectData)

      setCreateSuccess(true)
      // Invalidate and refetch projects
      queryClient.invalidateQueries({ queryKey: ['projects'] })

      // Reset form and close modal after short delay
      setTimeout(() => {
        setShowCreateModal(false)
        setFormData(initialFormState)
        setCreateSuccess(false)
      }, 1500)
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  // Close modal and reset state
  const handleCloseModal = () => {
    setShowCreateModal(false)
    setFormData(initialFormState)
    setCreateError(null)
    setCreateSuccess(false)
  }

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

          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Projects Table */}
        {loading ? (
          <SkeletonTable rows={5} columns={8} />
        ) : filteredProjects.length === 0 ? (
          searchQuery || stageFilter ? (
            <div className="card">
              <EmptyState
                type="search"
                title="No projects match your criteria"
                description="Try adjusting your search or filter to find projects."
              />
            </div>
          ) : (
            <div className="card">
              <EmptyState
                type="projects"
                onAction={() => setShowCreateModal(true)}
              />
            </div>
          )
        ) : (
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
                {filteredProjects.map((project) => (
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
                  ))}
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
        )}

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

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={handleCloseModal}
            />

            {/* Modal */}
            <div className="relative bg-surface-primary rounded-xl shadow-modal w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-jasper-emerald/10 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-jasper-emerald" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-jasper-carbon">Create New Project</h2>
                    <p className="text-sm text-jasper-slate">Add a new project to the pipeline</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-jasper-slate" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateProject} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="p-6 space-y-6">
                  {/* Success Message */}
                  {createSuccess && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800">Project created successfully!</span>
                    </div>
                  )}

                  {/* Error Message */}
                  {createError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-800">{createError}</span>
                    </div>
                  )}

                  {/* Client Selection */}
                  <div>
                    <label className="input-label">
                      Client <span className="text-status-error">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jasper-slate-light" />
                      <select
                        name="company_id"
                        value={formData.company_id}
                        onChange={handleInputChange}
                        className="input pl-10"
                        required
                      >
                        <option value="">Select a client...</option>
                        {companies.map((company: any) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Project Name */}
                  <div>
                    <label className="input-label">
                      Project Name <span className="text-status-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter project name"
                      className="input"
                      required
                      maxLength={INPUT_LIMITS.name}
                      aria-describedby="name-limit"
                    />
                    <p id="name-limit" className="text-xs text-jasper-slate-light mt-1">
                      {formData.name.length}/{INPUT_LIMITS.name} characters
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="input-label">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe the project scope and objectives..."
                      rows={3}
                      className="input resize-none"
                      maxLength={INPUT_LIMITS.description}
                      aria-describedby="description-limit"
                    />
                    <p id="description-limit" className="text-xs text-jasper-slate-light mt-1">
                      {formData.description.length}/{INPUT_LIMITS.description} characters
                    </p>
                  </div>

                  {/* Package & Value Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">
                        Package <span className="text-status-error">*</span>
                      </label>
                      <select
                        name="package"
                        value={formData.package}
                        onChange={handleInputChange}
                        className="input"
                        required
                      >
                        {packageOptions.map((pkg) => (
                          <option key={pkg.value} value={pkg.value}>
                            {pkg.label} ({pkg.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="input-label">Project Value</label>
                      <div className="flex gap-2">
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleInputChange}
                          className="input w-24"
                        >
                          <option value="ZAR">ZAR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                        <input
                          type="number"
                          name="value"
                          value={formData.value}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          className="input flex-1"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sector & Location Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Sector</label>
                      <select
                        name="sector"
                        value={formData.sector}
                        onChange={handleInputChange}
                        className="input"
                      >
                        <option value="">Select a sector...</option>
                        {sectorOptions.map((sector) => (
                          <option key={sector.value} value={sector.value}>
                            {sector.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="input-label">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., Johannesburg, South Africa"
                        className="input"
                        maxLength={INPUT_LIMITS.address}
                      />
                    </div>
                  </div>

                  {/* Target Date & Funding Amount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Target Completion Date</label>
                      <input
                        type="date"
                        name="target_completion"
                        value={formData.target_completion}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="input-label">Funding Amount Required</label>
                      <input
                        type="number"
                        name="funding_amount"
                        value={formData.funding_amount}
                        onChange={handleInputChange}
                        placeholder="Amount being sought"
                        className="input"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Target DFIs */}
                  <div>
                    <label className="input-label">Target DFIs / Funders</label>
                    <textarea
                      name="target_dfis"
                      value={formData.target_dfis}
                      onChange={handleInputChange}
                      placeholder="List target Development Finance Institutions or funders..."
                      rows={2}
                      className="input resize-none"
                      maxLength={INPUT_LIMITS.description}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface-secondary">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-secondary"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isCreating || createSuccess}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : createSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Created!
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Project
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
