'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Server,
  Database,
  Monitor,
  Cloud,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface ServiceConfig {
  id: string;
  name: string;
  domain?: string;
  port: number;
  type: 'frontend' | 'api' | 'database' | 'cache' | 'external';
  description: string;
  healthUrl?: string;
  links?: { label: string; url: string }[];
}

interface ServiceStatus extends ServiceConfig {
  status: 'healthy' | 'warning' | 'error' | 'unknown' | 'checking';
  responseTime?: number;
  lastChecked?: Date;
  errorMessage?: string;
}

interface InfrastructureMapProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

// JASPER Infrastructure Configuration - URLs to check
const SERVICE_CONFIG: ServiceConfig[] = [
  // Frontend Services
  {
    id: 'portal',
    name: 'Admin Portal',
    domain: 'crm.jasperfinance.org',
    port: 3000,
    type: 'frontend',
    description: 'Next.js Admin Dashboard - Projects, Clients, Invoices',
    healthUrl: 'https://crm.jasperfinance.org',
    links: [
      { label: 'Open Portal', url: 'https://crm.jasperfinance.org' },
    ],
  },
  {
    id: 'client-portal',
    name: 'Client Portal',
    domain: 'client.jasperfinance.org',
    port: 3004,
    type: 'frontend',
    description: 'Client-facing document upload and project tracking',
    healthUrl: 'https://client.jasperfinance.org',
    links: [
      { label: 'Open Client Portal', url: 'https://client.jasperfinance.org' },
    ],
  },
  {
    id: 'main-site',
    name: 'Marketing Site',
    domain: 'jasperfinance.org',
    port: 3001,
    type: 'frontend',
    description: 'Main marketing website with blog and intake forms',
    healthUrl: 'https://jasperfinance.org',
    links: [
      { label: 'Visit Site', url: 'https://jasperfinance.org' },
    ],
  },
  // API Services
  {
    id: 'crm-api',
    name: 'CRM API',
    domain: 'api.jasperfinance.org',
    port: 8001,
    type: 'api',
    description: 'FastAPI - Leads, Content, SEO, Webhooks, AI Agents',
    healthUrl: 'https://api.jasperfinance.org/health',
    links: [
      { label: 'API Docs', url: 'https://api.jasperfinance.org/docs' },
      { label: 'Health', url: 'https://api.jasperfinance.org/health' },
    ],
  },
  {
    id: 'express-api',
    name: 'Express API',
    domain: 'api.jasperfinance.org',
    port: 3003,
    type: 'api',
    description: 'Express.js - Contact forms, CRM proxy, webhooks',
    healthUrl: 'https://api.jasperfinance.org/api/health',
  },
  // Database & Cache (internal - checked via API)
  {
    id: 'postgres',
    name: 'PostgreSQL',
    port: 5432,
    type: 'database',
    description: 'Primary database - jasper_crm, jasper_portal',
    // Will be checked via CRM API db status
  },
  {
    id: 'redis',
    name: 'Redis',
    port: 6379,
    type: 'cache',
    description: 'Caching and session storage',
    // Will be checked via CRM API
  },
];

const typeConfig = {
  frontend: { icon: Monitor, color: 'bg-blue-500', label: 'Frontend' },
  api: { icon: Server, color: 'bg-emerald-500', label: 'API' },
  database: { icon: Database, color: 'bg-purple-500', label: 'Database' },
  cache: { icon: Cloud, color: 'bg-orange-500', label: 'Cache' },
  external: { icon: Globe, color: 'bg-cyan-500', label: 'External' },
};

