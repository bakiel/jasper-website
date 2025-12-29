"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  FileText,
  Link2,
  Image,
  Type,
  BarChart3,
  Zap,
  RefreshCw,
  TrendingUp,
  Target,
  BookOpen,
  Brain,
  Lightbulb,
} from "lucide-react";

/**
 * Full grading data from CRM quality evaluation
 */
export interface GradingData {
  overall_score: number;
  meets_threshold: boolean;
  seo_score: number;
  readability_score: number;
  dfi_accuracy_score: number;
  engagement_score: number;
  technical_depth_score: number;
  originality_score: number;
  was_auto_improved?: boolean;
  original_score?: number;
  improvements_made?: string[];
}

interface SEOHealthIndicatorProps {
  grading: GradingData | null;
  slug: string;
  onImprove?: (slug: string) => Promise<void>;
  isImproving?: boolean;
  compact?: boolean;
}

// Dimension configuration with icons
const DIMENSION_CONFIG = {
  seo: {
    label: "SEO",
    weight: 15,
    icon: Search,
    description: "Search engine optimization quality"
  },
  readability: {
    label: "Readability",
    weight: 15,
    icon: BookOpen,
    description: "How easy the content is to read"
  },
  dfi_accuracy: {
    label: "DFI Accuracy",
    weight: 20,
    icon: Target,
    description: "Development finance accuracy"
  },
  engagement: {
    label: "Engagement",
    weight: 15,
    icon: TrendingUp,
    description: "How engaging the content is"
  },
  technical_depth: {
    label: "Technical",
    weight: 20,
    icon: Brain,
    description: "Technical depth and expertise"
  },
  originality: {
    label: "Originality",
    weight: 15,
    icon: Lightbulb,
    description: "Content uniqueness"
  },
};

// SEO-specific checks (from backend seo_scorer.py)
const SEO_CHECKS = [
  { key: "title", label: "Keyword in title", points: 15, icon: Type },
  { key: "url", label: "Keyword in URL", points: 10, icon: Link2 },
  { key: "intro", label: "Keyword in intro", points: 10, icon: FileText },
  { key: "density", label: "Keyword density", points: 10, icon: BarChart3 },
  { key: "seo_title", label: "SEO title length", points: 10, icon: Type },
  { key: "meta_desc", label: "Meta description", points: 10, icon: FileText },
  { key: "content_length", label: "Content length", points: 15, icon: FileText },
  { key: "internal_links", label: "Internal links", points: 5, icon: Link2 },
  { key: "external_links", label: "External links", points: 5, icon: Link2 },
  { key: "headers", label: "Header structure", points: 5, icon: Type },
  { key: "images", label: "Image alt tags", points: 5, icon: Image },
];

/**
 * Get color based on score thresholds
 */
const getScoreColor = (score: number) => {
  if (score >= 70) return { bg: "bg-green-500", text: "text-green-600", bgLight: "bg-green-100 dark:bg-green-900/30", border: "border-green-500" };
  if (score >= 50) return { bg: "bg-yellow-500", text: "text-yellow-600", bgLight: "bg-yellow-100 dark:bg-yellow-900/30", border: "border-yellow-500" };
  return { bg: "bg-red-500", text: "text-red-600", bgLight: "bg-red-100 dark:bg-red-900/30", border: "border-red-500" };
};

/**
 * Get health status label
 */
const getHealthStatus = (score: number) => {
  if (score >= 70) return { label: "Good", icon: CheckCircle, color: "text-green-600" };
  if (score >= 50) return { label: "Needs Work", icon: AlertTriangle, color: "text-yellow-600" };
  return { label: "Critical", icon: XCircle, color: "text-red-600" };
};

/**
 * Circular progress indicator
 */
