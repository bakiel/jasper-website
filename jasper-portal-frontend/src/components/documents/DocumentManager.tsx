'use client'

import { useState, useRef, useCallback } from 'react'
import {
  FileText,
  Upload,
  Download,
  Trash2,
  File,
  FileSpreadsheet,
  FileImage,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  FolderOpen,
} from 'lucide-react'
import { documentsApi, DocumentData } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'

// File type icons
const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
}

// Document type labels
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  proposal: 'Proposal',
  financial_model: 'Financial Model',
  business_plan: 'Business Plan',
  pitch_deck: 'Pitch Deck',
  executive_summary: 'Executive Summary',
  due_diligence: 'Due Diligence',
  invoice: 'Invoice',
  contract: 'Contract',
  nda: 'NDA',
  company_registration: 'Company Registration',
  financial_statements: 'Financial Statements',
  tax_documents: 'Tax Documents',
  id_documents: 'ID Documents',
  other_client: 'Client Document',
  other_deliverable: 'Deliverable',
}

interface DocumentManagerProps {
  projectId: number
  documents: DocumentData[]
  onDocumentsChange: () => void
  isAdmin?: boolean
}

export function DocumentManager({
  projectId,
  documents,
  onDocumentsChange,
  isAdmin = true,
}: DocumentManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Document type selection for upload
  const [selectedType, setSelectedType] = useState('other_client')
  const [description, setDescription] = useState('')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        await handleUpload(files[0])
      }
    },
    [projectId, selectedType, description]
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleUpload(files[0])
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async (file: File) => {
    setError(null)
    setUploading(true)
    setUploadProgress(`Uploading ${file.name}...`)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('project_id', projectId.toString())
      formData.append('document_type', selectedType)
      formData.append('uploaded_by', 'admin')
      formData.append('is_client_upload', 'false')
      if (description) {
        formData.append('description', description)
      }

      await documentsApi.upload(formData)
      setUploadProgress(null)
      setDescription('')
      onDocumentsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    setDeleting(documentId)
    try {
      await documentsApi.delete(documentId)
      onDocumentsChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = (doc: DocumentData) => {
    const url = documentsApi.download(doc.id)
    window.open(url, '_blank')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFileIcon = (extension: string) => {
    const Icon = FILE_ICONS[extension.toLowerCase()] || File
    return Icon
  }

  // Group documents by type
  const deliverables = documents.filter((d) =>
    ['proposal', 'financial_model', 'business_plan', 'pitch_deck', 'executive_summary', 'due_diligence', 'invoice', 'other_deliverable'].includes(d.document_type)
  )
  const clientDocs = documents.filter((d) => !deliverables.includes(d))

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {isAdmin && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-jasper-carbon">Upload Document</h3>
          </div>
          <div className="card-body space-y-4">
            {/* Document Type Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-jasper-carbon mb-1">
                  Document Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="input w-full"
                >
                  <optgroup label="Deliverables">
                    <option value="proposal">Proposal</option>
                    <option value="financial_model">Financial Model</option>
                    <option value="business_plan">Business Plan</option>
                    <option value="pitch_deck">Pitch Deck</option>
                    <option value="executive_summary">Executive Summary</option>
                    <option value="due_diligence">Due Diligence Report</option>
                    <option value="invoice">Invoice</option>
                    <option value="other_deliverable">Other Deliverable</option>
                  </optgroup>
                  <optgroup label="Client Documents">
                    <option value="company_registration">Company Registration</option>
                    <option value="financial_statements">Financial Statements</option>
                    <option value="tax_documents">Tax Documents</option>
                    <option value="id_documents">ID Documents</option>
                    <option value="contract">Contract</option>
                    <option value="nda">NDA</option>
                    <option value="other_client">Other Document</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-jasper-carbon mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="input w-full"
                />
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
                dragActive
                  ? 'border-jasper-emerald bg-jasper-emerald/5'
                  : 'border-border hover:border-jasper-emerald/50 hover:bg-surface-secondary'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.txt,.csv"
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-jasper-emerald animate-spin" />
                  <p className="text-sm text-jasper-slate">{uploadProgress}</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-jasper-slate mx-auto mb-2" />
                  <p className="text-sm text-jasper-carbon font-medium">
                    {dragActive ? 'Drop file here' : 'Click or drag file to upload'}
                  </p>
                  <p className="text-xs text-jasper-slate mt-1">
                    PDF, Word, Excel, PowerPoint, Images (max 50MB)
                  </p>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deliverables Section */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-jasper-carbon">
            Deliverables
            <span className="ml-2 text-sm font-normal text-jasper-slate">
              ({deliverables.length})
            </span>
          </h3>
        </div>
        {deliverables.length === 0 ? (
          <div className="p-8 text-center text-jasper-slate">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No deliverables uploaded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {deliverables.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onDownload={() => handleDownload(doc)}
                onDelete={() => handleDelete(doc.id)}
                deleting={deleting === doc.id}
                isAdmin={isAdmin}
                formatFileSize={formatFileSize}
                getFileIcon={getFileIcon}
              />
            ))}
          </div>
        )}
      </div>

      {/* Client Documents Section */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-jasper-carbon">
            Client Documents
            <span className="ml-2 text-sm font-normal text-jasper-slate">
              ({clientDocs.length})
            </span>
          </h3>
        </div>
        {clientDocs.length === 0 ? (
          <div className="p-8 text-center text-jasper-slate">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No client documents uploaded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {clientDocs.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onDownload={() => handleDownload(doc)}
                onDelete={() => handleDelete(doc.id)}
                deleting={deleting === doc.id}
                isAdmin={isAdmin}
                formatFileSize={formatFileSize}
                getFileIcon={getFileIcon}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface DocumentRowProps {
  document: DocumentData
  onDownload: () => void
  onDelete: () => void
  deleting: boolean
  isAdmin: boolean
  formatFileSize: (bytes: number) => string
  getFileIcon: (ext: string) => typeof FileText
}

function DocumentRow({
  document,
  onDownload,
  onDelete,
  deleting,
  isAdmin,
  formatFileSize,
  getFileIcon,
}: DocumentRowProps) {
  const Icon = getFileIcon(document.file_extension)

  return (
    <div className="p-4 flex items-center gap-4 hover:bg-surface-secondary/50 transition-colors">
      {/* File Icon */}
      <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-jasper-emerald" />
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-jasper-carbon truncate">
            {document.original_filename}
          </span>
          {document.client_visible && (
            <span className="badge badge-success text-xs">Visible</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-jasper-slate">
          <span className="badge badge-secondary">
            {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
          </span>
          <span>{formatFileSize(document.file_size)}</span>
          <span>{formatDate(document.uploaded_at)}</span>
          <span>by {document.uploaded_by}</span>
        </div>
        {document.description && (
          <p className="text-xs text-jasper-slate mt-1 truncate">{document.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onDownload}
          className="p-2 hover:bg-jasper-emerald/10 rounded-lg transition-colors group"
          title="Download"
        >
          <Download className="w-4 h-4 text-jasper-slate group-hover:text-jasper-emerald" />
        </button>
        {isAdmin && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors group disabled:opacity-50"
            title="Delete"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-jasper-slate group-hover:text-red-500" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
