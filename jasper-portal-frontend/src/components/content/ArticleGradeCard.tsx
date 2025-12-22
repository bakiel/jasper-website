"use client";

import React from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  RefreshCw,
  Globe,
  Clock,
} from "lucide-react";

/**
 * Quality evaluation dimensions with weights
 */
interface QualityDimensions {
  seo: number;
  readability: number;
  dfi_accuracy: number;
  engagement: number;
  technical_depth: number;
  originality: number;
}

/**
 * Full grading data from CRM
 */
interface GradingData {
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

interface ArticleGradeCardProps {
  grading: GradingData | null;
  syncStatus?: "pending" | "synced" | "failed" | "not_eligible";
  syncedAt?: string;
  compact?: boolean;
  showSyncStatus?: boolean;
}

// Dimension display configuration
const DIMENSION_CONFIG = {
  seo: { label: "SEO", weight: 15 },
  readability: { label: "Readability", weight: 15 },
  dfi_accuracy: { label: "DFI Accuracy", weight: 20 },
  engagement: { label: "Engagement", weight: 15 },
  technical_depth: { label: "Technical Depth", weight: 20 },
  originality: { label: "Originality", weight: 15 },
};

/**
 * Get color class based on score
 */
const getScoreColor = (score: number) => {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

const getScoreTextColor = (score: number) => {
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
};

const getScoreBgColor = (score: number) => {
  if (score >= 70) return "bg-green-100 dark:bg-green-900/30";
  if (score >= 50) return "bg-yellow-100 dark:bg-yellow-900/30";
  return "bg-red-100 dark:bg-red-900/30";
};

/**
 * Get sync status icon and color
 */
const getSyncStatusDisplay = (status: string) => {
  switch (status) {
    case "synced":
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        text: "Synced to Live",
        color: "text-green-600",
      };
    case "pending":
      return {
        icon: <Clock className="w-4 h-4 text-blue-500" />,
        text: "Pending Sync",
        color: "text-blue-600",
      };
    case "failed":
      return {
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        text: "Sync Failed",
        color: "text-red-600",
      };
    case "not_eligible":
      return {
        icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
        text: "Below Threshold",
        color: "text-orange-600",
      };
    default:
      return {
        icon: <Clock className="w-4 h-4 text-gray-400" />,
        text: "Unknown",
        color: "text-gray-500",
      };
  }
};

/**
 * Score bar component
 */
const ScoreBar: React.FC<{
  label: string;
  score: number;
  weight: number;
  compact?: boolean;
}> = ({ label, score, weight, compact }) => (
  <div className={compact ? "mb-1" : "mb-2"}>
    <div className="flex justify-between items-center mb-1">
      <span className={`${compact ? "text-xs" : "text-sm"} text-gray-600 dark:text-gray-400`}>
        {label}
        {!compact && <span className="text-gray-400 ml-1">({weight}%)</span>}
      </span>
      <span className={`${compact ? "text-xs" : "text-sm"} font-medium ${getScoreTextColor(score)}`}>
        {score.toFixed(0)}%
      </span>
    </div>
    <div className={`w-full ${compact ? "h-1.5" : "h-2"} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
      <div
        className={`h-full ${getScoreColor(score)} transition-all duration-500`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  </div>
);

/**
 * ArticleGradeCard - Display full grading stats for an article
 *
 * Shows:
 * - Overall score with threshold indicator
 * - All 6 dimension scores with visual bars
 * - Auto-improvement indicator (if applicable)
 * - Sync status
 */
export const ArticleGradeCard: React.FC<ArticleGradeCardProps> = ({
  grading,
  syncStatus = "pending",
  syncedAt,
  compact = false,
  showSyncStatus = true,
}) => {
  if (!grading) {
    return (
      <div className={`${compact ? "p-3" : "p-4"} bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Not evaluated</span>
        </div>
      </div>
    );
  }

  const syncDisplay = getSyncStatusDisplay(syncStatus);

