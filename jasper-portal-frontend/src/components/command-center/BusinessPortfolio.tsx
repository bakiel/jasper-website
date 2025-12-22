'use client';

import { Business, BusinessStatus } from '@/types/command-center';
import { BusinessCard } from './BusinessCard';

interface BusinessPortfolioProps {
  businesses: Business[];
  onBusinessClick?: (business: Business) => void;
}

export function BusinessPortfolio({ businesses, onBusinessClick }: BusinessPortfolioProps) {
  // Group businesses by status for summary
  const statusCounts = businesses.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<BusinessStatus, number>);

  const activeCount = statusCounts['active'] || 0;
  const planningCount = statusCounts['planning'] || 0;
  const conceptCount = statusCounts['concept'] || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Business Portfolio</h2>
          <p className="text-sm text-gray-500">Kutlwano Holdings Ventures</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
            {activeCount} Active
          </span>
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
            {planningCount} Planning
          </span>
          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
            {conceptCount} Concept
          </span>
        </div>
      </div>

      {/* Business Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {businesses.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            onClick={() => onBusinessClick?.(business)}
          />
        ))}
      </div>
    </div>
  );
}
