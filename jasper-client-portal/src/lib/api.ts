// Client Portal API - Uses same backend as Admin Portal
// API Base matches admin portal structure for consistency
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.jasperfinance.org'
const API_BASE = '/api/v1'

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ClientUser {
  id: string | number
  email: string
  name: string
  full_name?: string
  company?: string
  company_id?: number
  avatar_url?: string
  onboarding_completed?: boolean
  email_verified?: boolean
  status?: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  user: ClientUser
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  company_name?: string
}

export interface RegisterResponse {
  message: string
  user: {
    id: string
    email: string
    full_name: string
    status: string
  }
}

export interface VerifyEmailResponse {
  message: string
  status: string
}

export interface ApiError {
  detail: string
  code?: string
  errors?: string[]
}

// Project types - matches admin portal
export interface Project {
  id: number
  reference: string
  name: string
  description?: string
  sector?: string
  status: 'intake' | 'scoping' | 'active' | 'review' | 'complete'
  stage?: string
  progress: number
  budget?: number
  currency?: string
  start_date?: string
  target_date?: string
  created_at: string
  updated_at?: string
}

export interface ProjectMilestone {
  id: number
  project_id: number
  name: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  due_date?: string
  completed_date?: string
  sort_order: number
}

// Document types - matches admin portal
export interface Document {
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

// Message types - matches admin portal
export interface Message {
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

// Notification types - matches CRM notification system
export interface Notification {
  id: string
  type: 'lead' | 'invoice' | 'project' | 'client' | 'message' | 'system' | 'alert'
  title: string
  message: string
  link?: string
  priority: 'low' | 'medium' | 'high'
  user_id: string
  is_read: boolean
  created_at: string
}

// Activity types
export interface Activity {
  id: number
  entity_type: string
  entity_id: string
  action: string
  details?: string
  user_id?: string
  created_at: string
}

// ============================================
// HELPER FUNCTION - Reusable fetch with auth
// ============================================

// Request timeout (30 seconds)
const REQUEST_TIMEOUT_MS = 30000

// Rate limit error class
export class RateLimitError extends Error {
  retryAfter: number

  constructor(message: string, retryAfter: number) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

function getClientToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('client_token')
}

async function fetchClientApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getClientToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_URL}${API_BASE}${endpoint}`, {
      headers,
      signal: controller.signal,
      ...options,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000
        throw new RateLimitError(
          `Too many requests. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
          waitTime
        )
      }

      // Handle unauthorized (401)
      if (response.status === 401) {
        localStorage.removeItem('client_token')
        localStorage.removeItem('client_user')
      }

      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || error.message || 'Request failed')
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    // Handle timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection and try again.')
    }

    throw error
  }
}

