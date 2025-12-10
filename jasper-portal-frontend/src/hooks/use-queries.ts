import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi, projectsApi, invoicesApi, dashboardApi } from '@/lib/api'

// Query Keys
export const queryKeys = {
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (params: any) => [...queryKeys.companies.lists(), params] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.companies.details(), id] as const,
  },
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (params: any) => [...queryKeys.projects.lists(), params] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.projects.details(), id] as const,
    milestones: (id: number) => [...queryKeys.projects.all, 'milestones', id] as const,
    timeline: (id: number) => [...queryKeys.projects.all, 'timeline', id] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (params: any) => [...queryKeys.invoices.lists(), params] as const,
    details: () => [...queryKeys.invoices.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.invoices.details(), id] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    metrics: () => [...queryKeys.dashboard.all, 'metrics'] as const,
    analytics: () => [...queryKeys.dashboard.all, 'analytics'] as const,
  },
}

// ============================================
// COMPANY HOOKS
// ============================================

export function useCompanies(params?: { page?: number; page_size?: number; status?: string }) {
  return useQuery({
    queryKey: queryKeys.companies.list(params),
    queryFn: () => companiesApi.list(params),
  })
}

export function useCompany(id: number) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: () => companiesApi.get(id),
    enabled: !!id,
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => companiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all })
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => companiesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() })
    },
  })
}

// ============================================
// PROJECT HOOKS
// ============================================

export function useProjects(params?: { page?: number; page_size?: number; company_id?: number; stage?: string }) {
  return useQuery({
    queryKey: queryKeys.projects.list(params),
    queryFn: () => projectsApi.list(params),
  })
}

export function useProject(id: number) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => projectsApi.get(id),
    enabled: !!id,
  })
}

export function useProjectMilestones(id: number) {
  return useQuery({
    queryKey: queryKeys.projects.milestones(id),
    queryFn: () => projectsApi.getMilestones(id),
    enabled: !!id,
  })
}

export function useProjectTimeline(id: number) {
  return useQuery({
    queryKey: queryKeys.projects.timeline(id),
    queryFn: () => projectsApi.getTimeline(id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => projectsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
    },
  })
}

export function useAdvanceProjectStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => projectsApi.advanceStage(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.timeline(id) })
    },
  })
}

// ============================================
// INVOICE HOOKS
// ============================================

export function useInvoices(params?: { page?: number; page_size?: number; company_id?: number; status?: string }) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: () => invoicesApi.list(params),
  })
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => invoicesApi.get(id),
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
    },
  })
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { payment_method: string; reference?: string } }) =>
      invoicesApi.markPaid(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

// ============================================
// DASHBOARD HOOKS
// ============================================

export function useDashboardMetrics() {
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(),
    queryFn: () => dashboardApi.getMetrics(),
  })
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: queryKeys.dashboard.analytics(),
    queryFn: () => dashboardApi.getAnalytics(),
  })
}
