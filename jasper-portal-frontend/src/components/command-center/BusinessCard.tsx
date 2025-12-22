'use client';

import { Business, BusinessStatus } from '@/types/command-center';
import { Building2, TrendingUp, Users, ExternalLink, FileCode, Globe } from 'lucide-react';
import Link from 'next/link';

interface BusinessCardProps {
  business: Business;
  onClick?: () => void;
}

const statusConfig: Record<BusinessStatus, { color: string; bg: string; label: string }> = {
  active: { color: 'text-green-600', bg: 'bg-green-100', label: 'ACTIVE' },
  planning: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'PLANNING' },
  concept: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'CONCEPT' },
  issues: { color: 'text-red-600', bg: 'bg-red-100', label: 'ISSUES' },
  paused: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'PAUSED' },
};

const statusEmoji: Record<BusinessStatus, string> = {
  active: '🟢',
  planning: '🟡',
  concept: '🔵',
  issues: '🔴',
  paused: '⚪',
};

export function BusinessCard({ business, onClick }: BusinessCardProps) {
  const status = statusConfig[business.status];
  const hasLinks = business.links && (business.links.dashboard || business.links.api || business.links.website || business.links.docs);

  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-200
        hover:shadow-lg hover:border-jasper-emerald cursor-pointer
        ${business.status === 'active' ? 'border-green-200 bg-white' : 'border-gray-200 bg-gray-50'}
      `}
    >
      {/* Status Badge */}
      <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
        {statusEmoji[business.status]} {status.label}
      </div>

      {/* Icon & Name */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${business.status === 'active' ? 'bg-jasper-emerald text-white' : 'bg-gray-200 text-gray-600'}
        `}>
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{business.name}</h3>
          <p className="text-xs text-gray-500">{business.shortName}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {business.description}
      </p>

      {/* Metrics (if active) */}
      {business.status === 'active' && business.metrics && (
        <div className="flex gap-4 pt-3 border-t border-gray-100">
          {business.metrics.revenue !== undefined && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="w-3 h-3" />
              <span>R{(business.metrics.revenue / 1000).toFixed(0)}k</span>
            </div>
          )}
          {business.metrics.leads !== undefined && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3 h-3" />
              <span>{business.metrics.leads} leads</span>
            </div>
          )}
        </div>
      )}

      {/* Action Links */}
      {hasLinks && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {business.links?.dashboard && (
            <Link
              href={business.links.dashboard}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-jasper-emerald/10 text-jasper-emerald rounded hover:bg-jasper-emerald/20 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Dashboard
            </Link>
          )}
          {business.links?.api && (
            <a
              href={`https://api.jasperfinance.org${business.links.api}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
            >
              <FileCode className="w-3 h-3" />
              API
            </a>
          )}
          {business.links?.website && (
            <a
              href={business.links.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            >
              <Globe className="w-3 h-3" />
              Website
            </a>
          )}
        </div>
      )}
    </div>
  );
}