class ClientAuthAPI {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('client_token')
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('client_refresh_token')
  }

  private setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem('client_token', accessToken)
    if (refreshToken) {
      localStorage.setItem('client_refresh_token', refreshToken)
    }
  }

  private setUser(user: ClientUser): void {
    localStorage.setItem('client_user', JSON.stringify(user))
  }

  getCurrentUser(): ClientUser | null {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem('client_user')
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser()
  }

  // ============================================
  // OAUTH METHODS
  // ============================================

  // Get Google Client ID
  async getGoogleClientId(): Promise<string> {
    const response = await fetch(`${API_URL}/api/client/auth/google-client-id`)
    if (!response.ok) throw new Error('Failed to get Google client ID')
    const data = await response.json()
    return data.client_id
  }

  // Get LinkedIn Client Config
  async getLinkedInConfig(): Promise<{ client_id: string; redirect_uri: string; scope: string }> {
    const response = await fetch(`${API_URL}/api/client/auth/linkedin-client-id`)
    if (!response.ok) throw new Error('Failed to get LinkedIn config')
    return response.json()
  }

  // Google OAuth Login
  async googleLogin(credential: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/client/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    })

    const data = await response.json()

    if (!response.ok) {
      const error = data as ApiError
      throw new Error(error.detail || 'Google login failed')
    }

    this.setTokens(data.access_token, data.refresh_token)
    this.setUser(data.user)
    return data
  }

  // LinkedIn OAuth Login
  async linkedinLogin(code: string, redirectUri: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/client/auth/linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    })

    const data = await response.json()

    if (!response.ok) {
      const error = data as ApiError
      throw new Error(error.detail || 'LinkedIn login failed')
    }

    this.setTokens(data.access_token, data.refresh_token)
    this.setUser(data.user)
    return data
  }

  // ============================================
  // EMAIL/PASSWORD METHODS
  // ============================================

  // Register new user
  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await fetch(`${API_URL}/api/client/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      const error = result as ApiError
      throw new Error(error.detail || 'Registration failed')
    }

    return result
  }

  // Verify email with code
  async verifyEmail(email: string, code: string): Promise<VerifyEmailResponse> {
    const response = await fetch(`${API_URL}/api/client/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })

    const result = await response.json()

    if (!response.ok) {
      const error = result as ApiError
      throw new Error(error.detail || 'Verification failed')
    }

    return result
  }

  // Resend verification code
  async resendCode(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/client/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const result = await response.json()

    if (!response.ok) {
      const error = result as ApiError
      throw new Error(error.detail || 'Failed to resend code')
    }

    return result
  }

  // Email/Password Login
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/client/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      const error = data as ApiError
      // Return special codes for handling specific states
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        throw new Error('EMAIL_NOT_VERIFIED')
      }
      if (error.code === 'PENDING_APPROVAL') {
        throw new Error('PENDING_APPROVAL')
      }
      throw new Error(error.detail || 'Login failed')
    }

    this.setTokens(data.access_token, data.refresh_token)
    this.setUser(data.user)
    return data
  }

  // Forgot password
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/client/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const result = await response.json()

    if (!response.ok) {
      const error = result as ApiError
      throw new Error(error.detail || 'Request failed')
    }

    return result
  }

  // Reset password
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/client/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    const result = await response.json()

    if (!response.ok) {
      const error = result as ApiError
      throw new Error(error.detail || 'Password reset failed')
    }

    return result
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  // Refresh access token
  async refreshToken(): Promise<{ access_token: string }> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token')

    const response = await fetch(`${API_URL}/api/client/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      this.logout()
      throw new Error('Session expired')
    }

    const data = await response.json()
    localStorage.setItem('client_token', data.access_token)
    return data
  }

  // Get current user from API
  async getMe(): Promise<ClientUser> {
    const token = this.getToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/api/client/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      // Try to refresh token
      if (response.status === 401) {
        try {
          await this.refreshToken()
          // Retry with new token
          const retryResponse = await fetch(`${API_URL}/api/client/auth/me`, {
            headers: { Authorization: `Bearer ${this.getToken()}` },
          })
          if (retryResponse.ok) {
            return retryResponse.json()
          }
        } catch {
          this.logout()
        }
      }
      throw new Error('Session expired')
    }

    const user = await response.json()
    this.setUser(user)
    return user
  }

  // Logout
  async logout(): Promise<void> {
    const token = this.getToken()
    if (token) {
      try {
        await fetch(`${API_URL}/api/client/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // Ignore errors during logout
      }
    }
    localStorage.removeItem('client_token')
    localStorage.removeItem('client_refresh_token')
    localStorage.removeItem('client_user')
  }
}

export const clientAuthApi = new ClientAuthAPI()

// ============================================
// CLIENT DATA APIs - Using shared backend
// These use the same endpoints as admin but
// filtered by client's company_id
// ============================================

// Projects API - Client view of their projects
export const clientProjectsApi = {
  // List all projects for the client's company
  list: (params?: { page?: number; page_size?: number; stage?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.page_size) query.set('page_size', params.page_size.toString())
    if (params?.stage) query.set('stage', params.stage)
    return fetchClientApi<{ projects: Project[]; total: number }>(`/client/projects?${query}`)
  },

  // Get single project details
  get: (id: number) => fetchClientApi<Project>(`/client/projects/${id}`),

  // Get project milestones
  getMilestones: (id: number) => fetchClientApi<{ milestones: ProjectMilestone[] }>(`/client/projects/${id}/milestones`),

  // Get project timeline/activity
  getTimeline: (id: number) => fetchClientApi<{ timeline: Activity[] }>(`/client/projects/${id}/timeline`),
}

