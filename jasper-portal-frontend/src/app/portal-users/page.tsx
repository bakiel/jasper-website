'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout'
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Building2,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  Filter,
} from 'lucide-react'
import { formatDate, getInitials, cn } from '@/lib/utils'

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.jasperfinance.org'

interface ClientUser {
  id: string
  email: string
  name: string
  full_name: string
  company?: string
  company_name?: string
  phone?: string
  avatar_url?: string
  has_google: boolean
  has_linkedin: boolean
  email_verified: boolean
  status: string
  approved_at?: string
  last_login?: string
  login_count: number
  created_at: string
}

interface ClientStats {
  active: number
  pending_approval: number
  pending_verification: number
  rejected: number
  total: number
  new_this_week: number
  active_today: number
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  pending_verification: { label: 'Awaiting Verification', color: 'bg-blue-100 text-blue-700', icon: Mail },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export default function PortalUsersPage() {
  const [users, setUsers] = useState<ClientUser[]>([])
  const [pendingUsers, setPendingUsers] = useState<ClientUser[]>([])
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch client users
  const fetchUsers = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('page_size', '20')
      if (statusFilter) params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const response = await fetch(`${API_URL}/api/admin/clients/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(data.clients || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  // Fetch pending users
  const fetchPending = useCallback(async () => {
    const token = getToken()
    if (!token) return

    try {
      const response = await fetch(`${API_URL}/api/admin/clients/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setPendingUsers(data.clients || [])
      }
    } catch {
      // Ignore errors for pending
    }
  }, [])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    const token = getToken()
    if (!token) return

    try {
      const response = await fetch(`${API_URL}/api/admin/clients/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch {
      // Ignore errors for stats
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    setLoading(true)
    Promise.all([fetchUsers(), fetchPending(), fetchStats()])
  }, [fetchUsers, fetchPending, fetchStats])

  // Handle approve
  const handleApprove = async (userId: string) => {
    const token = getToken()
    if (!token) return

    setActionLoading(userId)
    try {
      const response = await fetch(`${API_URL}/api/admin/clients/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ client_id: userId }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Failed to approve')
      }

      // Refresh data
      await Promise.all([fetchUsers(), fetchPending(), fetchStats()])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle reject
  const handleReject = async (userId: string) => {
    const token = getToken()
    if (!token) return

    if (!confirm('Are you sure you want to reject this user?')) return

    setActionLoading(userId)
    try {
      const response = await fetch(`${API_URL}/api/admin/clients/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ client_id: userId }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Failed to reject')
      }

      // Refresh data
      await Promise.all([fetchUsers(), fetchPending(), fetchStats()])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Filter users by search
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header title="Portal Users" subtitle="Manage client portal accounts" />

      <div className="p-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-jasper-emerald/10 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-jasper-emerald" />
                </div>
                <div>
                  <p className="text-sm text-jasper-slate">Active Users</p>
                  <p className="text-2xl font-semibold text-jasper-carbon">{stats.active}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-jasper-slate">Pending Approval</p>
                  <p className="text-2xl font-semibold text-jasper-carbon">
                    {stats.pending_approval}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-jasper-slate">New This Week</p>
                  <p className="text-2xl font-semibold text-jasper-carbon">{stats.new_this_week}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-jasper-slate">Active Today</p>
                  <p className="text-2xl font-semibold text-jasper-carbon">{stats.active_today}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approvals */}
        {pendingUsers.length > 0 && (
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <h2 className="font-semibold text-jasper-carbon">Pending Approvals</h2>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                  {pendingUsers.length}
                </span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {pendingUsers.map((user) => (
                <div key={user.id} className="p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-jasper-emerald/10 flex items-center justify-center flex-shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-jasper-emerald font-medium">
                        {getInitials(user.name)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-jasper-carbon truncate">{user.name}</h3>
                      {user.has_google && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">G</span>
                      )}
                      {user.has_linkedin && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">in</span>
                      )}
                    </div>
                    <p className="text-sm text-jasper-slate truncate">{user.email}</p>
                    {user.company && (
                      <p className="text-xs text-jasper-slate-light flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {user.company}
                      </p>
                    )}
                  </div>

                  {/* Registered */}
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-jasper-slate-light">Registered</p>
                    <p className="text-sm text-jasper-slate">
                      {formatDate(user.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={actionLoading === user.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-jasper-emerald text-white text-sm font-medium rounded-lg hover:bg-jasper-emerald-dark transition-colors disabled:opacity-50"
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(user.id)}
                      disabled={actionLoading === user.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jasper-slate-light" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="input w-48"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="pending_verification">Awaiting Verification</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={() => {
              setLoading(true)
              Promise.all([fetchUsers(), fetchPending(), fetchStats()])
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-jasper-emerald animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-12 h-12 text-jasper-slate-light mx-auto mb-4" />
            <h3 className="text-lg font-medium text-jasper-carbon mb-2">No Users Found</h3>
            <p className="text-jasper-slate text-sm">
              {searchQuery
                ? `No users match "${searchQuery}"`
                : 'No client portal users yet'}
            </p>
          </div>
        ) : (
          <div className="card">
            <div className="divide-y divide-border">
              {filteredUsers.map((user) => {
                const config = statusConfig[user.status] || statusConfig.pending_verification
                const StatusIcon = config.icon
                return (
                  <div
                    key={user.id}
                    className="p-4 flex items-center gap-4 hover:bg-surface-tertiary/50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-jasper-emerald/10 flex items-center justify-center flex-shrink-0">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-jasper-emerald font-medium">
                          {getInitials(user.name)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-jasper-carbon truncate">{user.name}</h3>
                        {user.has_google && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">G</span>
                        )}
                        {user.has_linkedin && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">in</span>
                        )}
                        <span className={cn('badge text-xs', config.color)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-jasper-slate truncate">{user.email}</p>
                      {user.company && (
                        <p className="text-xs text-jasper-slate-light flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {user.company}
                        </p>
                      )}
                    </div>

                    {/* Login Info */}
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-jasper-slate-light">Last Login</p>
                      <p className="text-sm text-jasper-slate">
                        {user.last_login ? formatDate(user.last_login) : 'Never'}
                      </p>
                      {user.login_count > 0 && (
                        <p className="text-xs text-jasper-slate-light">
                          {user.login_count} login{user.login_count !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Registered */}
                    <div className="text-right hidden lg:block">
                      <p className="text-xs text-jasper-slate-light">Registered</p>
                      <p className="text-sm text-jasper-slate">
                        {formatDate(user.created_at)}
                      </p>
                    </div>

                    {/* Action */}
                    <ChevronRight className="w-5 h-5 text-jasper-slate-light" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-jasper-slate">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} users
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
    </div>
  )
}
