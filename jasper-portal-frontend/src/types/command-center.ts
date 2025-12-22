/**
 * Command Center Types
 * Kutlwano Holdings Master Control Dashboard
 */

// Business Portfolio Types
export type BusinessStatus = 'active' | 'planning' | 'concept' | 'issues' | 'paused';

export interface Business {
  id: string;
  name: string;
  shortName: string;
  description: string;
  status: BusinessStatus;
  icon?: string;
  color?: string;
  metrics?: {
    revenue?: number;
    leads?: number;
    users?: number;
    custom?: Record<string, number>;
  };
  links?: {
    dashboard?: string;
    docs?: string;
    api?: string;
    website?: string;
  };
}

// Service/Component Types
export type ServiceStatus = 'healthy' | 'warning' | 'error' | 'unknown' | 'disabled';
export type ServiceCategory = 'jasper' | 'aleph' | 'database' | 'background' | 'middleware' | 'external';

export interface ServiceComponent {
  id: string;
  name: string;
  shortName: string;
  category: ServiceCategory;
  status: ServiceStatus;
  port?: number;
  endpoint?: string;
  lastCheck?: string;
  metrics?: {
    responseTime?: number;
    requestCount?: number;
    errorRate?: number;
    uptime?: number;
  };
  details?: Record<string, any>;
}

// Alert Types
export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
  acknowledged?: boolean;
}

// Scheduled Task Types
// 'unknown' added for honest status when we don't have live job status API
export type TaskStatus = 'success' | 'failed' | 'partial' | 'running' | 'pending' | 'unknown';

export interface ScheduledTask {
  id: string;
  name: string;
  schedule: string; // cron expression or human readable
  nextRun: string;
  lastRun?: string;
  lastStatus?: TaskStatus;
  enabled: boolean;
}

// Dashboard Metrics
export interface DashboardMetrics {
  apiRequests24h: number;
  activeLeads: number;
  blogPosts: number;
  jobSuccessRate: number;
  avgResponseTime: number;
  uptime30d: number;
}

// Health Check Response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: Record<string, {
    status: ServiceStatus;
    message?: string;
    error?: string;
    [key: string]: any;
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  duration_ms: number;
}

// Command Center State
export interface CommandCenterState {
  businesses: Business[];
  services: ServiceComponent[];
  alerts: Alert[];
  scheduledTasks: ScheduledTask[];
  metrics: DashboardMetrics;
  lastUpdated: string;
  isLoading: boolean;
  error?: string;
}