  // Compact view - used in table rows
  if (compact) {
    return (
      <div className="space-y-2">
        {/* Overall Score Badge */}
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${getScoreBgColor(grading.overall_score)}`}>
          {grading.meets_threshold ? (
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
          )}
          <span className={`text-sm font-bold ${getScoreTextColor(grading.overall_score)}`}>
            {grading.overall_score.toFixed(0)}%
          </span>
        </div>

        {/* Mini dimension bars */}
        <div className="grid grid-cols-3 gap-1">
          {Object.entries(DIMENSION_CONFIG).map(([key, config]) => {
            const score = grading[`${key}_score` as keyof GradingData] as number || 0;
            return (
              <div key={key} className="text-center">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{config.label}</div>
                <div className={`h-1 rounded-full ${getScoreColor(score)} mt-0.5`} style={{ width: '100%', opacity: score / 100 }} />
              </div>
            );
          })}
        </div>

        {/* Auto-improved badge */}
        {grading.was_auto_improved && (
          <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
            <Sparkles className="w-3 h-3" />
            <span>
              Improved: {grading.original_score?.toFixed(0)}% → {grading.overall_score.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  // Full view - used in detail pages or modals
  return (
    <div className="bg-white dark:bg-[#0F2A3C] rounded-xl border border-gray-200 dark:border-[#1a3d52] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-[#1a3d52]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getScoreBgColor(grading.overall_score)}`}>
              <span className={`text-lg font-bold ${getScoreTextColor(grading.overall_score)}`}>
                {grading.overall_score.toFixed(0)}%
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">Overall Score</span>
                {grading.meets_threshold ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Meets Threshold
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    Below 70%
                  </span>
                )}
              </div>
              {grading.was_auto_improved && (
                <div className="flex items-center gap-1 mt-1 text-sm text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Auto-improved from {grading.original_score?.toFixed(0)}%
                    <span className="text-green-500 ml-1">
                      (+{(grading.overall_score - (grading.original_score || 0)).toFixed(0)}%)
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sync Status */}
          {showSyncStatus && (
            <div className={`flex items-center gap-1.5 ${syncDisplay.color}`}>
              {syncDisplay.icon}
              <span className="text-sm">{syncDisplay.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quality Dimensions</h4>
        <div className="space-y-3">
          {Object.entries(DIMENSION_CONFIG).map(([key, config]) => {
            const scoreKey = `${key}_score` as keyof GradingData;
            const score = (grading[scoreKey] as number) || 0;
            return (
              <ScoreBar
                key={key}
                label={config.label}
                score={score}
                weight={config.weight}
              />
            );
          })}
        </div>
      </div>

      {/* Improvements Made */}
      {grading.improvements_made && grading.improvements_made.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Improvements Made</h4>
          <div className="flex flex-wrap gap-1.5">
            {grading.improvements_made.map((dim, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
              >
                {DIMENSION_CONFIG[dim as keyof typeof DIMENSION_CONFIG]?.label || dim}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer with sync timestamp */}
      {syncedAt && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-[#0a1f2d] border-t border-gray-100 dark:border-[#1a3d52]">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Globe className="w-3 h-3" />
            <span>Synced {new Date(syncedAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact grading badge for table cells
 */
export const GradingBadge: React.FC<{
  score: number;
  meetsThreshold: boolean;
  wasImproved?: boolean;
  originalScore?: number;
}> = ({ score, meetsThreshold, wasImproved, originalScore }) => (
  <div className="flex items-center gap-2">
    <span className={`px-2 py-1 rounded-lg text-sm font-medium ${getScoreBgColor(score)} ${getScoreTextColor(score)}`}>
      {score.toFixed(0)}%
    </span>
    {meetsThreshold ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-orange-500" />
    )}
    {wasImproved && (
      <span className="flex items-center gap-0.5 text-xs text-purple-600">
        <Sparkles className="w-3 h-3" />
        +{(score - (originalScore || 0)).toFixed(0)}%
      </span>
    )}
  </div>
);

export default ArticleGradeCard;
