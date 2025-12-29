"use client";

/**
 * Custom File Panel for BlockNote
 *
 * Replaces the default Upload/Embed tabs with:
 * - Library tab: Browse existing images from JASPER media library
 * - Upload tab: Upload new images (goes to media library with AI analysis)
 * - URL tab: Embed image from URL
 */

import { useState, useEffect, useCallback } from "react";
import { useBlockNoteEditor, useComponentsContext } from "@blocknote/react";
import { FilePanelProps } from "@blocknote/react";
import {
  Image as ImageIcon,
  Search,
  Star,
  Filter,
  Upload,
  Link,
  Loader2,
  CheckCircle,
  X,
  Library,
} from "lucide-react";

interface ImageEntry {
  id: string;
  filename: string;
  public_url: string;
  source: string;
  category: string;
  is_favorite: boolean;
  used_in: string[];
  ai_evaluation?: {
    quality_score: number;
    description: string;
    is_suitable_for_hero: boolean;
  };
}

export function CustomFilePanel({ blockId }: FilePanelProps) {
  // Get editor instance from context
  const editor = useBlockNoteEditor();

  // Get the block from the editor
  const block = editor.getBlock(blockId);
  const [activeTab, setActiveTab] = useState<"library" | "upload" | "url">("library");
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Get API base from environment or default
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "https://api.jasperfinance.org";

  // Fetch images from library
  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${apiBase}/api/v1/images/library`);
      if (!response.ok) throw new Error("Failed to fetch images");
      const data = await response.json();
      setImages(data.images || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    if (activeTab === "library") {
      fetchImages();
    }
  }, [activeTab, fetchImages]);

  // Filter images
  useEffect(() => {
    let filtered = [...images];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (img) =>
          img.filename.toLowerCase().includes(query) ||
          img.category?.toLowerCase().includes(query) ||
          img.ai_evaluation?.description?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((img) => img.category === categoryFilter);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter((img) => img.is_favorite);
    }

    filtered.sort((a, b) => {
      const scoreA = a.ai_evaluation?.quality_score || 0;
      const scoreB = b.ai_evaluation?.quality_score || 0;
      return scoreB - scoreA;
    });

    setFilteredImages(filtered);
  }, [images, searchQuery, categoryFilter, showFavoritesOnly]);

  const categories = ["all", ...Array.from(new Set(images.map((img) => img.category).filter(Boolean)))];

  const resolveUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/")) return `${apiBase}${url}`;
    return url;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  // Handle library image selection
  const handleSelectImage = (image: ImageEntry) => {
    if (!block) return;
    const imageUrl = resolveUrl(image.public_url);
    editor.updateBlock(block, {
      type: "image",
      props: {
        url: imageUrl,
        caption: image.filename,
      },
    });
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", "content-editor");
      formData.append("category", "article-images");

      const response = await fetch(`${apiBase}/api/v1/images/library/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to upload image");
      }

      const data = await response.json();
      const imageUrl = data.public_url.startsWith("/")
        ? `${apiBase}${data.public_url}`
        : data.public_url;

      if (block) {
        editor.updateBlock(block, {
          type: "image",
          props: {
            url: imageUrl,
            caption: data.filename || file.name,
          },
        });
      }
    } catch (err) {
      console.error("[CustomFilePanel] Upload failed:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Handle URL embed
  const handleUrlEmbed = () => {
    if (!urlInput.trim() || !block) return;

    editor.updateBlock(block, {
      type: "image",
      props: {
        url: urlInput.trim(),
      },
    });
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-[500px] max-h-[400px] overflow-hidden flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("library")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === "library"
              ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Library className="w-4 h-4" />
          Library
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === "upload"
              ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
        <button
          onClick={() => setActiveTab("url")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === "url"
              ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Link className="w-4 h-4" />
          URL
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm flex items-center gap-2">
          <X className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Library Tab */}
      {activeTab === "library" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search and filters */}
          <div className="p-3 border-b border-gray-100 flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[150px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All" : cat}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`p-1.5 rounded-md border transition-colors ${
                showFavoritesOnly
                  ? "bg-yellow-50 border-yellow-300 text-yellow-600"
                  : "border-gray-200 text-gray-400 hover:bg-gray-50"
              }`}
              title="Show favorites only"
            >
              <Star className={`w-4 h-4 ${showFavoritesOnly ? "fill-yellow-400" : ""}`} />
            </button>
          </div>

          {/* Image grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <ImageIcon className="w-8 h-8 mb-2 text-gray-300" />
                <p className="text-sm">No images found</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {filteredImages.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => handleSelectImage(image)}
                    className="relative aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all group"
                  >
                    <img
                      src={resolveUrl(image.public_url)}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    {/* Quality badge */}
                    {image.ai_evaluation?.quality_score && (
                      <div
                        className={`absolute top-1 right-1 px-1 py-0.5 rounded text-[10px] font-medium ${getScoreColor(
                          image.ai_evaluation.quality_score
                        )}`}
                      >
                        {image.ai_evaluation.quality_score}%
                      </div>
                    )}
                    {/* Favorite star */}
                    {image.is_favorite && (
                      <Star className="absolute top-1 left-1 w-3 h-3 text-yellow-400 fill-yellow-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info footer */}
          <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-500">
            {filteredImages.length} image{filteredImages.length !== 1 ? "s" : ""} in library
          </div>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="flex-1 p-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                <p className="text-sm text-gray-600">Uploading to media library...</p>
                <p className="text-xs text-gray-400 mt-1">AI analysis in progress</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Drag and drop an image here, or
                </p>
                <label className="inline-block">
                  <span className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 cursor-pointer">
                    Browse Files
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-3">
                  Images are saved to your media library with AI-powered tagging
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* URL Tab */}
      {activeTab === "url" && (
        <div className="flex-1 p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={handleUrlEmbed}
              disabled={!urlInput.trim()}
              className="w-full px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Link className="w-4 h-4" />
              Embed Image
            </button>
            <p className="text-xs text-gray-400 text-center">
              Enter the URL of an image to embed it directly
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomFilePanel;
