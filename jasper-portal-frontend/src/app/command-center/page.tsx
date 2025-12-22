'use client';

import { useState } from 'react';
import { Bell, User, RefreshCw, Settings, Zap, AlertTriangle } from 'lucide-react';
import {
  BusinessPortfolio,
  SystemSwitchboard,
  LiveMetrics,
  RecentAlerts,
  ScheduledTasks,
  InfrastructureMap,
} from '@/components/command-center';
import { useCommandCenter } from '@/hooks/useCommandCenter';
import {
  Business,
  ServiceComponent,
  Alert,
  ScheduledTask,
  DashboardMetrics,
} from '@/types/command-center';

// Static business data - this is configuration, not fake metrics
const JASPER_BUSINESSES: Business[] = [
  {
    id: 'jasper-crm',
    name: 'JASPER CRM',
    shortName: 'CRM',
    description: 'Lead management, client tracking, and sales pipeline automation.',
    status: 'active',
    links: { dashboard: '/', api: '/docs' },
  },
  {
    id: 'jasper-content',
    name: 'JASPER Content Engine',
    shortName: 'Content',
    description: 'AI-powered blog generation, SEO optimization, and content pipeline.',
    status: 'active',
    links: { api: '/docs' },
  },
  {
    id: 'jasper-portal',
    name: 'JASPER Client Portal',
    shortName: 'Portal',
    description: 'Client-facing document upload and onboarding portal.',
    status: 'active',
    links: { website: 'https://client.jasperfinance.org' },
  },
];

// Static scheduled tasks - these are configured tasks, not live status
// TODO: Replace with real API when /api/jobs endpoint is available
const CONFIGURED_TASKS: ScheduledTask[] = [
  {
    id: 'task-backup',
    name: 'Database Backup',
    schedule: 'Daily 02:00',
    nextRun: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(),
    lastRun: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    lastStatus: 'unknown', // HONEST: we don't know the actual status
    enabled: true,
  },
  {
    id: 'task-pipeline',
    name: 'Content Pipeline',
    schedule: 'Every 6 hours',
    nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    lastRun: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    lastStatus: 'unknown',
    enabled: true,
  },
];

export default function CommandCenterPage() {
  // Use real data from API with 30-second auto-refresh
  const {
    businesses,
    services,
    alerts,
    scheduledTasks,
    metrics,
    lastUpdated,
    isLoading,
    error,
    refresh,
    acknowledgeAlert,
  } = useCommandCenter({ refreshInterval: 30000, autoRefresh: true });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  // HONEST: Show real data, don't hide failures with mock data
  // Use static config for businesses (this is configuration, not live data)
  const displayBusinesses = JASPER_BUSINESSES;

  // Services come from live API health check - show what we actually have
  // If empty, it means the API doesn't provide service-level health
  const displayServices = services;

  // Alerts come from API - empty means no alerts endpoint exists
  const displayAlerts = alerts;

  // Tasks are configured schedules - TODO: replace with real API data
  const displayTasks = CONFIGURED_TASKS;

  // Metrics come directly from API - null if unreachable, -1 for unavailable fields
  const displayMetrics = metrics;

  const unacknowledgedCount = displayAlerts.filter((a) => !a.acknowledged).length;

  // Calculate real service health from actual data
  const healthyServices = displayServices.filter(s => s.status === 'healthy').length;
  const totalServices = displayServices.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Always dark navy regardless of theme */}
      <header className="bg-gradient-to-r from-[#0F2A3C] via-[#0F2A3C] to-[#0F172A] text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-jasper-emerald/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-jasper-emerald" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">JASPER CONTROL CENTER</h1>
              <p className="text-sm text-gray-300">System Infrastructure - VPS 72.61.201.237</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Real-time status indicator */}
            <div className="flex items-center gap-2 text-sm">
              {error ? (
                <span className="flex items-center gap-1 text-red-300">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  API Error
                </span>
              ) : isLoading ? (
                <span className="flex items-center gap-1 text-yellow-300">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  Loading
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-300">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {healthyServices}/{totalServices} Services
                </span>
              )}
            </div>
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              disabled={isRefreshing}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5" />
              {unacknowledgedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {unacknowledgedCount}
                </span>
              )}
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-jasper-emerald flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* API Error Banner - HONEST about failures */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">API Connection Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <p className="text-red-500 text-xs mt-2">
                Some data may be unavailable. Check api.jasperfinance.org
              </p>
            </div>
          </div>
        )}

        {/* Infrastructure Map - Does its own live health checks */}
        <InfrastructureMap
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Business Portfolio - Static configuration */}
        <BusinessPortfolio
          businesses={displayBusinesses}
          onBusinessClick={(business) => console.log('Business clicked:', business)}
        />

        {/* System Switchboard - Shows ONLY services we can actually verify */}
        {displayServices.length > 0 ? (
          <SystemSwitchboard
            services={displayServices}
            onServiceClick={(service) => console.log('Service clicked:', service)}
          />
        ) : (
          <div className="bg-white rounded-xl border border-orange-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">System Switchboard</h2>
            </div>
            <p className="text-gray-600 text-sm">
              No service-level health data available. The API only provides overall health status.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              To enable detailed service monitoring, implement /api/health/detailed endpoint in the backend.
            </p>
          </div>
        )}

        {/* Bottom Section: Metrics, Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Metrics - HONEST about what's available */}
          <div className="lg:col-span-2">
            <LiveMetrics metrics={displayMetrics} isLoading={isLoading} />
          </div>

          {/* Recent Alerts - HONEST that endpoint doesn't exist */}
          <div>
            {displayAlerts.length > 0 ? (
              <RecentAlerts
                alerts={displayAlerts}
                onAlertClick={(alert) => console.log('Alert clicked:', alert)}
                onAcknowledge={acknowledgeAlert}
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
                <div className="text-center py-8">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-orange-300" />
                  <p className="text-gray-500 text-sm">No alerts endpoint available</p>
                  <p className="text-gray-400 text-xs mt-2">
                    Implement /api/system/alerts to enable alerts
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Tasks - Shows configured tasks, notes they're not live */}
        <div className="bg-white rounded-xl border border-orange-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Scheduled Tasks</h2>
            <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded">
              Static Config - No Live API
            </span>
          </div>
          <ScheduledTasks
            tasks={displayTasks}
            onTaskClick={(task) => console.log('Task clicked:', task)}
          />
          <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
            Task status is not live. Implement /api/system/jobs endpoint for real status.
          </p>
        </div>

        {/* Footer - HONEST about data sources */}
        <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
          <p>Last updated: {new Date(lastUpdated).toLocaleString()}</p>
          <p className="mt-1">
            Data from: api.jasperfinance.org
            {error && <span className="text-red-500 ml-2">(connection error)</span>}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            JASPER Financial Architecture - Command Center v1.1 (Honest Mode)
          </p>
        </div>
      </main>
    </div>
  );
}