// Documents API - Client view of shared documents
export const clientDocumentsApi = {
  // List documents for a project (client-visible only)
  listByProject: (projectId: number) =>
    fetchClientApi<{ documents: Document[]; total: number }>(`/client/documents/project/${projectId}`),

  // Upload a document to a project
  upload: async (formData: FormData): Promise<Document> => {
    const token = getClientToken()
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    // Don't set Content-Type for FormData - browser will set it with boundary
    const response = await fetch(`${API_URL}${API_BASE}/client/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
      throw new Error(error.detail || 'Upload failed')
    }
    return response.json()
  },

  // Get download URL
  download: (documentId: number) => `${API_URL}${API_BASE}/client/documents/${documentId}/download`,

  // Delete a client-uploaded document
  delete: (documentId: number) =>
    fetchClientApi<void>(`/client/documents/${documentId}`, { method: 'DELETE' }),
}

// Messages API - Client communication with admin
export const clientMessagesApi = {
  // Get all messages for the client's company
  list: (projectId?: number, page: number = 1) => {
    const query = new URLSearchParams()
    query.set('page', page.toString())
    if (projectId) query.set('project_id', projectId.toString())
    return fetchClientApi<{ messages: Message[]; total: number; unread_count: number }>(
      `/client/messages?${query}`
    )
  },

  // Get a single message
  get: (messageId: number) => fetchClientApi<Message>(`/client/messages/${messageId}`),

  // Get replies to a message
  getReplies: (messageId: number) =>
    fetchClientApi<{ messages: Message[]; total: number }>(`/client/messages/${messageId}/replies`),

  // Send a new message
  send: (data: { project_id?: number; subject?: string; content: string; parent_id?: number }) =>
    fetchClientApi<Message>(`/client/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Mark message as read
  markAsRead: (messageId: number) =>
    fetchClientApi<{ success: boolean }>(`/client/messages/${messageId}/read`, { method: 'PATCH' }),

  // Mark all messages as read
  markAllAsRead: () =>
    fetchClientApi<{ success: boolean }>(`/client/messages/read-all`, { method: 'PATCH' }),
}

// Notifications API - Uses CRM notification system
export const clientNotificationsApi = {
  // List notifications for client
  list: (params?: { unread_only?: boolean; limit?: number }) => {
    const query = new URLSearchParams()
    if (params?.unread_only) query.set('unread_only', 'true')
    if (params?.limit) query.set('limit', params.limit.toString())
    return fetchClientApi<{ notifications: Notification[]; unread_count: number; total: number }>(
      `/client/notifications?${query}`
    )
  },

  // Mark notification as read
  markAsRead: (notificationId: string) =>
    fetchClientApi<{ success: boolean }>(`/client/notifications/${notificationId}/read`, { method: 'PATCH' }),

  // Mark all as read
  markAllAsRead: () =>
    fetchClientApi<{ success: boolean }>(`/client/notifications/read-all`, { method: 'PATCH' }),

  // Delete notification
  delete: (notificationId: string) =>
    fetchClientApi<{ success: boolean }>(`/client/notifications/${notificationId}`, { method: 'DELETE' }),

  // Clear all notifications
  clearAll: () =>
    fetchClientApi<{ success: boolean }>(`/client/notifications`, { method: 'DELETE' }),
}

// Dashboard API - Client dashboard data
export const clientDashboardApi = {
  // Get dashboard summary stats
  getStats: () => fetchClientApi<{
    projects_count: number
    active_projects: number
    documents_count: number
    unread_messages: number
    pending_actions: number
  }>(`/client/dashboard/stats`),

  // Get recent activity
  getActivity: (limit: number = 10) =>
    fetchClientApi<{ activities: Activity[] }>(`/client/dashboard/activity?limit=${limit}`),

  // Get upcoming milestones
  getUpcomingMilestones: () =>
    fetchClientApi<{ milestones: (ProjectMilestone & { project_name: string })[] }>(`/client/dashboard/milestones`),
}

// Profile API - Client profile management
export const clientProfileApi = {
  // Get profile
  get: () => fetchClientApi<ClientUser>(`/client/profile`),

  // Update profile
  update: (data: { name?: string; phone?: string; avatar_url?: string }) =>
    fetchClientApi<ClientUser>(`/client/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Complete onboarding
  completeOnboarding: () =>
    fetchClientApi<{ success: boolean }>(`/client/profile/onboarding-complete`, { method: 'POST' }),

  // Change password
  changePassword: (currentPassword: string, newPassword: string) =>
    fetchClientApi<{ message: string }>(`/client/profile/change-password`, {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }),
}
