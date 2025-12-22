"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Globe,
  Sparkles,
  TrendingUp,
  Filter,
  Wand2,
  Image,
  Zap,
  Brain,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { GradingBadge } from "@/components/content/ArticleGradeCard";

/**
 * Full grading data from CRM quality evaluation
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

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  status: string;
  seo?: { score: number };
  seoScore?: number;
  heroImage: string;
  createdAt: string;
  publishedAt: string | null;
  author: string;
  aiGenerated?: boolean;
  // New grading fields from CRM sync
  grading?: GradingData;
  sync_status?: "pending" | "synced" | "failed" | "not_eligible";
  synced_at?: string;
}

interface ContentStats {
  total: number;
  published: number;
  meetsThreshold: number;
  avgSeoScore: number;
  autoImproved: number;
  syncedToLive: number;
}

const API_BASE = process.env.NEXT_PUBLIC_CRM_API_URL || "https://api.jasperfinance.org";
const LIVE_SITE = "https://jasperfinance.org";
const SEO_THRESHOLD = 70;

// DFI Sector categories
const DFI_SECTORS = [
  "Renewable Energy",
  "Data Centres & Digital",
  "Agri-Industrial",
  "Climate Finance",
  "Technology & Platforms",
  "Manufacturing & Processing",
  "Infrastructure & Transport",
  "Real Estate Development",
  "Water & Sanitation",
  "Healthcare & Life Sciences",
  "Mining & Critical Minerals",
  "DFI Insights",
];

export default function ContentDashboardPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [showBelowThreshold, setShowBelowThreshold] = useState(false);
  const [sortBy, setSortBy] = useState<string>("seoScore");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // AI Auto-Generate State
  const [showAutoGenDialog, setShowAutoGenDialog] = useState(false);
  const [autoGenCategory, setAutoGenCategory] = useState<string>(""); // Empty = AI decides
  const [autoGenCount, setAutoGenCount] = useState<number>(1); // 1-20 articles
  const [autoGenIncludeImage, setAutoGenIncludeImage] = useState(true);
  const [autoGenImageModel, setAutoGenImageModel] = useState<"nano-banana" | "nano-banana-pro">("nano-banana-pro");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>("");
  const [generatedCount, setGeneratedCount] = useState<number>(0);
  const [autoGenMode, setAutoGenMode] = useState<"manual" | "scheduled">("manual");
  const [scheduledEnabled, setScheduledEnabled] = useState(false);
  const [previewTopics, setPreviewTopics] = useState<string[]>([]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/blog/posts`);
      const data = await res.json();

      // Handle both response formats
      const posts = data.posts || data || [];

      // Normalize SEO score field and grading data
      const normalized = posts.map((a: Article) => ({
        ...a,
        // Support legacy seoScore and new grading.overall_score
        seoScore: a.grading?.overall_score || a.seo?.score || a.seoScore || 0,
        // Ensure grading has meets_threshold set
        grading: a.grading ? {
          ...a.grading,
          meets_threshold: (a.grading.overall_score || 0) >= SEO_THRESHOLD,
        } : undefined,
      }));

      setArticles(normalized);
      setLastSync(new Date());
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteArticle = async (slug: string) => {
    if (!confirm("This will delete the article from the LIVE site. Are you sure?")) return;
    try {
      await fetch(`${API_BASE}/api/v1/blog/admin/posts/${slug}`, { method: "DELETE" });
      fetchArticles();
    } catch (error) {
      console.error("Failed to delete article:", error);
    }
  };

  // AI Auto-Generate Complete Articles
  const autoGenerateArticles = async () => {
    try {
      setIsGenerating(true);
      setGeneratedCount(0);

      for (let i = 0; i < autoGenCount; i++) {
        setGenerationProgress(`Generating article ${i + 1} of ${autoGenCount}...`);

        // Step 1: Generate article content
        const articleRes = await fetch(`${API_BASE}/api/v1/content/auto-generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: autoGenCategory || undefined, // AI decides if empty
            include_hero_image: autoGenIncludeImage,
            image_model: autoGenImageModel,
          }),
        });

        if (!articleRes.ok) {
          const error = await articleRes.json();
          throw new Error(error.detail || `Failed to generate article ${i + 1}`);
        }

        const articleData = await articleRes.json();
        setGeneratedCount(i + 1);

        // Small delay between articles to avoid rate limits
        if (i < autoGenCount - 1) {
          setGenerationProgress(`Generated ${i + 1}/${autoGenCount}. Preparing next...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // Success - refresh and close
      setGenerationProgress("Complete! Refreshing...");
      await fetchArticles();
      setShowAutoGenDialog(false);
      setAutoGenCount(1);
      setAutoGenCategory("");

      alert(`Successfully generated ${autoGenCount} article${autoGenCount > 1 ? "s" : ""}!`);
    } catch (error) {
      console.error("Auto-generate failed:", error);
      alert(`Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  // Filter articles by threshold
  const qualifiedArticles = articles.filter((a) => (a.seoScore || 0) >= SEO_THRESHOLD);
  const belowThresholdArticles = articles.filter((a) => (a.seoScore || 0) < SEO_THRESHOLD);

  const stats: ContentStats = {
    total: articles.length,
    published: articles.filter((a) => a.status === "published").length,
    meetsThreshold: qualifiedArticles.length,
    avgSeoScore: articles.length > 0
      ? articles.reduce((acc, a) => acc + (a.seoScore || 0), 0) / articles.length
      : 0,
    autoImproved: articles.filter((a) => a.grading?.was_auto_improved).length,
    syncedToLive: articles.filter((a) => a.sync_status === "synced").length,
  };

  // Display articles based on filter
  const displayArticles = showBelowThreshold ? belowThresholdArticles : qualifiedArticles;

  const filteredArticles = displayArticles
    .filter((a) => {
      if (filterCategory && a.category !== filterCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(query) ||
          a.excerpt?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "seoScore") {
        return (b.seoScore || 0) - (a.seoScore || 0);
      }
      if (sortBy === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "draft":
        return <Edit className="w-4 h-4 text-gray-400" />;
      case "scheduled":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 70) return "text-emerald-600 bg-emerald-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  // Get unique categories from articles
  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f14]">
      {/* Header - Clean Professional Design */}
      <div className="bg-white dark:bg-[#0F2A3C] border-b border-gray-200 dark:border-[#1a3d52]">
        {/* Top Row - Title & Quick Actions */}
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left - Title & Status */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2C8A5B] to-[#1E6B45] flex items-center justify-center shadow-lg shadow-[#2C8A5B]/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Content Hub</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live on jasperfinance.org
                </span>
                {lastSync && (
                  <span className="text-gray-400 dark:text-gray-500">
                    · Updated {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right - Secondary Actions */}
          <div className="flex items-center gap-2">
            <a
              href={`${LIVE_SITE}/insights`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Site
            </a>
            <button
              onClick={fetchArticles}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync
            </button>
          </div>
        </div>

        {/* Action Bar - Primary Content Actions */}
        <div className="px-6 py-3 bg-gray-50/80 dark:bg-[#0a1f2d]/50 border-t border-gray-100 dark:border-[#1a3d52]/50">
          <div className="flex items-center justify-between">
            {/* Create Actions */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2">
                Create
              </span>

              {/* AI Auto-Generate - Primary CTA */}
              <button
                onClick={() => setShowAutoGenDialog(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2C8A5B] to-[#22c55e] text-white rounded-lg font-medium text-sm shadow-md shadow-[#2C8A5B]/25 hover:shadow-lg hover:shadow-[#2C8A5B]/30 hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                AI Auto-Generate
              </button>

              {/* Article Builder */}
              <Link
                href="/content/builder"
                className="flex items-center gap-2 px-4 py-2 bg-[#0F2A3C] dark:bg-[#1a3d52] text-white rounded-lg font-medium text-sm hover:bg-[#1a3d52] dark:hover:bg-[#234d6a] transition-colors"
              >
                <Brain className="w-4 h-4" />
                Article Builder
              </Link>

              {/* Quick Generate */}
              <Link
                href="/content/new"
                className="flex items-center gap-2 px-4 py-2 border border-[#2C8A5B] text-[#2C8A5B] dark:text-[#34d399] rounded-lg font-medium text-sm hover:bg-[#2C8A5B]/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Quick Generate
              </Link>
            </div>

            {/* Image Library Link */}
            <Link
              href="/images"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-[#2C8A5B] dark:hover:text-[#34d399] transition-colors"
            >
              <Image className="w-4 h-4" />
              Image Library
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 bg-white dark:bg-[#111820] border-b border-gray-200 dark:border-[#1a3d52]">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-[#0F2A3C] rounded-lg border border-gray-200 dark:border-[#1a3d52]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total on Site</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-[#0F2A3C] rounded-lg border border-green-200 dark:border-green-900/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Published</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.published}</p>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-[#0F2A3C] rounded-lg border border-emerald-200 dark:border-[#2C8A5B]/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">SEO ≥70%</p>
            <p className="text-2xl font-bold text-[#2C8A5B]">{stats.meetsThreshold}</p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-[#0F2A3C] rounded-lg border border-blue-200 dark:border-blue-900/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Quality</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.avgSeoScore.toFixed(0)}%</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-[#0F2A3C] rounded-lg border border-purple-200 dark:border-purple-900/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Auto-Improved</p>
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.autoImproved}</p>
          </div>
          <div className="p-4 bg-cyan-50 dark:bg-[#0F2A3C] rounded-lg border border-cyan-200 dark:border-cyan-900/50">
            <div className="flex items-center gap-1.5 mb-1">
              <Upload className="w-3.5 h-3.5 text-cyan-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Synced Live</p>
            </div>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.syncedToLive}</p>
          </div>
        </div>
      </div>

      {/* Quality Threshold Banner */}
      <div className="px-6 py-3 bg-emerald-50 dark:bg-[#0F2A3C]/50 border-b border-emerald-100 dark:border-[#1a3d52]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-[#2C8A5B]">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">
              Showing {showBelowThreshold ? "below threshold" : "qualified"} articles
              (SEO {showBelowThreshold ? "<" : "≥"} {SEO_THRESHOLD}%)
            </span>
          </div>
          <button
            onClick={() => setShowBelowThreshold(!showBelowThreshold)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showBelowThreshold
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 border border-orange-300 dark:border-orange-800"
                : "bg-emerald-100 dark:bg-[#2C8A5B]/20 text-emerald-700 dark:text-[#2C8A5B] hover:bg-emerald-200 dark:hover:bg-[#2C8A5B]/30 border border-emerald-300 dark:border-[#2C8A5B]/50"
            }`}
          >
            <Filter className="w-4 h-4" />
            {showBelowThreshold ? `Show Qualified (${qualifiedArticles.length})` : `Show Below Threshold (${belowThresholdArticles.length})`}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 bg-white dark:bg-[#111820] border-b border-gray-200 dark:border-[#1a3d52]">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0F2A3C] border border-gray-300 dark:border-[#1a3d52] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#2C8A5B] focus:border-[#2C8A5B]"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#0F2A3C] border border-gray-300 dark:border-[#1a3d52] rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2C8A5B]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#0F2A3C] border border-gray-300 dark:border-[#1a3d52] rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2C8A5B]"
          >
            <option value="seoScore">Highest SEO</option>
            <option value="createdAt">Newest First</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Article List */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C8A5B]"></div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>{showBelowThreshold ? "No articles below threshold" : "No qualified articles found"}</p>
            {!showBelowThreshold && (
              <Link
                href="/content/new"
                className="inline-flex items-center gap-2 mt-4 text-[#2C8A5B] hover:underline"
              >
                <Sparkles className="w-4 h-4" />
                Generate a new article
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0F2A3C] rounded-lg border border-gray-200 dark:border-[#1a3d52] overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#0a1f2d] border-b border-gray-200 dark:border-[#1a3d52]">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Article</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Quality Score</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Sync</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Published</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#1a3d52]">
                {filteredArticles.map((article) => (
                  <tr key={article.slug} className="hover:bg-gray-50 dark:hover:bg-[#1a3d52]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {article.heroImage && (
                          <div className="w-16 h-10 bg-gray-100 dark:bg-[#1a3d52] rounded overflow-hidden flex-shrink-0">
                            <img
                              src={
                                article.heroImage.startsWith("/")
                                  ? `${API_BASE}${article.heroImage}`
                                  : article.heroImage
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-md">
                              {article.title}
                            </p>
                            {article.aiGenerated && (
                              <span title="AI Generated">
                                <Sparkles className="w-3.5 h-3.5 text-[#2C8A5B] flex-shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                            {article.excerpt?.slice(0, 80)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{article.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        {getStatusIcon(article.status)}
                        <span className="text-sm capitalize">{article.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <GradingBadge
                        score={article.grading?.overall_score || article.seoScore || 0}
                        meetsThreshold={(article.grading?.overall_score || article.seoScore || 0) >= SEO_THRESHOLD}
                        wasImproved={article.grading?.was_auto_improved}
                        originalScore={article.grading?.original_score}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {article.sync_status === "synced" ? (
                        <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Synced
                        </span>
                      ) : article.sync_status === "pending" ? (
                        <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      ) : article.sync_status === "failed" ? (
                        <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Failed
                        </span>
                      ) : article.sync_status === "not_eligible" ? (
                        <span className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Below 70%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {article.status === "published" && (
                          <a
                            href={`${LIVE_SITE}/insights/${article.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                            title="View on Live Site"
                          >
                            <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </a>
                        )}
                        <Link
                          href={`/content/${article.slug}`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-[#1a3d52] rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </Link>
                        <button
                          onClick={() => deleteArticle(article.slug)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete from Live Site"
                        >
                          <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Auto-Generate Dialog - JASPER Branded */}
      {showAutoGenDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header - JASPER Navy/Emerald */}
            <div className="bg-gradient-to-r from-[#0F2A3C] to-[#2C8A5B] p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                  <Wand2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">JASPER Content Engine</h3>
                  <p className="text-white/70 text-sm">
                    AI-powered article generation with hero images
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setAutoGenMode("manual")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  autoGenMode === "manual"
                    ? "text-[#0F2A3C] border-b-2 border-[#2C8A5B] bg-emerald-50/50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Generate Now
              </button>
              <button
                onClick={() => setAutoGenMode("scheduled")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  autoGenMode === "scheduled"
                    ? "text-[#0F2A3C] border-b-2 border-[#2C8A5B] bg-emerald-50/50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Scheduled (20/day)
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {autoGenMode === "manual" ? (
                <>
                  {/* Article Count Slider */}
                  <div>
                    <label className="block text-sm font-medium text-[#0F2A3C] mb-2">
                      Number of Articles
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={autoGenCount}
                        onChange={(e) => setAutoGenCount(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2C8A5B]"
                      />
                      <div className="w-16 text-center">
                        <span className="text-2xl font-bold text-[#2C8A5B]">{autoGenCount}</span>
                        <p className="text-xs text-gray-500">article{autoGenCount > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#0F2A3C] mb-2">
                      Category Focus
                    </label>
                    <select
                      value={autoGenCategory}
                      onChange={(e) => setAutoGenCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2C8A5B] focus:border-[#2C8A5B]"
                    >
                      <option value="">AI Decides (trending DFI topics)</option>
                      {DFI_SECTORS.map((sector) => (
                        <option key={sector} value={sector}>{sector}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                /* Scheduled Mode */
                <div className="space-y-4">
                  <div className="p-4 bg-[#0F2A3C]/5 rounded-lg border border-[#0F2A3C]/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#0F2A3C]">Daily Auto-Generation</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          System generates 20 articles every day at 6:00 AM SAST
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={scheduledEnabled}
                          onChange={(e) => setScheduledEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2C8A5B]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2C8A5B]"></div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Daily Volume</p>
                      <p className="text-xl font-bold text-[#0F2A3C]">20 articles</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Monthly Output</p>
                      <p className="text-xl font-bold text-[#0F2A3C]">~600 articles</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Est. Daily Cost</p>
                      <p className="text-xl font-bold text-[#2C8A5B]">~$1.74</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Est. Monthly Cost</p>
                      <p className="text-xl font-bold text-[#2C8A5B]">~$52.20</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Articles distributed across all DFI sectors. AI selects trending topics daily.
                  </p>
                </div>
              )}

              {/* Hero Image Settings */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="include-image"
                    checked={autoGenIncludeImage}
                    onChange={(e) => setAutoGenIncludeImage(e.target.checked)}
                    className="w-5 h-5 text-[#2C8A5B] rounded focus:ring-[#2C8A5B]"
                  />
                  <label htmlFor="include-image" className="flex-1">
                    <span className="font-medium text-[#0F2A3C] flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Generate Hero Images
                    </span>
                  </label>
                </div>

                {autoGenIncludeImage && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setAutoGenImageModel("nano-banana")}
                      className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                        autoGenImageModel === "nano-banana"
                          ? "border-[#2C8A5B] bg-[#2C8A5B]/10 text-[#0F2A3C]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium">Nano Banana 2.5</div>
                      <div className="text-xs opacity-75">Fast • $0.039/img</div>
                    </button>
                    <button
                      onClick={() => setAutoGenImageModel("nano-banana-pro")}
                      className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                        autoGenImageModel === "nano-banana-pro"
                          ? "border-[#2C8A5B] bg-[#2C8A5B]/10 text-[#0F2A3C]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium">Nano Banana Pro 3.0</div>
                      <div className="text-xs opacity-75">Quality • $0.067/img</div>
                    </button>
                  </div>
                )}
              </div>

              {/* Preview Section */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-[#0F2A3C]/5 px-4 py-2 border-b">
                  <p className="text-sm font-medium text-[#0F2A3C]">Preview: What AI Will Generate</p>
                </div>
                <div className="p-4 space-y-2 max-h-32 overflow-y-auto">
                  {[
                    "IDC Approves R2.3bn Renewable Energy Fund for SA Grid",
                    "DBSA Partners with AfDB on Climate Adaptation Finance",
                    "Agri-Industrial Processing Hub Secures DFI Backing",
                    "Digital Infrastructure Investment Reaches Record High",
                  ].slice(0, autoGenMode === "manual" ? Math.min(autoGenCount, 4) : 4).map((topic, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-[#2C8A5B]" />
                      <span className="text-gray-700">{topic}</span>
                      <span className="text-xs text-gray-400 ml-auto">~1,200 words</span>
                    </div>
                  ))}
                  {autoGenMode === "manual" && autoGenCount > 4 && (
                    <p className="text-xs text-gray-400 pl-4">+ {autoGenCount - 4} more articles...</p>
                  )}
                </div>
              </div>

              {/* Cost Summary */}
              <div className="p-3 bg-[#2C8A5B]/10 rounded-lg border border-[#2C8A5B]/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#0F2A3C]">
                    {autoGenMode === "manual" ? "Generation Cost:" : "Daily Cost:"}
                  </span>
                  <span className="font-bold text-[#0F2A3C]">
                    ~${autoGenMode === "manual"
                      ? (autoGenCount * 0.02 + (autoGenIncludeImage ? autoGenCount * (autoGenImageModel === "nano-banana" ? 0.039 : 0.067) : 0)).toFixed(2)
                      : (20 * 0.02 + (autoGenIncludeImage ? 20 * (autoGenImageModel === "nano-banana" ? 0.039 : 0.067) : 0)).toFixed(2)
                    }
                  </span>
                </div>
              </div>

              {/* Generation Progress */}
              {isGenerating && (
                <div className="p-4 bg-[#2C8A5B]/10 rounded-lg border border-[#2C8A5B]/30">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-[#2C8A5B] animate-spin" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#0F2A3C]">{generationProgress}</p>
                      <div className="mt-2 h-2 bg-[#2C8A5B]/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2C8A5B] transition-all duration-500"
                          style={{ width: `${(generatedCount / autoGenCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Powered by JASPER Content Engine
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAutoGenDialog(false);
                    setAutoGenCount(1);
                    setAutoGenCategory("");
                  }}
                  disabled={isGenerating}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 text-gray-700"
                >
                  Cancel
                </button>
                {autoGenMode === "manual" ? (
                  <button
                    onClick={autoGenerateArticles}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#0F2A3C] to-[#2C8A5B] text-white rounded-lg hover:from-[#1a3d52] hover:to-[#1E6B45] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Generate {autoGenCount} Article{autoGenCount > 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE}/api/v1/content/schedule`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            enabled: scheduledEnabled,
                            daily_count: 20,
                            include_images: autoGenIncludeImage,
                            image_model: autoGenImageModel,
                          }),
                        });
                        if (res.ok) {
                          alert(scheduledEnabled ? "Scheduled generation enabled! 20 articles/day." : "Scheduled generation disabled.");
                          setShowAutoGenDialog(false);
                        }
                      } catch (error) {
                        alert("Failed to update schedule settings");
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#0F2A3C] to-[#2C8A5B] text-white rounded-lg hover:from-[#1a3d52] hover:to-[#1E6B45] shadow-lg"
                  >
                    <Clock className="w-4 h-4" />
                    {scheduledEnabled ? "Enable Schedule" : "Save Settings"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
