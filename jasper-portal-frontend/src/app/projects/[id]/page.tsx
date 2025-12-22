'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout'
import { DocumentManager } from '@/components/documents'
import { MessageCenter } from '@/components/messages'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Building2,
  Clock,
  CheckCircle2,
  Circle,
  Edit,
  FileText,
  Send,
  MoreHorizontal,
  ChevronRight,
  Loader2,
  FolderOpen,
  MessageSquare,
  X,
  AlertCircle,
  CheckCircle,
  FolderKanban,
} from 'lucide-react'
import { formatCurrency, formatDate, formatStage, formatPackage, getStageColor, cn } from '@/lib/utils'
import { projectsApi, documentsApi, DocumentData } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

// Package options for JASPER (v3 pricing - December 2025)
const packageOptions = [
  { value: 'growth', label: 'Growth', price: '$12,000' },
  { value: 'institutional', label: 'Institutional', price: '$25,000' },
  { value: 'infrastructure', label: 'Infrastructure', price: '$45,000' },
  { value: 'strategic', label: 'Strategic', price: '$85,000+' },
]

// Sector options
const sectorOptions = [
  'Agriculture',
  'Energy & Power',
  'Infrastructure',
  'Manufacturing',
  'Mining',
  'Real Estate',
  'Technology',
  'Transportation',
  'Water & Sanitation',
  'Healthcare',
  'Education',
  'Financial Services',
  'Other',
]

// Currency options
const currencyOptions = [
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
]

interface EditProjectForm {
  name: string
  description: string
  package: string
  value: number | ''
  currency: string
  target_completion: string
  project_sector: string
  project_location: string
  funding_amount: number | ''
  target_dfis: string
}

// Pipeline stages in order
const PIPELINE_STAGES = [
  { key: 'inquiry', label: 'Inquiry' },
  { key: 'qualify', label: 'Qualify' },
  { key: 'intake', label: 'Intake' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'deposit', label: 'Deposit' },
  { key: 'production', label: 'Production' },
  { key: 'draft', label: 'Draft' },
  { key: 'final', label: 'Final' },
]

interface Project {
  id: number
  reference: string
  name: string
  description?: string
  company_id: number
  company_name?: string
  contact_id?: number
  stage: string
  package: string
  value: number
  currency: string
  progress_percent: number
  inquiry_date: string
  start_date?: string
  target_completion?: string
  actual_completion?: string
  revision_rounds_used: number
  revision_rounds_total: number
  project_sector?: string
  project_location?: string
  funding_amount?: number
  target_dfis?: string[]
  created_at: string
  updated_at: string
}

interface Milestone {
  id: number
  name: string
  order: number
  due_date?: string
  completed: boolean
  completed_date?: string
  description?: string
  notes?: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = Number(params.id)

  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [advancingStage, setAdvancingStage] = useState(false)
  const [updatingMilestone, setUpdatingMilestone] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'messages'>('overview')

