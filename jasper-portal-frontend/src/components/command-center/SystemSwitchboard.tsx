'use client';

import { ServiceComponent, ServiceCategory, ServiceStatus } from '@/types/command-center';
import { ServiceIndicator } from './ServiceIndicator';

interface SystemSwitchboardProps {
  services: ServiceComponent[];
  onServiceClick?: (service: ServiceComponent) => void;
}

const categoryConfig: Record<ServiceCategory, { label: string; color: string }> = {
  jasper: { label: 'JASPER Services', color: 'border-emerald-500' },
  aleph: { label: 'Other', color: 'border-blue-500' },
  database: { label: 'Database', color: 'border-purple-500' },
  background: { label: 'Background Services', color: 'border-orange-500' },
  middleware: { label: 'Middleware', color: 'border-gray-500' },
  external: { label: 'External Integrations', color: 'border-cyan-500' },
};

const categoryOrder: ServiceCategory[] = [
  'jasper',
  'database',
  'background',
  'external',
];

export function SystemSwitchboard({ services, onServiceClick }: SystemSwitchboardProps) {
  // Group services by category
  const groupedServices = categoryOrder.reduce((acc, category) => {
    acc[category] = services.filter((s) => s.category === category);
    return acc;
  }, {} as Record<ServiceCategory, ServiceComponent[]>);

  // Calculate overall health
  const healthyScount = services.filter((s) => s.status === 'healthy').length;
  const warningCount = services.filter((s) => s.status === 'warning').length;
  const errorCount = services.filter((s) => s.status === 'error').length;
  const totalActive = services.filter((s) => s.status !== 'disabled').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">System Switchboard</h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">{healthyScount} Healthy</span>
          </span>
          {warningCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-600">{warningCount} Warning</span>
            </span>
          )}
          {errorCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-gray-600">{errorCount} Error</span>
            </span>
          )}
        </div>
      </div>

      {/* Service Groups */}
      <div className="space-y-6">
        {categoryOrder.map((category) => {
          const categoryServices = groupedServices[category];
          if (categoryServices.length === 0) return null;

          const config = categoryConfig[category];

          return (
            <div key={category} className={`border-l-4 ${config.color} pl-4`}>
              <h3 className="text-sm font-medium text-gray-700 mb-3">{config.label}</h3>
              <div className="flex flex-wrap gap-2">
                {categoryServices.map((service) => (
                  <ServiceIndicator
                    key={service.id}
                    service={service}
                    onClick={() => onServiceClick?.(service)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>{totalActive} services monitored</span>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