const CircularProgress: React.FC<{ score: number; size?: number; strokeWidth?: number }> = ({
  score,
  size = 48,
  strokeWidth = 4
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const colors = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={colors.text}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${colors.text}`}>{score.toFixed(0)}</span>
      </div>
    </div>
  );
};

/**
 * Score bar with label
 */
const DimensionBar: React.FC<{
  dimension: keyof typeof DIMENSION_CONFIG;
  score: number;
  showLabel?: boolean;
}> = ({ dimension, score, showLabel = true }) => {
  const config = DIMENSION_CONFIG[dimension];
  const Icon = config.icon;
  const colors = getScoreColor(score);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
          {showLabel && (
            <span className="text-xs text-gray-600 dark:text-gray-400">{config.label}</span>
          )}
        </div>
        <span className={`text-xs font-medium ${colors.text}`}>{score.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bg} transition-all duration-300`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
};

/**
 * SEO Health Indicator - Main component
 *
 * Shows SEO health with expandable details panel
 */
export const SEOHealthIndicator: React.FC<SEOHealthIndicatorProps> = ({
  grading,
  slug,
  onImprove,
  isImproving = false,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!grading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <RefreshCw className="w-4 h-4" />
        <span className="text-xs">Not evaluated</span>
      </div>
    );
  }

  const seoScore = grading.seo_score || 0;
  const overallScore = grading.overall_score || 0;
  const seoColors = getScoreColor(seoScore);
  const seoStatus = getHealthStatus(seoScore);
  const StatusIcon = seoStatus.icon;

  // Find the lowest scoring dimensions for improvement suggestions
  const dimensionScores = Object.entries(DIMENSION_CONFIG).map(([key, config]) => ({
    key,
    label: config.label,
    score: grading[`${key}_score` as keyof GradingData] as number || 0,
  })).sort((a, b) => a.score - b.score);

  const lowestDimensions = dimensionScores.filter(d => d.score < 70).slice(0, 3);

  // Compact view for table cells
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${
            isExpanded ? "bg-gray-100 dark:bg-gray-800" : ""
          }`}
        >
          {/* SEO Score Circle */}
          <CircularProgress score={seoScore} size={36} strokeWidth={3} />

          {/* Status indicator */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1">
              <StatusIcon className={`w-3.5 h-3.5 ${seoStatus.color}`} />
              <span className={`text-xs font-medium ${seoStatus.color}`}>SEO</span>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              Overall: {overallScore.toFixed(0)}%
            </span>
          </div>

          {/* Expand indicator */}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Expanded details panel */}
        {isExpanded && (
          <div className="absolute z-50 top-full left-0 mt-2 w-80 bg-white dark:bg-[#0F2A3C] rounded-xl shadow-xl border border-gray-200 dark:border-[#1a3d52] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-[#1a3d52]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CircularProgress score={seoScore} size={48} strokeWidth={4} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">SEO Score</span>
                      <StatusIcon className={`w-4 h-4 ${seoStatus.color}`} />
                    </div>
                    <span className={`text-sm ${seoStatus.color}`}>{seoStatus.label}</span>
                  </div>
                </div>
                {grading.was_auto_improved && (
                  <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Improved
                  </div>
                )}
              </div>
            </div>

            {/* All Dimensions */}
            <div className="p-4 space-y-3">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Quality Dimensions
              </h4>
              {Object.entries(DIMENSION_CONFIG).map(([key, config]) => {
                const score = grading[`${key}_score` as keyof GradingData] as number || 0;
                return (
                  <DimensionBar
                    key={key}
                    dimension={key as keyof typeof DIMENSION_CONFIG}
                    score={score}
                  />
                );
              })}
            </div>

            {/* Improvement Suggestions */}
            {lowestDimensions.length > 0 && (
              <div className="px-4 pb-4">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Focus Areas
                </h4>
                <div className="space-y-1.5">
                  {lowestDimensions.map(dim => (
                    <div
                      key={dim.key}
                      className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>{dim.label}: {dim.score.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improve Button */}
            {onImprove && seoScore < 70 && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => onImprove(slug)}
                  disabled={isImproving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#2C8A5B] hover:bg-[#1E6B45] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImproving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Improving...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Auto-Improve SEO
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Auto-improved indicator */}
            {grading.was_auto_improved && grading.original_score !== undefined && (
              <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-t border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Improved from {grading.original_score.toFixed(0)}% to {overallScore.toFixed(0)}%
                    <span className="text-green-600 ml-1">
                      (+{(overallScore - grading.original_score).toFixed(0)}%)
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full view (for detail pages)
  return (
    <div className="bg-white dark:bg-[#0F2A3C] rounded-xl border border-gray-200 dark:border-[#1a3d52] overflow-hidden">
      {/* Header with overall scores */}
      <div className="p-4 border-b border-gray-100 dark:border-[#1a3d52]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* SEO Score */}
            <div className="text-center">
              <CircularProgress score={seoScore} size={64} strokeWidth={5} />
              <div className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">SEO</div>
            </div>
            {/* Overall Score */}
            <div className="text-center">
              <CircularProgress score={overallScore} size={64} strokeWidth={5} />
              <div className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">Overall</div>
            </div>
            {/* Status */}
            <div className="ml-4">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-5 h-5 ${seoStatus.color}`} />
                <span className={`font-semibold ${seoStatus.color}`}>{seoStatus.label}</span>
              </div>
              {grading.meets_threshold ? (
                <span className="text-xs text-green-600">Meets publish threshold</span>
              ) : (
                <span className="text-xs text-orange-600">Below 70% threshold</span>
              )}
            </div>
          </div>

          {/* Improve button */}
          {onImprove && seoScore < 70 && (
            <button
              onClick={() => onImprove(slug)}
              disabled={isImproving}
              className="flex items-center gap-2 px-4 py-2 bg-[#2C8A5B] hover:bg-[#1E6B45] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isImproving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Auto-Improve
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Dimensions Grid */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quality Dimensions</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(DIMENSION_CONFIG).map(([key, config]) => {
            const score = grading[`${key}_score` as keyof GradingData] as number || 0;
            return (
              <DimensionBar
                key={key}
                dimension={key as keyof typeof DIMENSION_CONFIG}
                score={score}
              />
            );
          })}
        </div>
      </div>

      {/* Improvement suggestions */}
      {lowestDimensions.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority Improvements</h4>
          <div className="space-y-2">
            {lowestDimensions.map(dim => {
              const config = DIMENSION_CONFIG[dim.key as keyof typeof DIMENSION_CONFIG];
              const Icon = config?.icon || AlertTriangle;
              return (
                <div
                  key={dim.key}
                  className={`flex items-center gap-3 p-2 rounded-lg ${getScoreColor(dim.score).bgLight}`}
                >
                  <Icon className={`w-4 h-4 ${getScoreColor(dim.score).text}`} />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{dim.label}</span>
                    <span className={`text-sm ml-2 ${getScoreColor(dim.score).text}`}>{dim.score.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-improved indicator */}
      {grading.was_auto_improved && (
        <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-t border-gray-100 dark:border-[#1a3d52]">
          <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
            <Sparkles className="w-4 h-4" />
            <span>
              Auto-improved from {grading.original_score?.toFixed(0)}%
              <span className="text-green-600 ml-1">
                (+{(overallScore - (grading.original_score || 0)).toFixed(0)}%)
              </span>
            </span>
          </div>
          {grading.improvements_made && grading.improvements_made.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {grading.improvements_made.map((dim, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-full"
                >
                  {DIMENSION_CONFIG[dim as keyof typeof DIMENSION_CONFIG]?.label || dim}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Mini SEO badge for ultra-compact views
 */
export const SEOBadge: React.FC<{ score: number; showLabel?: boolean }> = ({ score, showLabel = true }) => {
  const colors = getScoreColor(score);
  const status = getHealthStatus(score);
  const StatusIcon = status.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${colors.bgLight}`}>
      <StatusIcon className={`w-3.5 h-3.5 ${colors.text}`} />
      <span className={`text-sm font-medium ${colors.text}`}>{score.toFixed(0)}%</span>
      {showLabel && (
        <span className={`text-xs ${colors.text}`}>SEO</span>
      )}
    </div>
  );
};

export default SEOHealthIndicator;
