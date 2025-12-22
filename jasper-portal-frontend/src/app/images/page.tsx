"use client";

import { useState, useEffect, useRef } from "react";
import { ImageIcon, Search, Filter, Star, Trash2, RefreshCw, Grid, List, Sparkles, Download, ExternalLink, Upload, Wand2, Palette, Library, Check, X } from "lucide-react";

interface ImageEntry {
  id: string;
  filename: string;
  source: string;
  category: string;
  public_url: string;
  is_favorite: boolean;
  used_in: string[];
  created_at: string;
  updated_at: string;
  prompt?: string;
  metadata: {
    width: number;
    height: number;
    aspect_ratio: number;
    file_size: number;
    format: string;
    original_format: string;
  };
  ai_evaluation: {
    tags: string[];
    description: string;
    quality_score: number;
    brand_alignment: number;
    suggested_categories: string[];
    dominant_colors: string[];
    evaluated_at: string;
  };
  attribution: {
    photographer?: string;
    source_name?: string;
    source_url?: string;
    license: string;
  };
}

interface LibraryStats {
  total_images: number;
  by_source: Record<string, number>;
  by_category: Record<string, number>;
  used_count: number;
  unused_count: number;
  favorites_count: number;
  average_quality_score: number;
}

interface StockImageResult {
  id: string;
  source: string;
  preview_url: string;
  download_url: string;
  width: number;
  height: number;
  description: string;
  photographer: string;
  photographer_url: string;
  source_url: string;
  license: string;
  tags: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_CRM_API_URL || "https://api.jasperfinance.org";

// DFI Sector categories aligned with marketing site
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

// Preloaded reference images for AI generation (optimized 1024px JPEGs)
const PRELOADED_REFS = [
  { id: "preload-saas-dashboard", name: "SaaS Financial Dashboard", src: "/images/preloaded-refs/ref-saas-financial-dashboard.jpg", category: "Dashboards" },
  { id: "preload-agri-finance", name: "Agricultural Finance Dashboard", src: "/images/preloaded-refs/ref-agri-finance-dashboard.jpg", category: "Dashboards" },
  { id: "preload-revenue-model", name: "Revenue Model Dashboard", src: "/images/preloaded-refs/ref-revenue-model-dashboard.jpg", category: "Dashboards" },
  { id: "preload-professional-city", name: "Professional City Skyline", src: "/images/preloaded-refs/ref-professional-city-skyline.jpg", category: "Professional" },
  { id: "preload-jasper-whiteboard", name: "JASPER Strategic Whiteboard", src: "/images/preloaded-refs/ref-jasper-strategic-whiteboard.jpg", category: "JASPER Branded" },
  { id: "preload-jasper-series-a", name: "JASPER Series A Presentation", src: "/images/preloaded-refs/ref-jasper-series-a-presentation.jpg", category: "JASPER Branded" },
  { id: "preload-jasper-investment", name: "JASPER Investment Committee", src: "/images/preloaded-refs/ref-jasper-investment-committee.jpg", category: "JASPER Branded" },
  { id: "preload-jasper-construction", name: "JASPER Construction Holographic", src: "/images/preloaded-refs/ref-jasper-construction-holographic.jpg", category: "JASPER Branded" },
  { id: "preload-jasper-agriculture", name: "JASPER Large Scale Agriculture", src: "/images/preloaded-refs/ref-jasper-large-scale-agriculture.jpg", category: "JASPER Branded" },
  { id: "preload-team-celebration", name: "Team Celebration Term Sheet", src: "/images/preloaded-refs/ref-team-celebration-termsheet.jpg", category: "Professional" },
  { id: "preload-construction", name: "Construction Development", src: "/images/preloaded-refs/ref-construction-development.jpg", category: "Infrastructure" },
  { id: "preload-food-facility", name: "Food Processing Facility", src: "/images/preloaded-refs/ref-food-processing-facility.jpg", category: "Manufacturing" },
  { id: "preload-food-robotic", name: "Food Processing Robotic", src: "/images/preloaded-refs/ref-food-processing-robotic.jpg", category: "Manufacturing" },
  { id: "preload-irrigation-sunset", name: "Agricultural Irrigation Sunset", src: "/images/preloaded-refs/ref-agricultural-irrigation-sunset.jpg", category: "Agriculture" },
  { id: "preload-irrigation-silos", name: "Agricultural Irrigation Silos", src: "/images/preloaded-refs/ref-agricultural-irrigation-silos.jpg", category: "Agriculture" },
];

export default function ImageLibraryPage() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showUnusedOnly, setShowUnusedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImage, setSelectedImage] = useState<ImageEntry | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reEvaluating, setReEvaluating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Generation State
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genPrompt, setGenPrompt] = useState("");
  const [genModel, setGenModel] = useState<"nano-banana" | "nano-banana-pro">("nano-banana-pro");
  const [genAspectRatio, setGenAspectRatio] = useState("16:9");
  const [genCategory, setGenCategory] = useState("DFI Insights");
  const [includeJasperLogo, setIncludeJasperLogo] = useState(true);
  const [selectedRefImages, setSelectedRefImages] = useState<string[]>([]);
  const [showRefImagePicker, setShowRefImagePicker] = useState(false);

  // Stock Image Search State
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [stockSource, setStockSource] = useState<"all" | "unsplash" | "pexels" | "pixabay">("all");
  const [stockOrientation, setStockOrientation] = useState<"all" | "landscape" | "portrait" | "square">("landscape");
  const [stockResults, setStockResults] = useState<StockImageResult[]>([]);
  const [stockSearching, setStockSearching] = useState(false);
  const [stockImporting, setStockImporting] = useState<string | null>(null);
  const [stockCategory, setStockCategory] = useState("DFI Insights");
  const [selectedStockImages, setSelectedStockImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchImages();
    fetchStats();
  }, [filterSource, filterCategory, showFavoritesOnly, showUnusedOnly]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterSource) params.append("source", filterSource);
      if (filterCategory) params.append("category", filterCategory);
      if (showFavoritesOnly) params.append("favorites_only", "true");
      if (showUnusedOnly) params.append("unused_only", "true");
      params.append("limit", "100");

      const res = await fetch(`${API_BASE}/api/v1/images/library/?${params}`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      } else {
        // Fallback to empty array if endpoint not yet implemented
        setImages([]);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/images/library/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || data);
      } else {
        // Default stats if endpoint not yet implemented
        setStats({
          total_images: 0,
          by_source: {},
          by_category: {},
          used_count: 0,
          unused_count: 0,
          favorites_count: 0,
          average_quality_score: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStats({
        total_images: 0,
        by_source: {},
        by_category: {},
        used_count: 0,
        unused_count: 0,
        favorites_count: 0,
        average_quality_score: 0,
      });
    }
  };

  const toggleFavorite = async (imageId: string, currentState: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/images/library/${imageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !currentState }),
      });
      if (res.ok) {
        fetchImages();
        // Update selected image if it's the one being toggled
        if (selectedImage?.id === imageId) {
          const data = await res.json();
          setSelectedImage(data.image);
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const uploadImage = async (file: File, category: string) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      formData.append("context", `Uploaded to ${category} category`);

      const res = await fetch(`${API_BASE}/api/v1/images/library/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        fetchImages();
        fetchStats();
        setSelectedImage(data.image);
        setShowUploadDialog(false);
      } else {
        const error = await res.json();
        alert(`Upload failed: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const reEvaluateImage = async (imageId: string) => {
    try {
      setReEvaluating(true);
      const res = await fetch(`${API_BASE}/api/v1/images/library/${imageId}/re-evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        fetchImages();
        setSelectedImage(data.image);
      } else {
        const error = await res.json();
        alert(`Re-evaluation failed: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to re-evaluate image:", error);
      alert("Re-evaluation failed. Please try again.");
    } finally {
      setReEvaluating(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    try {
      await fetch(`${API_BASE}/api/v1/images/library/${imageId}`, { method: "DELETE" });
      fetchImages();
      fetchStats();
      setSelectedImage(null);
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  // Toggle reference image selection
  const toggleRefImage = (imageId: string) => {
    setSelectedRefImages((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : prev.length < 8
          ? [...prev, imageId]
          : prev // Max 8 reference images
    );
  };

  // Generate image using Nano Banana API
  const generateImage = async () => {
    if (!genPrompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    try {
      setGenerating(true);

      // Separate preloaded refs from library image IDs
      const preloadedRefPaths: string[] = [];
      const libraryImageIds: string[] = [];

      selectedRefImages.forEach((refId) => {
        const preloaded = PRELOADED_REFS.find((ref) => ref.id === refId);
        if (preloaded) {
          preloadedRefPaths.push(preloaded.src);
        } else {
          libraryImageIds.push(refId);
        }
      });

      // Build generation request
      const requestBody = {
        prompt: genPrompt,
        model: genModel, // "nano-banana" or "nano-banana-pro"
        aspect_ratio: genAspectRatio,
        category: genCategory,
        include_jasper_logo: includeJasperLogo,
        preloaded_ref_paths: preloadedRefPaths, // Static reference images
        library_image_ids: libraryImageIds, // Library image IDs to fetch
        output_format: "jpeg",
        resolution: "2k", // 2048px
        use_batch_api: true, // 50% cost savings
      };

      const res = await fetch(`${API_BASE}/api/v1/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        const data = await res.json();
        // Refresh library to show new image
        fetchImages();
        fetchStats();

        // Select the newly generated image
        if (data.image) {
          setSelectedImage(data.image);
        }

        // Reset form
        setShowGenerateDialog(false);
        setGenPrompt("");
        setSelectedRefImages([]);

        alert(`Image generated successfully!${data.batch_mode ? " (Using batch API for cost savings)" : ""}`);
      } else {
        const error = await res.json();
        alert(`Generation failed: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Search stock images
  const searchStockImages = async () => {
    if (!stockSearchQuery.trim()) {
      alert("Please enter a search query");
      return;
    }

    try {
      setStockSearching(true);
      setStockResults([]);
      setSelectedStockImages(new Set());

      const params = new URLSearchParams({
        query: stockSearchQuery,
        orientation: stockOrientation === "all" ? "" : stockOrientation,
        per_page: "24",
      });

      if (stockSource !== "all") {
        params.append("source", stockSource);
      }

      const res = await fetch(`${API_BASE}/api/v1/images/stock/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStockResults(data.images || []);
      } else {
        const error = await res.json();
        alert(`Search failed: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to search stock images:", error);
      alert("Search failed. Please try again.");
    } finally {
      setStockSearching(false);
    }
  };

  // Toggle stock image selection
  const toggleStockSelection = (imageId: string) => {
    setSelectedStockImages(prev => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  };

  // Import a single stock image
  const importStockImage = async (image: StockImageResult) => {
    try {
      setStockImporting(image.id);

      const res = await fetch(`${API_BASE}/api/v1/images/stock/import?max_width=1920&quality=85`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: image.id,
          source: image.source,
          download_url: image.download_url,
          preview_url: image.preview_url,
          photographer: image.photographer,
          photographer_url: image.photographer_url,
          source_url: image.source_url,
          license: image.license,
          description: image.description,
          category: stockCategory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        fetchImages();
        fetchStats();
        // Remove from results to show it's been imported
        setStockResults(prev => prev.filter(img => img.id !== image.id));
        setSelectedStockImages(prev => {
          const next = new Set(prev);
          next.delete(image.id);
          return next;
        });
        return data.image;
      } else {
        const error = await res.json();
        alert(`Import failed: ${error.detail || "Unknown error"}`);
        return null;
      }
    } catch (error) {
      console.error("Failed to import stock image:", error);
      alert("Import failed. Please try again.");
      return null;
    } finally {
      setStockImporting(null);
    }
  };

  // Import all selected stock images
  const importSelectedStockImages = async () => {
    const selectedImages = stockResults.filter(img => selectedStockImages.has(img.id));
    if (selectedImages.length === 0) return;

    for (const image of selectedImages) {
      await importStockImage(image);
    }
  };

  // Get preloaded reference images (JASPER logo and brand assets)
  const preloadedRefImages = images.filter(
    (img) => img.source === "preloaded" || img.category === "Brand Assets"
  );

  const filteredImages = images.filter((img) =>
    searchQuery
      ? img.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (img.ai_evaluation?.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (img.ai_evaluation?.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-emerald-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f14]">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F2A3C] border-b border-gray-200 dark:border-[#1a3d52] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-[#2C8A5B]" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Image Library</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Manage blog images and metadata for JASPER content</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchImages();
                fetchStats();
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowUploadDialog(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => setShowStockDialog(true)}
              className="flex items-center gap-2 px-4 py-2 border border-blue-400 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            >
              <Library className="w-4 h-4" />
              Browse Stock
            </button>
            <button
              className="relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2C8A5B] to-[#34d399] text-white rounded-lg font-semibold shadow-lg shadow-[#2C8A5B]/30 hover:shadow-[#2C8A5B]/50 hover:scale-[1.02] transition-all duration-200 group"
              onClick={() => setShowGenerateDialog(true)}
            >
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Generate Image
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-white dark:bg-[#111820] border-b border-gray-200 dark:border-[#1a3d52] px-6 py-3">
          <div className="flex gap-6 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Total: <strong className="text-gray-900 dark:text-white">{stats.total_images}</strong>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Used: <strong className="text-green-600 dark:text-green-400">{stats.used_count}</strong>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Unused: <strong className="text-orange-600 dark:text-orange-400">{stats.unused_count}</strong>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Favorites: <strong className="text-yellow-600 dark:text-yellow-400">{stats.favorites_count}</strong>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Avg Quality: <strong className={getScoreColor(stats.average_quality_score)}>{stats.average_quality_score.toFixed(1)}%</strong>
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-[#111820] border-b border-gray-200 dark:border-[#1a3d52] px-6 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by filename or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0F2A3C] border border-gray-300 dark:border-[#1a3d52] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#2C8A5B] focus:border-[#2C8A5B]"
            />
          </div>

          {/* Source Filter */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#0F2A3C] border border-gray-300 dark:border-[#1a3d52] rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2C8A5B]"
          >
            <option value="">All Sources</option>
            <option value="generated">Generated (AI)</option>
            <option value="pixabay">Pixabay</option>
            <option value="pexels">Pexels</option>
            <option value="unsplash">Unsplash</option>
            <option value="upload">Uploaded</option>
          </select>

          {/* Category Filter - DFI Sectors */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#0F2A3C] border border-gray-300 dark:border-[#1a3d52] rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2C8A5B]"
          >
            <option value="">All Sectors</option>
            {DFI_SECTORS.map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>

          {/* Toggle Buttons */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              showFavoritesOnly
                ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 dark:border-yellow-600 text-yellow-700 dark:text-yellow-400"
                : "bg-white dark:bg-[#0F2A3C] border-gray-300 dark:border-[#1a3d52] text-gray-700 dark:text-gray-300"
            }`}
          >
            <Star className={`w-4 h-4 ${showFavoritesOnly ? "fill-yellow-500 dark:fill-yellow-400" : ""}`} />
            Favorites
          </button>

          <button
            onClick={() => setShowUnusedOnly(!showUnusedOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              showUnusedOnly
                ? "bg-orange-100 dark:bg-orange-900/30 border-orange-500 dark:border-orange-600 text-orange-700 dark:text-orange-400"
                : "bg-white dark:bg-[#0F2A3C] border-gray-300 dark:border-[#1a3d52] text-gray-700 dark:text-gray-300"
            }`}
          >
            <Filter className="w-4 h-4" />
            Unused
          </button>

          {/* View Mode */}
          <div className="flex border border-gray-300 dark:border-[#1a3d52] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-[#2C8A5B]/20 text-[#2C8A5B]" : "bg-white dark:bg-[#0F2A3C] text-gray-500 dark:text-gray-400"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-[#2C8A5B]/20 text-[#2C8A5B]" : "bg-white dark:bg-[#0F2A3C] text-gray-500 dark:text-gray-400"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex">
        {/* Image Grid/List */}
        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2C8A5B]"></div>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">No images found</p>
              <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
                {images.length === 0
                  ? "Image library is empty. Generate or upload images to get started."
                  : "Try adjusting your filters or search query."
                }
              </p>
              <button
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#2C8A5B] text-white rounded-lg hover:bg-[#1E6B45] transition-colors"
                onClick={() => setShowGenerateDialog(true)}
              >
                <Sparkles className="w-4 h-4" />
                Generate First Image
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${
                    selectedImage?.id === img.id ? "border-[#2C8A5B]" : "border-gray-200 dark:border-[#1a3d52]"
                  } hover:border-[#2C8A5B]/60 transition-all bg-white dark:bg-[#0F2A3C] shadow-sm`}
                >
                  <div className="aspect-video bg-gray-100 dark:bg-[#1a3d52]">
                    <img
                      src={img.public_url}
                      alt={img.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/placeholder.jpg";
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <div className="p-2 w-full text-white">
                      <p className="text-xs truncate">{img.filename}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">{img.source}</span>
                        {img.is_favorite && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                        <span className={`text-xs ml-auto ${getScoreColor(img.ai_evaluation?.quality_score || 0)}`}>
                          {(img.ai_evaluation?.quality_score || 0).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {img.used_in.length > 0 && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                      In Use
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={`flex items-center gap-4 p-3 bg-white dark:bg-[#0F2A3C] rounded-lg border cursor-pointer ${
                    selectedImage?.id === img.id ? "border-[#2C8A5B] ring-2 ring-[#2C8A5B]/20" : "border-gray-200 dark:border-[#1a3d52]"
                  } hover:border-[#2C8A5B]/60`}
                >
                  <div className="w-24 h-16 bg-gray-100 dark:bg-[#1a3d52] rounded overflow-hidden flex-shrink-0">
                    <img
                      src={img.public_url}
                      alt={img.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-gray-900 dark:text-white">{img.filename}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="bg-gray-100 dark:bg-[#1a3d52] px-2 py-0.5 rounded">{img.source}</span>
                      <span>{img.category}</span>
                      {img.used_in.length > 0 && (
                        <span className="text-green-600 dark:text-green-400">Used in {img.used_in.length} article(s)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(img.id, img.is_favorite);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-[#1a3d52] rounded"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          img.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400 dark:text-gray-500"
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${getScoreColor(img.ai_evaluation?.quality_score || 0)}`}>
                      {(img.ai_evaluation?.quality_score || 0).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedImage && (
          <div className="w-96 bg-white dark:bg-[#0F2A3C] border-l border-gray-200 dark:border-[#1a3d52] p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="aspect-video bg-gray-100 dark:bg-[#1a3d52] rounded-lg overflow-hidden">
                <img
                  src={selectedImage.public_url}
                  alt={selectedImage.filename}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{selectedImage.filename}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ID: {selectedImage.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Source</p>
                  <p className="font-medium capitalize text-gray-900 dark:text-white">{selectedImage.source}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedImage.category || "Uncategorized"}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Quality Score</p>
                  <p className={`font-medium ${getScoreColor(selectedImage.ai_evaluation?.quality_score || 0)}`}>
                    {(selectedImage.ai_evaluation?.quality_score || 0).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Brand Alignment</p>
                  <p className={`font-medium ${getScoreColor(selectedImage.ai_evaluation?.brand_alignment || 0)}`}>
                    {(selectedImage.ai_evaluation?.brand_alignment || 0).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Dimensions</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedImage.metadata?.width || 0} x {selectedImage.metadata?.height || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">File Size</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedImage.metadata?.file_size
                      ? `${(selectedImage.metadata.file_size / 1024).toFixed(0)} KB`
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(selectedImage.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Format</p>
                  <p className="font-medium uppercase text-gray-900 dark:text-white">{selectedImage.metadata?.format || "jpeg"}</p>
                </div>
              </div>

              {/* AI Description */}
              {selectedImage.ai_evaluation?.description && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">AI Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedImage.ai_evaluation.description}</p>
                </div>
              )}

              {/* Dominant Colors */}
              {selectedImage.ai_evaluation?.dominant_colors?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2 flex items-center gap-1">
                    <Palette className="w-3 h-3" />
                    Dominant Colors
                  </p>
                  <div className="flex gap-2">
                    {selectedImage.ai_evaluation.dominant_colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded border border-gray-200 dark:border-gray-600 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedImage.ai_evaluation?.tags?.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">AI Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedImage.ai_evaluation.tags.map((tag) => (
                      <span key={tag} className="bg-gray-100 dark:bg-[#1a3d52] text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attribution */}
              {selectedImage.attribution?.photographer && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Attribution</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Photo by <strong>{selectedImage.attribution.photographer}</strong>
                    {selectedImage.attribution.source_name && (
                      <span> on {selectedImage.attribution.source_name}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    License: {selectedImage.attribution.license}
                  </p>
                </div>
              )}

              {/* Prompt for generated images */}
              {selectedImage.prompt && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Generation Prompt</p>
                  <p className="text-xs bg-gray-50 dark:bg-[#1a3d52] p-2 rounded border border-gray-200 dark:border-[#1a3d52] text-gray-700 dark:text-gray-300">{selectedImage.prompt}</p>
                </div>
              )}

              {selectedImage.used_in.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Used In Articles</p>
                  <div className="space-y-1">
                    {selectedImage.used_in.map((slug) => (
                      <a
                        key={slug}
                        href={`https://jasperfinance.org/insights/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-emerald-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {slug}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-[#1a3d52]">
                <button
                  onClick={() => toggleFavorite(selectedImage.id, selectedImage.is_favorite)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border ${
                    selectedImage.is_favorite
                      ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 text-yellow-700 dark:text-yellow-400"
                      : "border-gray-300 dark:border-[#1a3d52] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a3d52]"
                  }`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      selectedImage.is_favorite ? "fill-yellow-400" : ""
                    }`}
                  />
                  {selectedImage.is_favorite ? "Favorited" : "Favorite"}
                </button>
                <button
                  onClick={() => reEvaluateImage(selectedImage.id)}
                  disabled={reEvaluating}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-[#1a3d52] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a3d52] disabled:opacity-50"
                  title="Re-run AI evaluation"
                >
                  <Wand2 className={`w-4 h-4 ${reEvaluating ? "animate-spin" : ""}`} />
                </button>
                <a
                  href={selectedImage.public_url}
                  download
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-[#1a3d52] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a3d52]"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => deleteImage(selectedImage.id)}
                  disabled={selectedImage.used_in.length > 0}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={selectedImage.used_in.length > 0 ? "Cannot delete image in use" : "Delete image"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {selectedImage.used_in.length > 0 && (
                <p className="text-xs text-gray-500 text-center">
                  Images in use cannot be deleted
                </p>
              )}

              {/* AI Evaluation timestamp */}
              {selectedImage.ai_evaluation?.evaluated_at && (
                <p className="text-xs text-gray-400 text-center">
                  AI evaluated: {new Date(selectedImage.ai_evaluation.evaluated_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Upload Image</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload an image to the library. It will be automatically converted to JPEG
              and evaluated by AI for tags, quality, and brand alignment.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const file = formData.get("file") as File;
                const category = formData.get("category") as string;
                if (file && file.size > 0) {
                  uploadImage(file, category);
                }
              }}
            >
              <div className="space-y-4">
                {/* File Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image File
                  </label>
                  <input
                    type="file"
                    name="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff"
                    required
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Accepts: JPEG, PNG, WebP, GIF, BMP, TIFF (max 10MB)
                  </p>
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue="DFI Insights"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    {DFI_SECTORS.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadDialog(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload & Evaluate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Image Dialog */}
      {showGenerateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Generate Hero Image</h3>
                    <p className="text-sm text-gray-500">Using Nano Banana AI (Google Gemini)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGenerateDialog(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Prompt
                </label>
                <textarea
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  placeholder="Describe the hero image you want to generate. Be specific about style, composition, and subject matter..."
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Include style cues like "professional", "modern", "corporate", "photorealistic"
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGenModel("nano-banana")}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      genModel === "nano-banana"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Nano Banana</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Fast</span>
                    </div>
                    <p className="text-xs text-gray-500">Gemini 2.5 Flash Image</p>
                    <p className="text-xs text-emerald-600 mt-1">$0.039 / image</p>
                  </button>
                  <button
                    onClick={() => setGenModel("nano-banana-pro")}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      genModel === "nano-banana-pro"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Nano Banana Pro</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Quality</span>
                    </div>
                    <p className="text-xs text-gray-500">Gemini 3.0 Pro Image</p>
                    <p className="text-xs text-emerald-600 mt-1">$0.067 / image (batch)</p>
                  </button>
                </div>
              </div>

              {/* Aspect Ratio & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={genAspectRatio}
                    onChange={(e) => setGenAspectRatio(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="16:9">16:9 (Hero/Banner)</option>
                    <option value="4:3">4:3 (Standard)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="3:2">3:2 (Photo)</option>
                    <option value="21:9">21:9 (Ultra-wide)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={genCategory}
                    onChange={(e) => setGenCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    {DFI_SECTORS.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* JASPER Logo Option */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="include-logo"
                  checked={includeJasperLogo}
                  onChange={(e) => setIncludeJasperLogo(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="include-logo" className="flex-1">
                  <span className="font-medium">Include JASPER Logo</span>
                  <p className="text-xs text-gray-500">
                    Subtly incorporate JASPER branding into the generated image
                  </p>
                </label>
                <div className="w-12 h-12 bg-white rounded-lg border p-1">
                  <img
                    src="/images/jasper-icon.png"
                    alt="JASPER Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>

              {/* Reference Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Reference Images ({selectedRefImages.length}/8)
                  </label>
                  <button
                    onClick={() => setShowRefImagePicker(!showRefImagePicker)}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    {showRefImagePicker ? "Hide Library" : "Browse Library"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Select images to guide the AI's style and composition (optional)
                </p>

                {/* Selected Reference Images */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedRefImages.map((refId) => {
                    // Check if it's a preloaded ref or library image
                    const preloadedRef = PRELOADED_REFS.find((ref) => ref.id === refId);
                    const libraryImg = images.find((img) => img.id === refId);
                    const imgSrc = preloadedRef?.src || libraryImg?.public_url;
                    const imgName = preloadedRef?.name || libraryImg?.filename;

                    return imgSrc ? (
                      <div key={refId} className="relative group">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={imgSrc}
                            alt={imgName || ""}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {preloadedRef && (
                          <div className="absolute top-0.5 left-0.5 bg-blue-500 text-white text-[7px] px-0.5 rounded">
                            REF
                          </div>
                        )}
                        <button
                          onClick={() => toggleRefImage(refId)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ) : null;
                  })}
                  {selectedRefImages.length < 8 && (
                    <button
                      onClick={() => setShowRefImagePicker(true)}
                      className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors"
                    >
                      <span className="text-2xl">+</span>
                    </button>
                  )}
                </div>

                {/* Reference Image Picker */}
                {showRefImagePicker && (
                  <div className="border rounded-lg p-3 max-h-64 overflow-y-auto bg-gray-50">
                    {/* Preloaded Reference Images */}
                    <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Preloaded References (JASPER Branded)
                    </p>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {PRELOADED_REFS.map((ref) => (
                        <button
                          key={ref.id}
                          onClick={() => toggleRefImage(ref.id)}
                          className={`relative aspect-video rounded overflow-hidden border-2 group ${
                            selectedRefImages.includes(ref.id)
                              ? "border-emerald-500 ring-2 ring-emerald-200"
                              : "border-gray-200 hover:border-emerald-300"
                          }`}
                          title={ref.name}
                        >
                          <img
                            src={ref.src}
                            alt={ref.name}
                            className="w-full h-full object-cover"
                          />
                          {selectedRefImages.includes(ref.id) && (
                            <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                              <span className="text-white text-lg">✓</span>
                            </div>
                          )}
                          <div className="absolute top-0.5 left-0.5 bg-blue-500 text-white text-[7px] px-1 rounded opacity-80">
                            {ref.category}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                            {ref.name}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Library Images */}
                    {images.length > 0 && (
                      <>
                        <p className="text-xs font-medium text-gray-600 mb-2 border-t pt-2">
                          Library Images
                        </p>
                        <div className="grid grid-cols-6 gap-2">
                          {images.slice(0, 18).map((img) => (
                            <button
                              key={img.id}
                              onClick={() => toggleRefImage(img.id)}
                              className={`relative aspect-square rounded overflow-hidden border-2 ${
                                selectedRefImages.includes(img.id)
                                  ? "border-emerald-500 ring-2 ring-emerald-200"
                                  : "border-transparent hover:border-gray-300"
                              }`}
                            >
                              <img
                                src={img.public_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {selectedRefImages.includes(img.id) && (
                                <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                                  <span className="text-white text-lg">✓</span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Cost Estimate */}
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Estimated Cost:</span>
                  <span className="font-medium text-blue-900">
                    {genModel === "nano-banana" ? "$0.039" : "$0.067"}
                    <span className="text-xs text-blue-600 ml-1">(batch mode)</span>
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Output: 2048px {genAspectRatio} JPEG • Using Google AI Direct API
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowGenerateDialog(false);
                  setGenPrompt("");
                  setSelectedRefImages([]);
                }}
                disabled={generating}
                className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={generateImage}
                disabled={generating || !genPrompt.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Image
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Image Search Dialog */}
      {showStockDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0F2A3C] rounded-xl shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-[#1a3d52]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <Library className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Browse Stock Images</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Search Unsplash, Pexels & Pixabay</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowStockDialog(false);
                    setStockResults([]);
                    setStockSearchQuery("");
                    setSelectedStockImages(new Set());
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Controls */}
            <div className="p-4 border-b border-gray-200 dark:border-[#1a3d52] space-y-4">
              {/* Search Input */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for images... (e.g., solar panels, renewable energy, african agriculture)"
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchStockImages()}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111820] border border-gray-300 dark:border-[#1a3d52] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={searchStockImages}
                  disabled={stockSearching || !stockSearchQuery.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stockSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Source Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Source:</span>
                  <select
                    value={stockSource}
                    onChange={(e) => setStockSource(e.target.value as typeof stockSource)}
                    className="px-3 py-1.5 bg-white dark:bg-[#111820] border border-gray-300 dark:border-[#1a3d52] rounded-lg text-sm text-gray-900 dark:text-white"
                  >
                    <option value="all">All Sources</option>
                    <option value="unsplash">Unsplash</option>
                    <option value="pexels">Pexels</option>
                    <option value="pixabay">Pixabay</option>
                  </select>
                </div>

                {/* Orientation Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Orientation:</span>
                  <select
                    value={stockOrientation}
                    onChange={(e) => setStockOrientation(e.target.value as typeof stockOrientation)}
                    className="px-3 py-1.5 bg-white dark:bg-[#111820] border border-gray-300 dark:border-[#1a3d52] rounded-lg text-sm text-gray-900 dark:text-white"
                  >
                    <option value="all">All</option>
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                    <option value="square">Square</option>
                  </select>
                </div>

                {/* Category for Import */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Import to:</span>
                  <select
                    value={stockCategory}
                    onChange={(e) => setStockCategory(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-[#111820] border border-gray-300 dark:border-[#1a3d52] rounded-lg text-sm text-gray-900 dark:text-white"
                  >
                    {DFI_SECTORS.map((sector) => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>

                {/* Selection Info & Bulk Import */}
                {selectedStockImages.size > 0 && (
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      {selectedStockImages.size} selected
                    </span>
                    <button
                      onClick={importSelectedStockImages}
                      disabled={stockImporting !== null}
                      className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Import Selected
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {stockSearching ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Searching stock libraries...</span>
                  </div>
                </div>
              ) : stockResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <Library className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-lg font-medium">
                    {stockSearchQuery ? "No images found" : "Search for stock images"}
                  </p>
                  <p className="text-sm mt-1">
                    {stockSearchQuery
                      ? "Try different keywords or filters"
                      : "Enter a search term to browse free stock photos"
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {stockResults.map((image) => (
                    <div
                      key={`${image.source}-${image.id}`}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedStockImages.has(image.id)
                          ? "border-blue-500 ring-2 ring-blue-500/30"
                          : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      onClick={() => toggleStockSelection(image.id)}
                    >
                      {/* Image Preview */}
                      <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                        <img
                          src={image.preview_url}
                          alt={image.description || "Stock image"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Selection Checkbox */}
                      <div
                        className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          selectedStockImages.has(image.id)
                            ? "bg-blue-500 text-white"
                            : "bg-white/80 dark:bg-black/50 text-transparent group-hover:text-gray-400"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </div>

                      {/* Source Badge */}
                      <div className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded bg-black/50 text-white capitalize">
                        {image.source}
                      </div>

                      {/* Overlay with Info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-white text-sm line-clamp-2">
                          {image.description || "No description"}
                        </p>
                        <p className="text-white/70 text-xs mt-1">
                          by {image.photographer} • {image.width}×{image.height}
                        </p>

                        {/* Quick Import Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            importStockImage(image);
                          }}
                          disabled={stockImporting === image.id}
                          className="mt-2 flex items-center justify-center gap-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                        >
                          {stockImporting === image.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              Import as JPEG
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-[#1a3d52] bg-gray-50 dark:bg-[#111820]">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Images are converted to optimized JPEG (max 1920px, 85% quality) on import.
                  <br />
                  Attribution is automatically preserved for proper licensing.
                </p>
                <button
                  onClick={() => {
                    setShowStockDialog(false);
                    setStockResults([]);
                    setStockSearchQuery("");
                    setSelectedStockImages(new Set());
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
