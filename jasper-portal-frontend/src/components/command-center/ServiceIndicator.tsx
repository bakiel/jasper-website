'use client';

import { ServiceComponent, ServiceStatus } from '@/types/command-center';
import { useState } from 'react';

interface ServiceIndicatorProps {
  service: ServiceComponent;
  onClick?: () => void;
}

const statusColors: Record<ServiceStatus, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  unknown: 'bg-gray-400',
  disabled: 'bg-gray-300',
};

const statusEmoji: Record<ServiceStatus, string> = {
  healthy: '🟢',
  warning: '🟡',
  error: '🔴',
  unknown: '⚪',
  disabled: '⚫',
};

export function ServiceIndicator({ service, onClick }: ServiceIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={onClick}
        className={`
          w-14 h-14 rounded-lg flex flex-col items-center justify-center
          border-2 transition-all duration-200 hover:scale-105
          ${service.status === 'healthy' ? 'border-green-300 bg-green-50' : ''}
          ${service.status === 'warning' ? 'border-yellow-300 bg-yellow-50' : ''}
          ${service.status === 'error' ? 'border-red-300 bg-red-50 animate-pulse' : ''}
          ${service.status === 'unknown' ? 'border-gray-300 bg-gray-50' : ''}
          ${service.status === 'disabled' ? 'border-gray-200 bg-gray-100 opacity-50' : ''}
        `}
      >
        <span className="text-lg">{statusEmoji[service.status]}</span>
        <span className="text-[10px] font-medium text-gray-700 leading-tight text-center">
          {service.shortName}
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            <div className="font-semibold">{service.name}</div>
            <div className="text-gray-300">
              Status: <span className={service.status === 'healthy' ? 'text-green-400' : 'text-yellow-400'}>
                {service.status}
              </span>
            </div>
            {service.port && (
              <div className="text-gray-400">Port: {service.port}</div>
            )}
            {service.metrics?.responseTime && (
              <div className="text-gray-400">{service.metrics.responseTime}ms</div>
            )}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}
