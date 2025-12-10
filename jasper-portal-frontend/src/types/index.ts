// Company/Client Types
export interface Company {
  id: number
  name: string
  status: CompanyStatus
  country: string
  email?: string
  phone?: string
  website?: string
  lead_source?: string
  notes?: string
  total_revenue: number
  outstanding_balance: number
  created_at: string
  updated_at: string
}

export type CompanyStatus =
  | 'lead'
  | 'prospect'
  | 'qualified'
  | 'proposal_sent'
  | 'negotiation'
  | 'client'
  | 'inactive'
  | 'lost'

// Contact Types
export interface Contact {
  id: number
  company_id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  job_title?: string
  is_primary: boolean
  is_decision_maker: boolean
  created_at: string
}

// Project Types
export interface Project {
  id: number
  reference: string
  company_id: number
  contact_id?: number
  name: string
  description?: string
  stage: ProjectStage
  package: Package
  value: number
  currency: string
  inquiry_date: string
  start_date?: string
  target_completion?: string
  actual_completion?: string
  revision_rounds_used: number
  revision_rounds_total: number
  progress_percent: number
  project_sector?: string
  project_location?: string
  funding_amount?: number
  target_dfis?: string[]
  created_at: string
  updated_at: string
}

export type ProjectStage =
  | 'inquiry'
  | 'proposal'
  | 'negotiation'
  | 'contracted'
  | 'discovery'
  | 'in_progress'
  | 'review'
  | 'revision'
  | 'completed'
  | 'on_hold'
  | 'cancelled'

export type Package =
  | 'starter'
  | 'growth'
  | 'scale'
  | 'enterprise'
  | 'custom'

// Milestone Types
export interface Milestone {
  id: number
  name: string
  order: number
  due_date?: string
  completed: boolean
  completed_date?: string
  description?: string
  notes?: string
}

// Invoice Types
export interface Invoice {
  id: number
  invoice_number: string
  project_id?: number
  company_id: number
  invoice_type: InvoiceType
  status: InvoiceStatus
  subtotal: number
  discount_percent: number
  discount_amount: number
  tax_percent: number
  tax_amount: number
  total: number
  currency: string
  issue_date: string
  due_date: string
  paid_date?: string
  payment_method?: PaymentMethod
  payment_reference?: string
  notes?: string
  created_at: string
}

export type InvoiceType = 'deposit' | 'milestone' | 'final' | 'retainer' | 'custom'

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'

export type PaymentMethod =
  | 'bank_eft'
  | 'paypal'
  | 'usdt'
  | 'usdc'
  | 'bitcoin'
  | 'crypto_other'
  | 'cash'
  | 'other'

// Dashboard Types
export interface DashboardMetrics {
  active_projects: number
  pending_invoices: number
  total_revenue: number
  outstanding_balance: number
  pipeline_value: number
  conversion_rate: number
}

export interface PipelineStage {
  stage: string
  count: number
  value: number
}

// API Response Types
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface ProjectListResponse {
  projects: Project[]
  total: number
  page: number
  page_size: number
}

export interface CompanyListResponse {
  companies: Company[]
  total: number
  page: number
  page_size: number
}

export interface InvoiceListResponse {
  invoices: Invoice[]
  total: number
  page: number
  page_size: number
}