  // Edit Project Modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [editForm, setEditForm] = useState<EditProjectForm>({
    name: '',
    description: '',
    package: '',
    value: '',
    currency: 'ZAR',
    target_completion: '',
    project_sector: '',
    project_location: '',
    funding_amount: '',
    target_dfis: '',
  })

  const queryClient = useQueryClient()

  const fetchData = async () => {
    try {
      const [projectData, milestonesData, documentsData] = await Promise.all([
        projectsApi.get(projectId),
        projectsApi.getMilestones(projectId).catch(() => []),
        documentsApi.listByProject(projectId).catch(() => ({ documents: [], total: 0 })),
      ])
      setProject(projectData)
      setMilestones(milestonesData || [])
      setDocuments(documentsData.documents || [])
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const data = await documentsApi.listByProject(projectId)
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }

  useEffect(() => {
    if (projectId) fetchData()
  }, [projectId])

  const handleAdvanceStage = async () => {
    if (!project) return
    setAdvancingStage(true)
    try {
      const updated = await projectsApi.advanceStage(projectId)
      setProject(updated)
    } catch (error) {
      console.error('Failed to advance stage:', error)
    } finally {
      setAdvancingStage(false)
    }
  }

  const handleToggleMilestone = async (milestone: Milestone) => {
    setUpdatingMilestone(milestone.id)
    try {
      const updated = await projectsApi.updateMilestone(projectId, milestone.id, {
        completed: !milestone.completed,
      })
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestone.id ? updated : m))
      )
      // Refresh project to update progress
      const projectData = await projectsApi.get(projectId)
      setProject(projectData)
    } catch (error) {
      console.error('Failed to update milestone:', error)
    } finally {
      setUpdatingMilestone(null)
    }
  }

  // Edit Project handlers
  const openEditModal = () => {
    if (project) {
      setEditForm({
        name: project.name || '',
        description: project.description || '',
        package: project.package || '',
        value: project.value || '',
        currency: project.currency || 'ZAR',
        target_completion: project.target_completion ? project.target_completion.split('T')[0] : '',
        project_sector: project.project_sector || '',
        project_location: project.project_location || '',
        funding_amount: project.funding_amount || '',
        target_dfis: project.target_dfis?.join(', ') || '',
      })
      setUpdateError('')
      setUpdateSuccess(false)
      setShowEditModal(true)
    }
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'value' || name === 'funding_amount'
        ? (value === '' ? '' : Number(value))
        : value
    }))
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setUpdateError('')
    setUpdateSuccess(false)

    try {
      const updateData: any = {
        name: editForm.name,
        description: editForm.description || null,
        package: editForm.package,
        value: editForm.value || null,
        currency: editForm.currency,
        target_completion: editForm.target_completion || null,
        project_sector: editForm.project_sector || null,
        project_location: editForm.project_location || null,
        funding_amount: editForm.funding_amount || null,
        target_dfis: editForm.target_dfis
          ? editForm.target_dfis.split(',').map(s => s.trim()).filter(s => s)
          : null,
      }

      const updated = await projectsApi.update(projectId, updateData)
      setProject(updated)
      setUpdateSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['projects'] })

      // Close modal after brief success display
      setTimeout(() => {
        setShowEditModal(false)
        setUpdateSuccess(false)
      }, 1500)
    } catch (error: any) {
      console.error('Failed to update project:', error)
      setUpdateError(error.response?.data?.detail || 'Failed to update project')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCloseEditModal = () => {
    if (!isUpdating) {
      setShowEditModal(false)
      setUpdateError('')
      setUpdateSuccess(false)
    }
  }

  // Get current stage index for pipeline display
  const currentStageIndex = project
    ? PIPELINE_STAGES.findIndex((s) => s.key === project.stage)
    : -1

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="animate-pulse text-jasper-slate">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <p className="text-jasper-slate mb-4">Project not found</p>
          <Link href="/projects" className="btn-primary">
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  const completedMilestones = milestones.filter((m) => m.completed).length
  const totalMilestones = milestones.length

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header
        title={project.reference}
        subtitle={project.name}
      />

      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-jasper-slate hover:text-jasper-carbon transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        {/* Pipeline Stage Tracker */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {PIPELINE_STAGES.map((stage, index) => {
                const isPast = index < currentStageIndex
                const isCurrent = index === currentStageIndex
                const isFuture = index > currentStageIndex

                return (
                  <div key={stage.key} className="flex items-center">
                    <div className="flex flex-col items-center min-w-[80px]">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                          isPast && 'bg-jasper-emerald text-white',
                          isCurrent && 'bg-jasper-emerald text-white ring-4 ring-jasper-emerald/20',
                          isFuture && 'bg-surface-tertiary text-jasper-slate'
                        )}
                      >
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={cn(
                          'mt-2 text-xs font-medium whitespace-nowrap',
                          isCurrent ? 'text-jasper-emerald' : 'text-jasper-slate'
                        )}
                      >
                        {stage.label}
                      </span>
                    </div>
                    {index < PIPELINE_STAGES.length - 1 && (
                      <div
                        className={cn(
                          'w-12 h-0.5 mx-1',
                          index < currentStageIndex ? 'bg-jasper-emerald' : 'bg-surface-tertiary'
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'overview'
                ? 'border-jasper-emerald text-jasper-emerald'
                : 'border-transparent text-jasper-slate hover:text-jasper-carbon'
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'documents'
                ? 'border-jasper-emerald text-jasper-emerald'
                : 'border-transparent text-jasper-slate hover:text-jasper-carbon'
            )}
          >
            <FolderOpen className="w-4 h-4" />
            Documents
            {documents.length > 0 && (
              <span className="badge badge-secondary text-xs">{documents.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'messages'
                ? 'border-jasper-emerald text-jasper-emerald'
                : 'border-transparent text-jasper-slate hover:text-jasper-carbon'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Messages
          </button>
        </div>

        {/* Main Content - Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Project Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview Card */}
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-jasper-carbon">Project Overview</h2>
                  <div className="flex items-center gap-2">
                    <span className={cn('badge text-sm', getStageColor(project.stage))}>
                      {formatStage(project.stage)}
                    </span>
                    <button
                      onClick={openEditModal}
                      className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                      title="Edit Project"
                    >
                      <Edit className="w-4 h-4 text-jasper-slate" />
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {project.description && (
                    <p className="text-jasper-slate mb-6">{project.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InfoItem
                      icon={DollarSign}
                      label="Value"
                      value={formatCurrency(project.value, project.currency)}
                    />
                    <InfoItem
                      icon={Building2}
                      label="Package"
                      value={formatPackage(project.package)}
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Target Date"
                      value={project.target_completion ? formatDate(project.target_completion) : '-'}
                    />
                    <InfoItem
                      icon={Clock}
                      label="Revisions"
                      value={`${project.revision_rounds_used}/${project.revision_rounds_total}`}
                    />
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-jasper-carbon">Overall Progress</span>
                      <span className="text-sm font-semibold text-jasper-emerald">
                        {project.progress_percent}%
                      </span>
                    </div>
                    <div className="h-3 bg-surface-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-jasper-emerald to-jasper-emerald-light rounded-full transition-all duration-700"
                        style={{ width: `${project.progress_percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-jasper-carbon">
                    Milestones
                    <span className="ml-2 text-sm font-normal text-jasper-slate">
                      ({completedMilestones}/{totalMilestones} completed)
                    </span>
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {milestones.length === 0 ? (
                    <div className="p-6 text-center text-jasper-slate">
                      No milestones defined yet
                    </div>
                  ) : (
                    milestones.map((milestone, index) => (
                      <div
                        key={milestone.id}
                        className={cn(
                          'p-4 flex items-start gap-4 group transition-colors',
                          milestone.completed && 'bg-surface-secondary/50'
                        )}
                      >
                        <button
                          onClick={() => handleToggleMilestone(milestone)}
                          disabled={updatingMilestone === milestone.id}
                          className="flex-shrink-0 mt-0.5 disabled:opacity-50"
                        >
                          {updatingMilestone === milestone.id ? (
                            <Loader2 className="w-5 h-5 text-jasper-emerald animate-spin" />
                          ) : milestone.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-jasper-emerald hover:text-jasper-emerald-dark transition-colors" />
                          ) : (
                            <Circle className="w-5 h-5 text-jasper-slate-light hover:text-jasper-emerald transition-colors" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'font-medium',
                              milestone.completed ? 'text-jasper-slate line-through' : 'text-jasper-carbon'
                            )}>
                              {milestone.name}
                            </span>
                            <span className="text-xs text-jasper-slate-light">
                              #{milestone.order}
                            </span>
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-jasper-slate mt-1">{milestone.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-jasper-slate">
                            {milestone.due_date && (
                              <span className={cn(
                                'flex items-center gap-1',
                                !milestone.completed && new Date(milestone.due_date) < new Date() && 'text-red-500'
                              )}>
                                <Calendar className="w-3 h-3" />
                                Due: {formatDate(milestone.due_date)}
                                {!milestone.completed && new Date(milestone.due_date) < new Date() && ' (Overdue)'}
                              </span>
                            )}
                            {milestone.completed_date && (
                              <span className="flex items-center gap-1 text-jasper-emerald">
                                <CheckCircle2 className="w-3 h-3" />
                                Completed: {formatDate(milestone.completed_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Project Info */}
              {(project.project_sector || project.project_location || project.funding_amount || project.target_dfis?.length) && (
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-lg font-semibold text-jasper-carbon">Project Details</h2>
                  </div>
                  <div className="card-body">
                    <dl className="grid grid-cols-2 gap-4">
                      {project.project_sector && (
                        <div>
                          <dt className="text-sm text-jasper-slate">Sector</dt>
                          <dd className="font-medium text-jasper-carbon">{project.project_sector}</dd>
                        </div>
                      )}
                      {project.project_location && (
                        <div>
                          <dt className="text-sm text-jasper-slate">Location</dt>
                          <dd className="font-medium text-jasper-carbon">{project.project_location}</dd>
                        </div>
                      )}
                      {project.funding_amount && (
                        <div>
                          <dt className="text-sm text-jasper-slate">Funding Target</dt>
                          <dd className="font-medium text-jasper-carbon">
                            {formatCurrency(project.funding_amount, project.currency)}
                          </dd>
                        </div>
                      )}
                      {project.target_dfis && project.target_dfis.length > 0 && (
                        <div className="col-span-2">
                          <dt className="text-sm text-jasper-slate mb-2">Target DFIs</dt>
                          <dd className="flex flex-wrap gap-2">
                            {project.target_dfis.map((dfi) => (
                              <span key={dfi} className="badge badge-info">
                                {dfi}
                              </span>
                            ))}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Actions & Timeline */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-jasper-carbon">Quick Actions</h3>
                </div>
                <div className="card-body space-y-2">
                  <button
                    onClick={handleAdvanceStage}
                    disabled={advancingStage || project.stage === 'final'}
                    className="btn-primary w-full justify-start disabled:opacity-50"
                  >
                    {advancingStage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    {advancingStage ? 'Advancing...' : project.stage === 'final' ? 'Project Complete' : 'Advance Stage'}
                  </button>
                  <button className="btn-secondary w-full justify-start">
                    <FileText className="w-4 h-4" />
                    Create Invoice
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="btn-ghost w-full justify-start"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Manage Documents
                  </button>
                  <button
                    onClick={openEditModal}
                    className="btn-ghost w-full justify-start"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Project
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-jasper-carbon">Timeline</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <TimelineItem
                      label="Inquiry Date"
                      date={project.inquiry_date}
                      completed
                    />
                    {project.start_date && (
                      <TimelineItem
                        label="Start Date"
                        date={project.start_date}
                        completed
                      />
                    )}
                    {project.target_completion && (
                      <TimelineItem
                        label="Target Completion"
                        date={project.target_completion}
                        completed={!!project.actual_completion}
                      />
                    )}
                    {project.actual_completion && (
                      <TimelineItem
                        label="Actual Completion"
                        date={project.actual_completion}
                        completed
                        highlight
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="card">
                <div className="card-body text-sm text-jasper-slate space-y-2">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="text-jasper-carbon">{formatDate(project.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated</span>
                    <span className="text-jasper-carbon">{formatDate(project.updated_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Project ID</span>
                    <span className="font-mono text-jasper-carbon">#{project.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <DocumentManager
            projectId={projectId}
            documents={documents}
            onDocumentsChange={fetchDocuments}
            isAdmin={true}
          />
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && project && (
          <div className="h-[600px]">
            <MessageCenter
              companyId={project.company_id}
              companyName={project.company_name}
              projectId={projectId}
            />
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-jasper-emerald/10 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-jasper-emerald" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-jasper-carbon">Edit Project</h2>
                  <p className="text-sm text-jasper-slate">{project.reference}</p>
                </div>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-jasper-slate" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateProject} className="p-6">
              {/* Success Message */}
              {updateSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700">Project updated successfully!</span>
                </div>
              )}

              {/* Error Message */}
              {updateError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700">{updateError}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-medium text-jasper-carbon mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="name" className="input-label">Project Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditInputChange}
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="input-label">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={editForm.description}
                        onChange={handleEditInputChange}
                        rows={3}
                        className="input resize-none"
                        placeholder="Brief description of the project..."
                      />
                    </div>
                  </div>
                </div>

                {/* Package & Value */}
                <div>
                  <h3 className="text-sm font-medium text-jasper-carbon mb-4">Package & Value</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="package" className="input-label">Package *</label>
                      <select
                        id="package"
                        name="package"
                        value={editForm.package}
                        onChange={handleEditInputChange}
                        className="input"
                        required
                      >
                        <option value="">Select package...</option>
                        {packageOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} ({opt.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="currency" className="input-label">Currency</label>
                      <select
                        id="currency"
                        name="currency"
                        value={editForm.currency}
                        onChange={handleEditInputChange}
                        className="input"
                      >
                        {currencyOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="value" className="input-label">Project Value</label>
                      <input
                        type="number"
                        id="value"
                        name="value"
                        value={editForm.value}
                        onChange={handleEditInputChange}
                        className="input"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label htmlFor="target_completion" className="input-label">Target Completion</label>
                      <input
                        type="date"
                        id="target_completion"
                        name="target_completion"
                        value={editForm.target_completion}
                        onChange={handleEditInputChange}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div>
                  <h3 className="text-sm font-medium text-jasper-carbon mb-4">Project Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="project_sector" className="input-label">Sector</label>
                      <select
                        id="project_sector"
                        name="project_sector"
                        value={editForm.project_sector}
                        onChange={handleEditInputChange}
                        className="input"
                      >
                        <option value="">Select sector...</option>
                        {sectorOptions.map(sector => (
                          <option key={sector} value={sector}>{sector}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="project_location" className="input-label">Location</label>
                      <input
                        type="text"
                        id="project_location"
                        name="project_location"
                        value={editForm.project_location}
                        onChange={handleEditInputChange}
                        className="input"
                        placeholder="City, Country"
                      />
                    </div>

                    <div>
                      <label htmlFor="funding_amount" className="input-label">Funding Target</label>
                      <input
                        type="number"
                        id="funding_amount"
                        name="funding_amount"
                        value={editForm.funding_amount}
                        onChange={handleEditInputChange}
                        className="input"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label htmlFor="target_dfis" className="input-label">Target DFIs</label>
                      <input
                        type="text"
                        id="target_dfis"
                        name="target_dfis"
                        value={editForm.target_dfis}
                        onChange={handleEditInputChange}
                        className="input"
                        placeholder="AfDB, IFC, DBSA (comma-separated)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="btn-secondary"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isUpdating || !editForm.name || !editForm.package}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-jasper-emerald" />
      </div>
      <div>
        <p className="text-xs text-jasper-slate">{label}</p>
        <p className="font-medium text-jasper-carbon">{value}</p>
      </div>
    </div>
  )
}

function TimelineItem({
  label,
  date,
  completed,
  highlight,
}: {
  label: string
  date: string
  completed?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-3 h-3 rounded-full',
          completed ? (highlight ? 'bg-jasper-emerald' : 'bg-jasper-slate') : 'bg-surface-tertiary border-2 border-jasper-slate-light'
        )}
      />
      <div className="flex-1">
        <p className="text-sm text-jasper-slate">{label}</p>
        <p className={cn(
          'font-medium',
          highlight ? 'text-jasper-emerald' : 'text-jasper-carbon'
        )}>
          {formatDate(date)}
        </p>
      </div>
    </div>
  )
}
