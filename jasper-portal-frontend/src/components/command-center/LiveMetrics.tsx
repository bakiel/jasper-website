'use client';

import { DashboardMetrics } from '@/types/command-center';
import { Activity, Users, FileText, CheckCircle, Clock, Shield, AlertTriangle } from 'lucide-react';

interface LiveMetricsProps {
  metrics: DashboardMetrics | null;
  isLoading?: boolean;
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  suffix?: string;
  isAvailable: boolean; // true if data comes from API, false if not available
}

function MetricCard({ label, value, icon, suffix, isAvailable }: MetricCardProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        isAvailable ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-400'
      }`}>
        {icon}
      </div>
      <div>
        {isAvailable ? (
          <p className="text-2xl font-semibold text-gray-900">
            {value.toLocaleString()}
            {suffix && <span className="text-sm font-normal text-gray-500">{suffix}</span>}
          </p>
        ) : (
          <p className="text-xl font-medium text-orange-500">N/A</p>
        )}
        <p className="text-sm text-gray-500">
          {label}
          {!isAvailable && <span className="text-xs text-orange-400 ml-1">(no API)</span>}
        </p>
      </div>
    </div>
  );
}

export function LiveMetrics({ metrics, isLoading }: LiveMetricsProps) {
  // Handle loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Live Metrics</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span>Loading...</span>
          </div>
        </div>
        <div className="animate-pulse grid grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // Handle null metrics (API unreachable)
  if (!metrics) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Live Metrics</h2>
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertTriangle className="w-4 h-4" />
            <span>API Unreachable</span>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-300" />
          <p>Unable to fetch metrics from API</p>
          <p className="text-sm mt-1">Check if api.jasperfinance.org is accessible</p>
        </div>
      </div>
    );
  }

  // Count available vs unavailable metrics
  const availableCount = [
    metrics.activeLeads,
    metrics.blogPosts,
  ].filter(v => v >= 0).length;

  const unavailableCount = [
    metrics.apiRequests24h,
    metrics.jobSuccessRate,
    metrics.avgResponseTime,
    metrics.uptime30d,
  ].filter(v => v < 0).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Live Metrics</h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {availableCount} from API
          </span>
          {unavailableCount > 0 && (
            <span className="flex items-center gap-1 text-orange-500">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              {unavailableCount} unavailable
            </span>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          label="API Requests (24h)"
          value={metrics.apiRequests24h}
          icon={<Activity className="w-5 h-5" />}
          isAvailable={metrics.apiRequests24h >= 0}
        />
        <MetricCard
          label="Active Leads"
          value={metrics.activeLeads}
          icon={<Users className="w-5 h-5" />}
          isAvailable={metrics.activeLeads >= 0}
        />
        <MetricCard
          label="Blog Posts"
          value={metrics.blogPosts}
          icon={<FileText className="w-5 h-5" />}
          isAvailable={metrics.blogPosts >= 0}
        />
        <MetricCard
          label="Job Success Rate"
          value={metrics.jobSuccessRate}
          suffix="%"
          icon={<CheckCircle className="w-5 h-5" />}
          isAvailable={metrics.jobSuccessRate >= 0}
        />
        <MetricCard
          label="Avg Response Time"
          value={metrics.avgResponseTime}
          suffix="ms"
          icon={<Clock className="w-5 h-5" />}
          isAvailable={metrics.avgResponseTime >= 0}
        />
        <MetricCard
          label="Uptime (30d)"
          value={metrics.uptime30d}
          suffix="%"
          icon={<Shield className="w-5 h-5" />}
          isAvailable={metrics.uptime30d >= 0}
        />
      </div>

      {/* Honest Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Data source: api.jasperfinance.org/api/stats
          {unavailableCount > 0 && (
            <span className="ml-2 text-orange-400">
              ({unavailableCount} metrics require backend implementation)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
