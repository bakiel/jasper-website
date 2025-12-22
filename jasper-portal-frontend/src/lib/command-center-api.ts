/**
 * Command Center API Client
 * Connects to JASPER CRM health endpoints
 *
 * HONEST IMPLEMENTATION - Only returns real data from API
 * No hardcoded values, no fake metrics
 */

import {
  Business,
  ServiceComponent,
  Alert,
  ScheduledTask,
  DashboardMetrics,
  HealthCheckResponse,
  ServiceStatus,
} from '@/types/command-center';

// Production API URL
const JASPER_API_URL = process.env.NEXT_PUBLIC_JASPER_API_URL || 'https://api.jasperfinance.org';

/**
 * Raw API response types (what the API actually returns)
 */
interface RawHealthResponse {
  status: string; // "ok" or other values
  timestamp?: string;
}

interface RawStatsResponse {
  total_leads: number;
  priority_leads: number;
  new_leads: number;
  linkedin_posts: number;
  system_status: string; // "operational" or other
}

/**
 * Fetch health status from JASPER CRM
 * Returns actual API response, properly mapped
 */
export async function fetchJasperHealth(): Promise<HealthCheckResponse | null> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${JASPER_API_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const duration_ms = Date.now() - startTime;

    if (!response.ok) {
      // API returned error - this is real unhealthy status
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {}, // No fake checks - we don't have detailed health data
        summary: {
          total: 1,
          passed: 0,
          failed: 1,
          warnings: 0,
        },
        duration_ms,
      };
    }

    const data: RawHealthResponse = await response.json();

    // API returns "ok" for healthy - map correctly
    const isHealthy = data.status === 'ok' || data.status === 'healthy';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: data.timestamp || new Date().toISOString(),
      checks: {}, // Empty - API doesn't provide detailed checks
      summary: {
        total: 1,
        passed: isHealthy ? 1 : 0,
        failed: isHealthy ? 0 : 1,
        warnings: 0,
      },
      duration_ms,
    };
  } catch (error) {
    console.error('Failed to fetch JASPER health:', error);
    return null; // null means we couldn't reach the API at all
  }
}

/**
 * Fetch health status from ALEPH AI
 * HONEST: ALEPH is not deployed, returns null
 */
export async function fetchAlephHealth(): Promise<HealthCheckResponse | null> {
  return null; // ALEPH is not active
}

/**
 * Fetch system metrics from JASPER CRM
 * HONEST: Only returns data that actually comes from the API
 * Fields not available from API are set to -1 to indicate "not available"
 */
export async function fetchSystemMetrics(): Promise<DashboardMetrics | null> {
  try {
    const response = await fetch(`${JASPER_API_URL}/api/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data: RawStatsResponse = await response.json();

    // HONEST MAPPING - only real data from API
    // -1 indicates "data not available from API"
    return {
      apiRequests24h: -1, // NOT AVAILABLE - API doesn't track this
      activeLeads: data.total_leads, // REAL from API
      blogPosts: data.linkedin_posts, // REAL from API
      jobSuccessRate: -1, // NOT AVAILABLE - API doesn't track this
      avgResponseTime: -1, // NOT AVAILABLE - API doesn't track this
      uptime30d: -1, // NOT AVAILABLE - API doesn't track this
    };
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return null;
  }
}

/**
 * Fetch recent alerts from JASPER CRM
 * Endpoint: /api/system/alerts (added Dec 2025)
 */
export async function fetchAlerts(limit: number = 10): Promise<Alert[]> {
  try {
    const response = await fetch(`${JASPER_API_URL}/api/system/alerts?limit=${limit}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Alerts API returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Map API response to Alert type
    if (data.success && Array.isArray(data.alerts)) {
      return data.alerts.map((alert: any) => ({
        id: alert.id || `alert-${Date.now()}`,
        type: mapAlertLevel(alert.level),
        message: alert.message,
        timestamp: alert.timestamp,
        acknowledged: false,
        metadata: alert.metadata || {},
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return [];
  }
}

// Map alert levels from API to our Alert type
function mapAlertLevel(level: string): 'info' | 'warning' | 'error' | 'critical' {
  switch (level?.toLowerCase()) {
    case 'critical': return 'critical';
    case 'error': return 'error';
    case 'warning': return 'warning';
    default: return 'info';
  }
}

/**
 * Fetch job history from JASPER CRM
 * Endpoint: /api/system/jobs (added Dec 2025)
 */
export async function fetchJobs(limit: number = 20): Promise<any[]> {
  try {
    const response = await fetch(`${JASPER_API_URL}/api/system/jobs?limit=${limit}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Jobs API returned ${response.status}`);
      return [];
    }

    const data = await response.json();

    // Map API response to job format
    if (data.success && Array.isArray(data.jobs)) {
      return data.jobs.map((job: any) => ({
        id: job.id || `job-${Date.now()}`,
        name: job.name,
        status: job.status,
        startTime: job.start_time,
        endTime: job.end_time,
        duration: job.duration_ms,
        metadata: job.metadata || {},
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return [];
  }
}

/**
 * Convert health check response to service components
 * HONEST: Only creates services for data we actually have
 */
export function healthToServices(
  jasperHealth: HealthCheckResponse | null,
  alephHealth: HealthCheckResponse | null
): ServiceComponent[] {
  const services: ServiceComponent[] = [];

  // HONEST: We only have overall API health, not individual service health
  // The API doesn't provide database, redis, or service-level health checks

  if (jasperHealth) {
    // Only add the one service we can actually verify - the API itself
    services.push({
      id: 'jasper-api',
      name: 'JASPER CRM API',
      shortName: 'API',
      category: 'jasper',
      status: jasperHealth.status === 'healthy' ? 'healthy' : 'error',
      port: 8000,
      metrics: {
        responseTime: jasperHealth.duration_ms,
      },
    });
  }

  // NOTE: We do NOT add fake services for database, redis, etc.
  // because the API doesn't provide health checks for those

  return services;
}

/**
 * Get system status string
 * HONEST: Fetches real status from API
 */
export async function fetchSystemStatus(): Promise<string> {
  try {
    const response = await fetch(`${JASPER_API_URL}/api/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) return 'error';

    const data: RawStatsResponse = await response.json();
    return data.system_status || 'unknown';
  } catch {
    return 'unreachable';
  }
}

/**
 * Send test alert to all channels
 * NOTE: This endpoint may not exist in current API
 */
export async function testAlertChannels(): Promise<boolean> {
  try {
    const response = await fetch(`${JASPER_API_URL}/api/system/alerts/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to test alerts:', error);
    return false;
  }
}

/**
 * Trigger content pipeline manually
 * NOTE: This endpoint may not exist in current API
 */
export async function triggerPipeline(options?: {
  maxPosts?: number;
  autoPublish?: boolean;
  dryRun?: boolean;
}): Promise<any> {
  try {
    const response = await fetch(`${JASPER_API_URL}/api/system/pipeline/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        max_posts: options?.maxPosts || 3,
        auto_publish: options?.autoPublish || false,
        dry_run: options?.dryRun || false,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to trigger pipeline:', error);
    throw error;
  }
}

/**
 * Trigger database backup manually
 * NOTE: This endpoint may not exist in current API
 */
export async function triggerBackup(): Promise<any> {
  try {
    const response = await fetch(`${JASPER_API_URL}/api/system/backups/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to trigger backup:', error);
    throw error;
  }
}
