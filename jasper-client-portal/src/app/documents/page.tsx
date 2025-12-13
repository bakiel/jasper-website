'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  FileText,
  Download,
  FolderOpen,
  Search,
  FileSpreadsheet,
  FileIcon,
  FileImage,
  Loader2,
  BookOpen,
  Sparkles,
  ExternalLink,
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Receipt,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react'
import { clientProjectsApi, clientDocumentsApi, Document, Project } from '@/lib/api'

// ============================================
// TYPE DEFINITIONS
// ============================================

interface JasperResource {
  id: string
  title: string
  description: string
  filename: string
  type: 'pdf' | 'guide'
  category: 'overview' | 'guide' | 'template'
  icon: typeof FileText
  downloadUrl: string
  size?: string
  lastUpdated?: string
}

// ============================================
// JASPER RESOURCES - Pre-compiled PDFs
// ============================================

const JASPER_RESOURCES: JasperResource[] = [
  {
    id: 'service-overview',
    title: 'JASPER Service Overview',
    description: 'Comprehensive overview of our financial modelling services, methodology, and deliverables for DFI and investor submissions.',
    filename: 'jasper-service-overview.pdf',
    type: 'pdf',
    category: 'overview',
    icon: BookOpen,
    downloadUrl: '/resources/jasper-service-overview.pdf',
    size: '6.9 MB',
    lastUpdated: 'December 2024',
  },
  {
    id: '28-sheet-guide',
    title: 'The JASPER 28-Sheet Model Guide',
    description: 'Detailed guide to our proprietary 28-sheet financial model architecture, explaining each component and its purpose.',
    filename: 'jasper-28-sheet-guide.pdf',
    type: 'guide',
    category: 'guide',
    icon: FileSpreadsheet,
    downloadUrl: '/resources/jasper-28-sheet-guide.pdf',
    size: '934 KB',
    lastUpdated: 'December 2024',
  },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-ZA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getFileIcon(extension: string): typeof FileText {
  const iconMap: Record<string, typeof FileText> = {
    pdf: FileText,
    xlsx: FileSpreadsheet,
    xls: FileSpreadsheet,
    doc: FileIcon,
    docx: FileIcon,
    jpg: FileImage,
    jpeg: FileImage,
    png: FileImage,
  }
  return iconMap[extension.toLowerCase()] || FileIcon
}

// ============================================
// LOADING COMPONENT
// ============================================

function DocumentsLoading() {
  return (
    <div className="min-h-screen bg-jasper-navy flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-jasper-emerald animate-spin" />
    </div>
  )
}

// ============================================
// INNER COMPONENT (uses useSearchParams)
// ============================================

function DocumentsContent() {
  const { user, isLoading, logout } = useAuth()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'projects'

  const [activeTab, setActiveTab] = useState<'projects' | 'resources'>(
    initialTab === 'resources' ? 'resources' : 'projects'
  )
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dataLoading, setDataLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(false)

  const fetchProjects = async () => {
    setDataLoading(true)
    try {
      const response = await clientProjectsApi.list({ page_size: 50 })
      setProjects(response.projects || [])
      // Auto-select first project if available
      if (response.projects?.length > 0 && !selectedProjectId) {
        setSelectedProjectId(response.projects[0].id)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setDataLoading(false)
    }
  }

  // Fetch projects on mount
  useEffect(() => {
    if (user && !isLoading) {
      fetchProjects()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading])

  // Fetch documents when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      fetchDocuments(selectedProjectId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId])

  const fetchDocuments = async (projectId: number) => {
    setDocumentsLoading(true)
    try {
      const response = await clientDocumentsApi.listByProject(projectId)
      setDocuments(response.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setDocumentsLoading(false)
    }
  }

  // Filter documents by search
  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.document_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter resources by search
  const filteredResources = JASPER_RESOURCES.filter((resource) =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-jasper-emerald animate-spin" />
          <span className="text-jasper-slate text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface-secondary border-r border-border flex flex-col z-40">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
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
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/" className="nav-item">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="/projects" className="nav-item">
            <FolderKanban className="w-5 h-5" />
            My Projects
          </Link>
          <Link href="/documents" className="nav-item nav-item-active">
            <FileText className="w-5 h-5" />
            Documents
          </Link>
          <Link href="/messages" className="nav-item">
            <MessageSquare className="w-5 h-5" />
            Messages
          </Link>
          <Link href="/invoices" className="nav-item">
            <Receipt className="w-5 h-5" />
            Invoices
          </Link>
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
            <Link href="/settings" className="nav-item">
              <Settings className="w-5 h-5" />
              Settings
            </Link>
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
                <h1 className="text-2xl font-semibold text-jasper-carbon">Documents</h1>
                <p className="text-jasper-slate text-sm mt-0.5">
                  Access your project deliverables and JASPER resources
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jasper-slate-light" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-jasper-carbon placeholder-jasper-slate-light focus:outline-none focus:border-jasper-emerald/50"
                  />
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-jasper-slate hover:text-jasper-carbon hover:bg-surface-secondary rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border mb-8">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'projects'
                  ? 'border-jasper-emerald text-jasper-emerald'
                  : 'border-transparent text-jasper-slate hover:text-jasper-carbon'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Project Documents
              </div>
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'resources'
                  ? 'border-jasper-emerald text-jasper-emerald'
                  : 'border-transparent text-jasper-slate hover:text-jasper-carbon'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                JASPER Resources
                <span className="ml-1 px-2 py-0.5 bg-jasper-emerald/20 text-jasper-emerald text-xs rounded-full">
                  {JASPER_RESOURCES.length}
                </span>
              </div>
            </button>
          </div>

          {/* Project Documents Tab */}
          {activeTab === 'projects' && (
            <div>
              {dataLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-jasper-emerald animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-jasper-slate-light" />
                  </div>
                  <h3 className="text-lg font-medium text-jasper-carbon mb-2">No Projects Yet</h3>
                  <p className="text-jasper-slate text-sm mb-6 max-w-md mx-auto">
                    Your project documents will appear here once your first project begins.
                    In the meantime, check out our JASPER resources.
                  </p>
                  <button
                    onClick={() => setActiveTab('resources')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-jasper-emerald hover:bg-jasper-emerald-dark text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    View JASPER Resources
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Project Selector */}
                  <div className="lg:col-span-1">
                    <div className="card">
                      <div className="card-header">
                        <h3 className="font-medium text-jasper-carbon text-sm">Select Project</h3>
                      </div>
                      <div className="divide-y divide-border">
                        {projects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => setSelectedProjectId(project.id)}
                            className={`w-full text-left p-4 transition-colors ${
                              selectedProjectId === project.id
                                ? 'bg-jasper-emerald/10 border-l-2 border-jasper-emerald'
                                : 'hover:bg-surface-tertiary/50'
                            }`}
                          >
                            <p className="text-xs text-jasper-slate font-mono mb-1">
                              {project.reference}
                            </p>
                            <p className={`text-sm font-medium truncate ${
                              selectedProjectId === project.id
                                ? 'text-jasper-emerald'
                                : 'text-jasper-carbon'
                            }`}>
                              {project.name}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Documents List */}
                  <div className="lg:col-span-3">
                    {selectedProject && (
                      <div className="card">
                        <div className="card-header flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-jasper-carbon">
                              {selectedProject.name}
                            </h3>
                            <p className="text-xs text-jasper-slate mt-0.5">
                              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} available
                            </p>
                          </div>
                        </div>

                        {documentsLoading ? (
                          <div className="p-12 text-center">
                            <Loader2 className="w-6 h-6 text-jasper-emerald animate-spin mx-auto" />
                          </div>
                        ) : filteredDocuments.length === 0 ? (
                          <div className="p-12 text-center">
                            <FileText className="w-10 h-10 text-jasper-slate-light mx-auto mb-3" />
                            <p className="text-jasper-slate text-sm">
                              {searchQuery
                                ? 'No documents match your search'
                                : 'No documents available yet'}
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border">
                            {filteredDocuments.map((doc) => {
                              const DocIcon = getFileIcon(doc.file_extension)
                              return (
                                <div
                                  key={doc.id}
                                  className="p-4 flex items-center gap-4 hover:bg-surface-tertiary/50 transition-colors"
                                >
                                  <div className="w-10 h-10 rounded-lg bg-jasper-emerald/10 flex items-center justify-center flex-shrink-0">
                                    <DocIcon className="w-5 h-5 text-jasper-emerald" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-jasper-carbon truncate">
                                      {doc.name}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-jasper-slate">
                                      <span className="uppercase">{doc.file_extension}</span>
                                      <span>•</span>
                                      <span>{formatFileSize(doc.file_size)}</span>
                                      <span>•</span>
                                      <span>{formatDate(doc.uploaded_at)}</span>
                                    </div>
                                  </div>
                                  <a
                                    href={clientDocumentsApi.download(doc.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-jasper-emerald hover:bg-jasper-emerald/10 rounded-lg transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download
                                  </a>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JASPER Resources Tab */}
          {activeTab === 'resources' && (
            <div>
              {/* Resources Header */}
              <div className="mb-8">
                <div className="card p-6 bg-gradient-to-br from-jasper-emerald/10 to-transparent border-jasper-emerald/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-jasper-emerald/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-jasper-emerald" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-jasper-carbon mb-2">
                        JASPER Resources Library
                      </h2>
                      <p className="text-sm text-jasper-slate max-w-2xl">
                        Download our comprehensive guides and documentation to learn more about
                        the JASPER financial modelling system. These resources explain our methodology,
                        the 28-sheet model architecture, and what you can expect from working with us.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resources Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredResources.map((resource) => {
                  const ResourceIcon = resource.icon
                  return (
                    <div key={resource.id} className="card overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-jasper-emerald/10 flex items-center justify-center flex-shrink-0">
                            <ResourceIcon className="w-6 h-6 text-jasper-emerald" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="inline-block px-2 py-0.5 bg-jasper-emerald/20 text-jasper-emerald text-xs font-medium rounded mb-2 uppercase">
                              {resource.category}
                            </span>
                            <h3 className="font-semibold text-jasper-carbon mb-2">
                              {resource.title}
                            </h3>
                            <p className="text-sm text-jasper-slate line-clamp-2">
                              {resource.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-surface-secondary border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-jasper-slate">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {resource.type.toUpperCase()}
                          </span>
                          {resource.size && (
                            <>
                              <span>•</span>
                              <span>{resource.size}</span>
                            </>
                          )}
                          {resource.lastUpdated && (
                            <>
                              <span>•</span>
                              <span>Updated {resource.lastUpdated}</span>
                            </>
                          )}
                        </div>
                        <a
                          href={resource.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-jasper-emerald hover:bg-jasper-emerald-dark text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Need Help Section */}
              <div className="mt-8 card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-jasper-carbon">Need More Information?</h4>
                      <p className="text-sm text-jasper-slate">
                        Our team is happy to answer any questions about our services.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://jasperfinance.org/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-jasper-emerald hover:bg-jasper-emerald/10 rounded-lg transition-colors"
                  >
                    Contact Us
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ============================================
// MAIN EXPORT (wraps with Suspense)
// ============================================

export default function DocumentsPage() {
  return (
    <Suspense fallback={<DocumentsLoading />}>
      <DocumentsContent />
    </Suspense>
  )
}
