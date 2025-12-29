"use client";

/**
 * Image Picker Block for BlockNote
 *
 * Custom image block that integrates with JASPER image library
 * Shows quality scores, categories, and favorites filter
 */

import { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon,
  Search,
  Star,
  Filter,
  X,
  CheckCircle,
  Loader2,
  Upload,
  ExternalLink,
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

interface ImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: ImageEntry) => void;
  apiBase: string;
  currentImageUrl?: string;
}

export function ImagePicker({
  isOpen,
  onClose,
  onSelect,
  apiBase,
  currentImageUrl,
}: ImagePickerProps) {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageEntry | null>(null);

  // Fetch images from API
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
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, fetchImages]);

  // Filter images based on search, category, and favorites
  useEffect(() => {
    let filtered = [...images];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (img) =>
          img.filename.toLowerCase().includes(query) ||
          img.category?.toLowerCase().includes(query) ||
          img.ai_evaluation?.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((img) => img.category === categoryFilter);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((img) => img.is_favorite);
    }

    // Sort by quality score (highest first)
    filtered.sort((a, b) => {
      const scoreA = a.ai_evaluation?.quality_score || 0;
      const scoreB = b.ai_evaluation?.quality_score || 0;
      return scoreB - scoreA;
    });

    setFilteredImages(filtered);
  }, [images, searchQuery, categoryFilter, showFavoritesOnly]);

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(images.map((img) => img.category).filter(Boolean)))];

  // Handle image selection
  const handleSelect = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      onClose();
    }
  };

  // Resolve image URL
  const resolveUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/")) return `${apiBase}${url}`;
    return url;
  };

  // Quality score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-600" />
            Select Image from Library
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Favorites Toggle */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showFavoritesOnly
                ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Star className={`w-4 h-4 ${showFavoritesOnly ? "fill-yellow-400" : ""}`} />
            Favorites
          </button>

          {/* Image count */}
          <span className="text-sm text-gray-500">
            {filteredImages.length} image{filteredImages.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-red-600">
              <p>{error}</p>
              <button
                onClick={fetchImages}
                className="mt-2 text-sm text-emerald-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <ImageIcon className="w-12 h-12 mb-2 text-gray-300" />
              <p>No images found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-sm text-emerald-600 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage?.id === image.id
                      ? "border-emerald-500 ring-2 ring-emerald-200"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={resolveUrl(image.public_url)}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Overlay with info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-xs truncate">{image.filename}</p>
                      {image.category && (
                        <p className="text-white/70 text-xs">{image.category}</p>
                      )}
                    </div>
                  </div>

                  {/* Quality Score Badge */}
                  {image.ai_evaluation?.quality_score && (
                    <div
                      className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-medium ${getScoreColor(
                        image.ai_evaluation.quality_score
                      )}`}
                    >
                      {image.ai_evaluation.quality_score}%
                    </div>
                  )}

                  {/* Favorite Star */}
                  {image.is_favorite && (
                    <Star className="absolute top-2 left-2 w-4 h-4 text-yellow-400 fill-yellow-400" />
                  )}

                  {/* Selected Checkmark */}
                  {selectedImage?.id === image.id && (
                    <div className="absolute top-2 left-2 bg-emerald-500 rounded-full p-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Hero suitable badge */}
                  {image.ai_evaluation?.is_suitable_for_hero && (
                    <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                      Hero
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <img
                src={resolveUrl(selectedImage.public_url)}
                alt={selectedImage.filename}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{selectedImage.filename}</p>
                <p className="text-sm text-gray-500">
                  {selectedImage.category || "Uncategorized"}
                  {selectedImage.ai_evaluation?.quality_score &&
                    ` • Quality: ${selectedImage.ai_evaluation.quality_score}%`}
                </p>
                {selectedImage.ai_evaluation?.description && (
                  <p className="text-xs text-gray-400 truncate">
                    {selectedImage.ai_evaluation.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedImage}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Select Image
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImagePicker;
