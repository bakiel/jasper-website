'use client';

import { Alert, AlertLevel } from '@/types/command-center';
import { AlertTriangle, AlertCircle, Info, XCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentAlertsProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
  onAcknowledge?: (alertId: string) => void;
}

const alertConfig: Record<AlertLevel, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
  critical: {
    icon: <XCircle className="w-4 h-4" />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-600',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
  },
};

export function RecentAlerts({ alerts, onAlertClick, onAcknowledge }: RecentAlertsProps) {
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
        {unacknowledgedCount > 0 && (
          <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
            {unacknowledgedCount} new
          </span>
        )}
      </div>

      {/* Alert List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <CheckCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">No alerts - all systems normal</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = alertConfig[alert.level];
            const timeAgo = formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true });

            return (
              <div
                key={alert.id}
                onClick={() => onAlertClick?.(alert)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all
                  ${config.bg} ${config.border}
                  ${alert.acknowledged ? 'opacity-60' : ''}
                  hover:shadow-sm
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={config.text}>{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm font-medium ${config.text} truncate`}>
                        {alert.title}
                      </h4>
                      {!alert.acknowledged && onAcknowledge && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcknowledge(alert.id);
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {alerts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <a
            href="https://api.jasperfinance.org/docs#/System/list_alerts_api_system_alerts_get"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-jasper-emerald hover:underline"
          >
            View all alerts →
          </a>
        </div>
      )}
    </div>
  );
}
