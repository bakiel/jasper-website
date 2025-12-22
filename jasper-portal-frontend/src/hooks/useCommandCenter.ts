'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Business,
  ServiceComponent,
  Alert,
  ScheduledTask,
  DashboardMetrics,
  CommandCenterState,
} from '@/types/command-center';
import {
  fetchJasperHealth,
  fetchAlephHealth,
  fetchSystemMetrics,
  fetchAlerts,
  healthToServices,
} from '@/lib/command-center-api';

// JASPER system components only
const BUSINESSES: Business[] = [
  {
    id: 'jasper-crm',
    name: 'JASPER CRM',
    shortName: 'CRM',
    description: 'Lead management, client tracking, and sales pipeline automation.',
    status: 'active',
    links: { dashboard: '/', api: '/api/v1/leads' },
  },
  {
    id: 'jasper-content',
    name: 'JASPER Content Engine',
    shortName: 'Content',
    description: 'AI-powered blog generation, SEO optimization, and content pipeline.',
    status: 'active',
    links: { api: '/api/v1/content' },
  },
  {
    id: 'jasper-portal',
    name: 'JASPER Client Portal',
    shortName: 'Portal',
    description: 'Client-facing document upload and onboarding portal.',
    status: 'active',
    links: { dashboard: '/portal' },
  },
];

// Static scheduled tasks (would come from API in production)
const SCHEDULED_TASKS: ScheduledTask[] = [
  {
    id: 'task-backup',
    name: 'Database Backup',
    schedule: 'Daily 02:00',
    nextRun: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(),
    lastRun: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    lastStatus: 'success',
    enabled: true,
  },
  {
    id: 'task-pipeline',
    name: 'Content Pipeline',
    schedule: 'Every 6 hours',
    nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    lastRun: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    lastStatus: 'success',
    enabled: true,
  },
  {
    id: 'task-news',
    name: 'News Scan',
    schedule: 'Every 1 hour',
    nextRun: new Date(Date.now() + 23 * 60 * 1000).toISOString(),
    lastRun: new Date(Date.now() - 37 * 60 * 1000).toISOString(),
    lastStatus: 'success',
    enabled: true,
  },
  {
    id: 'task-enrich',
    name: 'Lead Enrichment',
    schedule: 'Every 4 hours',
    nextRun: new Date(Date.now() + 105 * 60 * 1000).toISOString(),
    lastRun: new Date(Date.now() - 135 * 60 * 1000).toISOString(),
    lastStatus: 'partial',
    enabled: true,
  },
];

// Default metrics when API unavailable
const DEFAULT_METRICS: DashboardMetrics = {
  apiRequests24h: 0,
  activeLeads: 0,
  blogPosts: 0,
  jobSuccessRate: 0,
  avgResponseTime: 0,
  uptime30d: 0,
};

interface UseCommandCenterOptions {
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

interface UseCommandCenterReturn extends CommandCenterState {
  refresh: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => void;
}

export function useCommandCenter(options: UseCommandCenterOptions = {}): UseCommandCenterReturn {
  const { refreshInterval = 30000, autoRefresh = true } = options;

  const [state, setState] = useState<CommandCenterState>({
    businesses: BUSINESSES,
    services: [],
    alerts: [],
    scheduledTasks: SCHEDULED_TASKS,
    metrics: DEFAULT_METRICS,
    lastUpdated: new Date().toISOString(),
    isLoading: true,
    error: undefined,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      // Fetch all data in parallel
      const [jasperHealth, alephHealth, metrics, alerts] = await Promise.all([
        fetchJasperHealth(),
        fetchAlephHealth(),
        fetchSystemMetrics(),
        fetchAlerts(10),
      ]);

      // Convert health checks to services
      const services = healthToServices(jasperHealth, alephHealth);

      // Update business metrics from API data if available
      const updatedBusinesses = BUSINESSES.map((business) => {
        if (business.id === 'jasper' && metrics) {
          return {
            ...business,
            metrics: {
              leads: metrics.activeLeads,
              revenue: 0, // Would come from financial data
            },
          };
        }
        return business;
      });

      setState({
        businesses: updatedBusinesses,
        services,
        alerts,
        scheduledTasks: SCHEDULED_TASKS, // Would come from API
        metrics: metrics || DEFAULT_METRICS,
        lastUpdated: new Date().toISOString(),
        isLoading: false,
        error: undefined,
      });
    } catch (error) {
      console.error('Failed to fetch command center data:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data',
      }));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, autoRefresh, refreshInterval]);

  // Acknowledge alert (local state only - would call API in production)
  const acknowledgeAlert = useCallback((alertId: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ),
    }));
    // TODO: Call API to persist acknowledgment
  }, []);

  return {
    ...state,
    refresh: fetchData,
    acknowledgeAlert,
  };
}
