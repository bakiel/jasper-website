const API_BASE = '/api/v1'

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  // Add auth header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  })

  if (!response.ok) {
    // Handle 401 - clear token and redirect to login
    if (response.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.detail || error.message || 'Request failed')
  }

  return response.json()
}

// Dashboard API
export const dashboardApi = {
  getMetrics: () => fetchApi<any>('/admin/dashboard'),
  getAnalytics: () => fetchApi<any>('/admin/analytics'),
}

// Companies/Clients API
export interface CompanyCreateData {
  name: string
  trading_name?: string
  industry?: string
  country?: string
  city?: string
  website?: string
  phone?: string
  email?: string
  lead_source?: string
  referred_by?: string
  dfi_targets?: string[]
  project_value_min?: number
  project_value_max?: number
  notes?: string
  primary_contact?: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    job_title?: string
    is_primary: boolean
    is_decision_maker: boolean
  }
}

export const companiesApi = {
  list: (params?: { page?: number; page_size?: number; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.page_size) query.set('page_size', params.page_size.toString())
    if (params?.status) query.set('status', params.status)
    return fetchApi<any>(`/clients/?${query}`)
  },
  get: (id: number) => fetchApi<any>(`/clients/${id}`),
  create: (data: CompanyCreateData) =>
    fetchApi<any>('/clients/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: any) =>
    fetchApi<any>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  sendInvite: (companyId: number, contactId: number) =>
    fetchApi<{ success: boolean; message: string }>(`/clients/${companyId}/send-invite`, {
      method: 'POST',
      body: JSON.stringify({ contact_id: contactId }),
    }),
  getContacts: (companyId: number) => fetchApi<any[]>(`/clients/${companyId}/contacts`),
}

// Projects API
export const projectsApi = {
  list: (params?: { page?: number; page_size?: number; company_id?: number; stage?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.page_size) query.set('page_size', params.page_size.toString())
    if (params?.company_id) query.set('company_id', params.company_id.toString())
    if (params?.stage) query.set('stage', params.stage)
    return fetchApi<any>(`/projects/?${query}`)
  },
  get: (id: number) => fetchApi<any>(`/projects/${id}`),
  create: (data: any) =>
    fetchApi<any>('/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: any) =>
    fetchApi<any>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getMilestones: (id: number) => fetchApi<any>(`/projects/${id}/milestones`),
  getTimeline: (id: number) => fetchApi<any>(`/projects/${id}/timeline`),
  updateMilestone: (projectId: number, milestoneId: number, data: { completed?: boolean; notes?: string }) =>
    fetchApi<any>(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  advanceStage: (id: number) =>
    fetchApi<any>(`/projects/${id}/advance-stage`, { method: 'POST' }),
}

// Invoices API
export const invoicesApi = {
  list: (params?: { page?: number; page_size?: number; company_id?: number; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.page_size) query.set('page_size', params.page_size.toString())
    if (params?.company_id) query.set('company_id', params.company_id.toString())
    if (params?.status) query.set('status', params.status)
    return fetchApi<any>(`/invoices/?${query}`)
  },
  get: (id: number) => fetchApi<any>(`/invoices/${id}`),
  create: (data: any) =>
    fetchApi<any>('/invoices/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  markPaid: (id: number, data: { payment_method: string; reference?: string }) =>
    fetchApi<any>(`/invoices/${id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Company Info API
export const companyInfoApi = {
  get: () => fetch('/api/company-info').then(res => res.json()),
  getDesignSystem: () => fetch('/api/design-system').then(res => res.json()),
}

// Documents API
export interface DocumentData {
  id: number
  project_id: number
  name: string
  original_filename: string
  file_size: number
  mime_type: string
  file_extension: string
  document_type: string
  status: string
  version: number
  is_latest: boolean
  uploaded_by: string
  is_client_upload: boolean
  client_visible: boolean
  description?: string
  uploaded_at: string
  download_url: string
}

export const documentsApi = {
  listByProject: (projectId: number) =>
    fetchApi<{ documents: DocumentData[]; total: number }>(`/documents/project/${projectId}`),

  upload: async (formData: FormData) => {
    const token = getAuthToken()
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    const response = await fetch('/api/v1/documents/upload', {
      method: 'POST',
      headers,
      body: formData,
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
      throw new Error(error.detail || 'Upload failed')
    }
    return response.json() as Promise<DocumentData>
  },

  delete: (documentId: number) =>
    fetchApi<void>(`/documents/${documentId}`, { method: 'DELETE' }),

  download: (documentId: number) => `/api/v1/documents/${documentId}/download`,
}

// Questionnaire Types
export interface QuestionnaireStatus {
  questionnaire_required: boolean
  questionnaire_completed: boolean
  questionnaire_id: number | null
}

export interface QuestionnaireData {
  id?: number
  company_id?: number
  // Section 1: Company Information
  company_description?: string
  years_in_operation?: number
  employee_count?: string
  annual_revenue_range?: string
  // Section 2: Project Details
  project_name?: string
  project_description?: string
  project_location?: string
  project_value_estimate?: number
  project_timeline?: 'urgent' | 'short' | 'medium' | 'long' | 'flexible'
  project_readiness?: 'concept' | 'feasibility' | 'planning' | 'ready_for_funding' | 'implementation'
  // Section 3: Funding Requirements
  funding_status?: 'self_funded' | 'seeking_funding' | 'partially_funded' | 'fully_funded' | 'not_applicable'
  funding_amount_required?: number
  dfi_experience?: boolean
  previous_dfi_partners?: string[]
  preferred_dfis?: string[]
  // Section 4: Documents Available
  has_business_plan?: boolean
  has_financial_statements?: boolean
  has_feasibility_study?: boolean
  has_environmental_assessment?: boolean
  has_legal_documentation?: boolean
  additional_documents?: string
  // Section 5: Impact & ESG
  jobs_to_be_created?: number
  sdg_alignment?: string[]
  environmental_benefits?: string
  social_impact_description?: string
  // Section 6: Additional Information
  challenges_faced?: string
  specific_assistance_needed?: string
  how_did_you_hear?: string
  additional_comments?: string
  // Meta
  completed?: boolean
  submitted_at?: string
  created_at?: string
  updated_at?: string
}

// Questionnaire API
export const questionnaireApi = {
  getStatus: () => fetchApi<QuestionnaireStatus>('/questionnaire/status'),
  get: () => fetchApi<QuestionnaireData | null>('/questionnaire/'),
  save: (data: Partial<QuestionnaireData>) =>
    fetchApi<QuestionnaireData>('/questionnaire/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Admin Auth Types
export interface AdminUser {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'super_admin' | 'admin' | 'manager' | 'viewer'
  is_active: boolean
  email_verified: boolean
  last_login: string | null
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: AdminUser
}

// Admin Authentication API
export const adminAuthApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }))
      throw new Error(error.detail || 'Invalid credentials')
    }

    const data: LoginResponse = await response.json()

    // Store token and user data
    localStorage.setItem('admin_token', data.access_token)
    localStorage.setItem('admin_user', JSON.stringify(data.user))

    return data
  },

  googleLogin: async (credential: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE}/admin/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Google login failed' }))
      throw new Error(error.detail || 'Google authentication failed')
    }

    const data: LoginResponse = await response.json()

    // Store token and user data
    localStorage.setItem('admin_token', data.access_token)
    localStorage.setItem('admin_user', JSON.stringify(data.user))

    return data
  },

  getGoogleClientId: async (): Promise<string> => {
    const response = await fetch(`${API_BASE}/admin/auth/google/client-id`)
    if (!response.ok) {
      throw new Error('Google OAuth not configured')
    }
    const data = await response.json()
    return data.client_id
  },

  logout: () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    window.location.href = '/login'
  },

  getCurrentUser: (): AdminUser | null => {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem('admin_user')
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('admin_token')
  },

  getMe: () => fetchApi<AdminUser>('/admin/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    fetchApi<{ message: string }>('/admin/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }),
}

// Message Types
export interface MessageData {
  id: number
  company_id: number
  project_id: number | null
  sender_type: 'admin' | 'client'
  sender_id: number
  sender_name: string
  message_type: 'text' | 'notification' | 'system' | 'document_share'
  subject: string | null
  content: string
  attachment_ids: number[]
  is_read: boolean
  read_at: string | null
  parent_id: number | null
  created_at: string
  reply_count?: number
}

export interface ThreadData {
  company_id: number
  company_name: string
  project_id: number | null
  project_name: string | null
  last_message: MessageData | null
  message_count: number
  unread_count: number
}

export interface MessageCreateData {
  company_id: number
  project_id?: number
  subject?: string
  content: string
  message_type?: 'text' | 'notification' | 'system' | 'document_share'
  attachment_ids?: number[]
  parent_id?: number
}

// Messages API
export const messagesApi = {
  // Admin endpoints
  send: (data: MessageCreateData, senderName: string = 'Admin', senderId: number = 1) =>
    fetchApi<MessageData>(`/messages/send?sender_name=${encodeURIComponent(senderName)}&sender_id=${senderId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getThreads: (companyId?: number) => {
    const query = companyId ? `?company_id=${companyId}` : ''
    return fetchApi<{ threads: ThreadData[]; total: number }>(`/messages/threads${query}`)
  },

  getCompanyMessages: (companyId: number, projectId?: number, page: number = 1) => {
    const query = new URLSearchParams()
    query.set('page', page.toString())
    if (projectId) query.set('project_id', projectId.toString())
    return fetchApi<{ messages: MessageData[]; total: number; unread_count: number }>(
      `/messages/company/${companyId}?${query}`
    )
  },

  getMessage: (messageId: number) => fetchApi<MessageData>(`/messages/${messageId}`),

  getReplies: (messageId: number) =>
    fetchApi<{ messages: MessageData[]; total: number; unread_count: number }>(`/messages/${messageId}/replies`),

  markAsRead: (messageId: number) =>
    fetchApi<{ success: boolean }>(`/messages/${messageId}/read`, { method: 'PATCH' }),

  markAllAsRead: (companyId: number) =>
    fetchApi<{ success: boolean }>(`/messages/company/${companyId}/read-all`, { method: 'PATCH' }),
}