const statusConfig = {
  healthy: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  unknown: { icon: AlertTriangle, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' },
  checking: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-50', border: 'border-blue-200' },
};

// Check a single service health
async function checkServiceHealth(config: ServiceConfig): Promise<ServiceStatus> {
  const startTime = Date.now();

  // For services without health URLs (database, cache), mark as unknown until we have a way to check
  if (!config.healthUrl) {
    return {
      ...config,
      status: 'unknown',
      lastChecked: new Date(),
      errorMessage: 'No health endpoint configured',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(config.healthUrl, {
      method: 'GET',
      signal: controller.signal,
      mode: 'no-cors', // Handle CORS for external checks
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // With no-cors, we can't read response but we know it connected
    // For same-origin requests, we can check status
    if (response.type === 'opaque') {
      // no-cors response - service is reachable
      return {
        ...config,
        status: responseTime < 2000 ? 'healthy' : 'warning',
        responseTime,
        lastChecked: new Date(),
      };
    }

    if (response.ok) {
      return {
        ...config,
        status: responseTime < 2000 ? 'healthy' : 'warning',
        responseTime,
        lastChecked: new Date(),
      };
    } else {
      return {
        ...config,
        status: 'error',
        responseTime,
        lastChecked: new Date(),
        errorMessage: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      ...config,
      status: 'error',
      responseTime,
      lastChecked: new Date(),
      errorMessage: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export function InfrastructureMap({ onRefresh, isRefreshing }: InfrastructureMapProps) {
  const [selectedNode, setSelectedNode] = useState<ServiceStatus | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>(
    SERVICE_CONFIG.map(config => ({ ...config, status: 'checking' as const }))
  );
  const [isChecking, setIsChecking] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState<Date | null>(null);

  // Check all services
  const checkAllServices = useCallback(async () => {
    setIsChecking(true);

    // Set all to checking state
    setServices(prev => prev.map(s => ({ ...s, status: 'checking' as const })));

    // Check all services in parallel
    const results = await Promise.all(
      SERVICE_CONFIG.map(config => checkServiceHealth(config))
    );

    setServices(results);
    setLastFullCheck(new Date());
    setIsChecking(false);

    // Update selected node if it was selected
    if (selectedNode) {
      const updated = results.find(r => r.id === selectedNode.id);
      if (updated) setSelectedNode(updated);
    }
  }, [selectedNode]);

  // Initial check on mount
  useEffect(() => {
    checkAllServices();

    // Auto-refresh every 30 seconds
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, [checkAllServices]);

  // Handle manual refresh
  const handleRefresh = async () => {
    await checkAllServices();
    onRefresh?.();
  };

  // Group services by type
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.type]) acc[service.type] = [];
    acc[service.type].push(service);
    return acc;
  }, {} as Record<string, ServiceStatus[]>);

  // Calculate stats
  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const warningCount = services.filter(s => s.status === 'warning').length;
  const errorCount = services.filter(s => s.status === 'error').length;
  const checkingCount = services.filter(s => s.status === 'checking').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-jasper-navy text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Infrastructure Map
              {isChecking && <Loader2 className="w-4 h-4 animate-spin" />}
            </h2>
            <p className="text-sm text-white/70 mt-1">
              JASPER Financial Architecture - VPS 72.61.201.237
              {lastFullCheck && (
                <span className="ml-2">
                  • Last check: {lastFullCheck.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              {checkingCount > 0 && (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {checkingCount} Checking
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                {healthyCount} Healthy
              </span>
              {warningCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  {warningCount} Warning
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  {errorCount} Error
                </span>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isChecking || isRefreshing}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              title="Refresh all health checks"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking || isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Domain Routing Overview */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Domain Routing (Live Status)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {services.filter(s => s.domain).map(service => {
            const statusCfg = statusConfig[service.status];
            return (
              <div
                key={service.id}
                className={`flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-2 border ${statusCfg.border}`}
              >
                {service.status === 'checking' ? (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${statusCfg.color.replace('text-', 'bg-')}`} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">{service.domain}</div>
                  <div className="text-xs text-gray-500">
                    → :{service.port}
                    {service.responseTime && (
                      <span className="ml-1 text-gray-400">({service.responseTime}ms)</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Service Grid */}
      <div className="p-6 space-y-6">
        {(['frontend', 'api', 'database', 'cache'] as const).map(type => {
          const typeServices = groupedServices[type];
          if (!typeServices?.length) return null;

          const config = typeConfig[type];
          const TypeIcon = config.icon;

          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded flex items-center justify-center ${config.color}`}>
                  <TypeIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-medium text-gray-700">{config.label} Services</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {typeServices.map(service => {
                  const statusCfg = statusConfig[service.status];
                  const StatusIcon = statusCfg.icon;

                  return (
                    <button
                      key={service.id}
                      onClick={() => setSelectedNode(selectedNode?.id === service.id ? null : service)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        selectedNode?.id === service.id
                          ? 'border-jasper-emerald bg-jasper-emerald/5'
                          : `${statusCfg.border} ${statusCfg.bg} hover:border-jasper-emerald/50`
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{service.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Port {service.port}
                            {service.responseTime && (
                              <span className="ml-2 text-gray-400">{service.responseTime}ms</span>
                            )}
                          </div>
                        </div>
                        <StatusIcon className={`w-5 h-5 ${statusCfg.color} ${service.status === 'checking' ? 'animate-spin' : ''}`} />
                      </div>
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{service.description}</p>
                      {service.errorMessage && service.status === 'error' && (
                        <p className="text-xs text-red-500 mt-1">{service.errorMessage}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Service Details */}
      {selectedNode && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">{selectedNode.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{selectedNode.description}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                <span>Port: {selectedNode.port}</span>
                {selectedNode.domain && <span>Domain: {selectedNode.domain}</span>}
                {selectedNode.healthUrl && <span>Health: {selectedNode.healthUrl}</span>}
                {selectedNode.responseTime && <span>Response: {selectedNode.responseTime}ms</span>}
                {selectedNode.lastChecked && (
                  <span>Checked: {selectedNode.lastChecked.toLocaleTimeString()}</span>
                )}
              </div>
              {selectedNode.errorMessage && (
                <p className="text-sm text-red-500 mt-2">Error: {selectedNode.errorMessage}</p>
              )}
            </div>
            {selectedNode.links && (
              <div className="flex gap-2">
                {selectedNode.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-jasper-emerald text-white rounded-lg hover:bg-jasper-emerald-dark transition-colors"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
