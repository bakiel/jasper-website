"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  ImageIcon,
  Monitor,
  Smartphone,
  RefreshCw,
  TrendingUp,
  ExternalLink,
  Search,
  Star,
  Filter,
  X,
  CheckCircle,
  Sparkles,
  Globe,
  FileText,
  Eye,
  EyeOff,
  ChevronDown,
  Code,
  LayoutGrid,
  Upload,
} from "lucide-react";
// New BlockNote editor and serializers
import { BlockNoteEditor } from "@/components/content/BlockNoteEditor";
import { BlockNoteErrorBoundary } from "@/components/content/BlockNoteErrorBoundary";
import {
  ContentBlock,
  contentBlocksToBlockNote,
  contentBlocksToMarkdown,
  blockNoteToContentBlocks,
  blockNoteToMarkdown,
  markdownToBlockNote,
} from "@/lib/content-serializers";

interface Article {
  slug: string;
  title: string;
  content: string;
  content_blocks?: ContentBlock[]; // Block-based content
  excerpt: string;
  category: string;
  author?: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  heroImage: string;
  heroImageId?: string;
  seoScore: number;
  qualityScore: number;
  createdAt: string;
  research?: {
    sources: Array<{ title: string; url: string }>;
    grounding_confidence: number;
  };
}

interface Author {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  bio?: string;
  isDefault?: boolean;
}

// Updated to match backend LibraryImage.to_dict() response
interface ImageEntry {
  id: string;
  filename: string;
  public_url: string;
  source: string;
  category: string;
  is_favorite: boolean;
  used_in: string[]; // Article slugs this image is used in
  ai_evaluation?: {
    quality_score: number;
    composition_score: number;
    technical_score: number;
    style_tags: string[];
    suggested_categories: string[];
    description: string;
    dominant_colors: string[];
    is_suitable_for_hero: boolean;
    evaluated_at: string;
  };
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_CRM_API_URL || "https://api.jasperfinance.org";

const CATEGORIES = [
  "all",
  "finance",
  "business",
  "technology",
  "agriculture",
  "infrastructure",
  "general",
];

// Gallery Preview Component - calculates optimal sizes for images
interface GalleryPreviewProps {
  images: Array<{ url: string; caption: string }>;
  caption?: string;
  resolveImageUrl: (url: string) => string;
}

function GalleryPreview({ images, caption, resolveImageUrl }: GalleryPreviewProps) {
  const [imageDimensions, setImageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleImageLoad = (index: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions(prev => {
      const newMap = new Map(prev);
      newMap.set(index, { width: img.naturalWidth, height: img.naturalHeight });
      return newMap;
    });
  };

  // Calculate optimal sizes: H = (Width - gaps) / sum(aspectRatios)
  const calculatedSizes = React.useMemo(() => {
    if (imageDimensions.size !== images.length || images.length === 0) {
      return null;
    }

    const gap = 8;
    const maxHeight = 220;
    const containerWidth = containerRef.current?.clientWidth || 500;
    const availableWidth = containerWidth - (images.length - 1) * gap;

    let sumAspectRatios = 0;
    const aspectRatios: number[] = [];

    for (let i = 0; i < images.length; i++) {
      const dim = imageDimensions.get(i);
      if (dim) {
        const ar = dim.width / dim.height;
        aspectRatios.push(ar);
        sumAspectRatios += ar;
      }
    }

    if (sumAspectRatios === 0) return null;

    let commonHeight = availableWidth / sumAspectRatios;
    if (commonHeight > maxHeight) commonHeight = maxHeight;

    const widths = aspectRatios.map(ar => Math.floor(commonHeight * ar));

    return { height: Math.floor(commonHeight), widths };
  }, [imageDimensions, images.length]);

  return (
    <div className="my-4">
      <div
        ref={containerRef}
        className="flex items-end justify-center gap-2"
        style={{ width: "100%" }}
      >
        {images.map((img, idx) => {
          const hasCalculatedSize = calculatedSizes && calculatedSizes.widths[idx];
          return (
            <div
              key={idx}
              className="rounded-lg overflow-hidden bg-gray-50"
              style={hasCalculatedSize ? {
                width: `${calculatedSizes.widths[idx]}px`,
                height: `${calculatedSizes.height}px`,
              } : {
                height: "180px",
              }}
            >
              <img
                src={resolveImageUrl(img.url)}
                alt={img.caption || `Gallery image ${idx + 1}`}
                className="w-full h-full object-cover"
                onLoad={(e) => handleImageLoad(idx, e)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          );
        })}
      </div>
      {caption && (
        <p className="mt-2 text-sm text-gray-600 italic text-center">
          {caption}
        </p>
      )}
    </div>
  );
}

export default function ArticleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageEntry[]>([]);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(0);

  // Image picker filters
  const [imageSearch, setImageSearch] = useState("");
  const [imageCategory, setImageCategory] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showHeroSuitableOnly, setShowHeroSuitableOnly] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("JASPER Research Team");
  const [authors, setAuthors] = useState<Author[]>([]);
  const [authorSuggestion, setAuthorSuggestion] = useState<{
    author_id: string;
    author_name: string;
    confidence: number;
    reasoning: string;
  } | null>(null);
  const [suggestingAuthor, setSuggestingAuthor] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [heroImage, setHeroImage] = useState("");
  const [heroImageId, setHeroImageId] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState<string>("draft");
  const [publishing, setPublishing] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Mobile responsive state
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  // Block editor state
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  // Default to markdown mode - reliable and always works
  // BlockNote (blocks mode) is optional enhancement
  const [editorMode, setEditorMode] = useState<"blocks" | "markdown">("markdown");
  const [inlineImageBlockId, setInlineImageBlockId] = useState<string | null>(null);

  // Drag and drop state for image picker modal
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    fetchAuthors(); // Always fetch authors for the dropdown
    if (slug && slug !== "new") {
      fetchArticle();
    } else {
      setLoading(false);
    }
  }, [slug]);

  const fetchAuthors = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/blog/authors`);
      if (res.ok) {
        const data = await res.json();
        setAuthors(data.authors || []);
      }
    } catch (error) {
      console.error("Failed to fetch authors:", error);
    }
  };

  // AI-powered author suggestion
  const suggestAuthor = async () => {
    if (!title && !content) {
      alert("Add some content first for AI to analyze");
      return;
    }

    try {
      setSuggestingAuthor(true);
      setAuthorSuggestion(null);

      const res = await fetch(`${API_BASE}/api/v1/blog/authors/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled",
          content: content || excerpt || "",
          category: category || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.suggestion) {
          setAuthorSuggestion(data.suggestion);
        }
      } else {
        console.error("AI suggestion failed");
      }
    } catch (error) {
      console.error("Failed to get author suggestion:", error);
    } finally {
      setSuggestingAuthor(false);
    }
  };

  // Apply AI suggestion
  const applyAuthorSuggestion = () => {
    if (authorSuggestion) {
      setAuthor(authorSuggestion.author_name);
      setAuthorSuggestion(null);
    }
  };

  // Filter images when search/filters change
  useEffect(() => {
    let filtered = [...images];

    // Search filter
    if (imageSearch) {
      const search = imageSearch.toLowerCase();
      filtered = filtered.filter(
        (img) =>
          img.filename.toLowerCase().includes(search) ||
          (img as { original_filename?: string }).original_filename?.toLowerCase().includes(search) ||
          img.ai_evaluation?.description?.toLowerCase().includes(search) ||
          img.ai_evaluation?.style_tags?.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    // Category filter
    if (imageCategory !== "all") {
      filtered = filtered.filter(
        (img) =>
          img.category === imageCategory ||
          img.ai_evaluation?.suggested_categories?.includes(imageCategory)
      );
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((img) => img.is_favorite);
    }

    // Hero suitable filter
    if (showHeroSuitableOnly) {
      filtered = filtered.filter((img) => img.ai_evaluation?.is_suitable_for_hero !== false);
    }

    // Sort by quality score (highest first)
    filtered.sort((a, b) => {
      const scoreA = a.ai_evaluation?.quality_score || 0;
      const scoreB = b.ai_evaluation?.quality_score || 0;
      return scoreB - scoreA;
    });

    setFilteredImages(filtered);
  }, [images, imageSearch, imageCategory, showFavoritesOnly, showHeroSuitableOnly]);

  // Resolve image URLs to full paths for consistent rendering
  // Handles: full URLs, relative paths, blob URLs, and bare filenames
  const resolveImageUrl = (url: string) => {
    if (!url) return "";
    // Already a full URL (including blob URLs for in-session uploads)
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
    // Relative path starting with /
    if (url.startsWith("/")) return `${API_BASE}${url}`;
    // Just a filename - try to resolve through image library API
    // This handles legacy data where only filename was stored
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return `${API_BASE}/api/v1/images/library/serve/${encodeURIComponent(url)}`;
    }
    // Fallback
    return `${API_BASE}/${url}`;
  };

  // Normalize image URLs in content blocks when loading from API
  // This ensures Preview pane and BlockNote editor use the same full URLs
  const normalizeContentBlocks = (blocks: ContentBlock[]): ContentBlock[] => {
    return blocks.map(block => {
      if ((block.type === "image" || block.type === "infographic") && block.image_url) {
        return {
          ...block,
          image_url: resolveImageUrl(block.image_url)
        };
      }
      // Also normalize gallery image URLs
      if (block.type === "gallery" && block.images) {
        return {
          ...block,
          images: block.images.map(img => ({
            ...img,
            url: resolveImageUrl(img.url)
          }))
        };
      }
      return block;
    });
  };

  const fetchArticle = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/blog/posts/${slug}`);
      if (!res.ok) throw new Error("Article not found");
      const response = await res.json();
      // API returns { success: true, post: {...} } - unwrap the post object
      const data = response.post || response;
      setArticle(data);
      setTitle(data.title || "");
      setContent(data.content || "");
      setExcerpt(data.excerpt || "");
      setCategory(data.category || "DFI Insights");
      setAuthor(data.author || "JASPER Research Team");
      setSeoTitle(data.seoTitle || data.seo_title || "");
      setSeoDescription(data.seoDescription || data.seo_description || "");
      setTags(data.tags || []);
      setHeroImage(data.heroImage || data.hero_image || "");
      setHeroImageId(data.heroImageId || data.hero_image_id || null);
      setStatus(data.status || "draft");

      // Load content blocks if available, otherwise convert markdown to blocks
      // Keep editor in markdown mode (default) - user can switch to blocks if desired
      if (data.content_blocks && data.content_blocks.length > 0) {
        // CRITICAL: Normalize image URLs when loading from API
        // This ensures Preview pane displays images correctly (same as BlockNote editor)
        setContentBlocks(normalizeContentBlocks(data.content_blocks));
        // Don't auto-switch to blocks mode - let user choose
      } else if (data.content) {
        // Convert existing markdown content to blocks for backup
        try {
          const blockNoteBlocks = markdownToBlockNote(data.content);
          const contentBlocksFromMd = blockNoteToContentBlocks(blockNoteBlocks as any);
          // Also normalize URLs from markdown conversion
          setContentBlocks(normalizeContentBlocks(contentBlocksFromMd));
        } catch (e) {
          console.warn("Failed to convert markdown to blocks:", e);
        }
        // Don't auto-switch to blocks mode - markdown is reliable default
      }
    } catch (error) {
      console.error("Failed to fetch article:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    setImagesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/images/library/?limit=100&unused_only=false`);
      const data = await res.json();
      setImages(data.images || []);
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setImagesLoading(false);
    }
  };

  const markImageAsUsed = async (imageId: string, articleSlug: string) => {
    try {
      await fetch(`${API_BASE}/api/v1/images/library/${imageId}/mark-used`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_slug: articleSlug }),
      });
    } catch (error) {
      console.error("Failed to mark image as used:", error);
    }
  };

  // Upload image via drag and drop in modal
  const handleModalImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please drop an image file");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category || "general");

      const res = await fetch(`${API_BASE}/api/v1/images/library/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      // Refresh image library to show the new image
      await fetchImages();
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Drag and drop handlers for modal upload zone
  const handleUploadDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUploadDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingUpload(true);
  };

  const handleUploadDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingUpload(false);
  };

  const handleUploadDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingUpload(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleModalImageUpload(files[0]);
    }
  };

  // File input handler for click-to-upload
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleModalImageUpload(files[0]);
    }
  };

  const saveArticle = async () => {
    setSaving(true);
    try {
      // NOTE: API endpoint is /api/v1/blog/posts (no "admin" in path)
      const endpoint =
        slug === "new"
          ? `${API_BASE}/api/v1/blog/posts`
          : `${API_BASE}/api/v1/blog/posts/${slug}`;

      const method = slug === "new" ? "POST" : "PUT";

      // Generate markdown from blocks if in block mode
      const finalContent = editorMode === "blocks"
        ? contentBlocksToMarkdown(contentBlocks)
        : content;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: finalContent,
          content_blocks: contentBlocks, // Save blocks for structured editing
          excerpt,
          category,
          author,
          seoTitle: seoTitle || title.slice(0, 60),
          seoDescription: seoDescription || excerpt.slice(0, 160),
          tags,
          heroImage,
          heroImageId,
          status,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (slug === "new") {
          router.push(`/content/${data.slug}`);
        } else {
          fetchArticle();
        }
      }
    } catch (error) {
      console.error("Failed to save article:", error);
    } finally {
      setSaving(false);
    }
  };

  const publishArticle = async () => {
    if (!slug || slug === "new") return;

    setPublishing(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/blog/posts/${slug}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_share: false }),
      });

      if (res.ok) {
        setStatus("published");
        fetchArticle(); // Refresh to get updated data
      }
    } catch (error) {
      console.error("Failed to publish article:", error);
    } finally {
      setPublishing(false);
      setShowStatusMenu(false);
    }
  };

  const unpublishArticle = async () => {
    if (!slug || slug === "new") return;

    setPublishing(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/blog/posts/${slug}/unpublish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setStatus("draft");
        fetchArticle(); // Refresh to get updated data
      }
    } catch (error) {
      console.error("Failed to unpublish article:", error);
    } finally {
      setPublishing(false);
      setShowStatusMenu(false);
    }
  };

  const updatePreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  // Debounced preview update
  useEffect(() => {
    const timer = setTimeout(updatePreview, 300);
    return () => clearTimeout(timer);
  }, [title, content, excerpt, heroImage, updatePreview]);

  const handleTagsChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagsInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagsInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const selectImage = async (img: ImageEntry) => {
    // Normalize URL to full path at storage time
    // This ensures images display correctly in both editor and preview
    const normalizedUrl = img.public_url.startsWith("http://") || img.public_url.startsWith("https://")
      ? img.public_url
      : img.public_url.startsWith("/")
        ? `${API_BASE}${img.public_url}`
        : `${API_BASE}/api/v1/images/library/serve/${encodeURIComponent(img.public_url)}`;

    // Check if this is for an inline block image or hero image
    if (inlineImageBlockId) {
      // Update the block with the selected image
      const newBlocks = contentBlocks.map((block) =>
        block.id === inlineImageBlockId
          ? {
              ...block,
              image_id: img.id,
              image_url: normalizedUrl,
              alt_text: img.ai_evaluation?.description || img.filename,
            }
          : block
      );
      setContentBlocks(newBlocks);
      setInlineImageBlockId(null);
    } else {
      // Hero image selection
      setHeroImage(normalizedUrl);
      setHeroImageId(img.id);
    }

    setShowImagePicker(false);

    // Mark image as used in this article
    if (slug && slug !== "new") {
      await markImageAsUsed(img.id, slug);
    }
  };

  const openImagePicker = (forBlockId?: string) => {
    fetchImages();
    setImageSearch("");
    setImageCategory("all");
    setShowFavoritesOnly(false);
    setShowHeroSuitableOnly(forBlockId ? false : true); // Hero images need suitability check
    setInlineImageBlockId(forBlockId || null);
    setShowImagePicker(true);
  };

  // Enhanced markdown to HTML renderer
  const renderMarkdown = (md: string): string => {
    if (!md) return "";

    let html = md
      // Headers
      .replace(/^#### (.*$)/gm, '<h4 class="text-lg font-semibold mt-6 mb-2 text-gray-800">$1</h4>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mt-8 mb-3 text-gray-900">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-10 mb-4 text-gray-900">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-12 mb-6 text-gray-900">$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-emerald-600 hover:underline">$1</a>')
      // Unordered lists
      .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc pl-6 my-4 space-y-1">$&</ul>')
      // Ordered lists
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-emerald-500 pl-4 italic text-gray-600 my-4">$1</blockquote>')
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-emerald-700">$1</code>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="my-8 border-gray-200" />')
      // Paragraphs
      .replace(/\n\n/g, "</p><p class='my-4 leading-relaxed text-gray-700'>")
      .replace(/^(?!<)/, "<p class='my-4 leading-relaxed text-gray-700'>")
      .replace(/(?!>)$/, "</p>");

    return html;
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-3 sm:px-4 py-2 sm:py-3 sticky top-0 z-20">
        <div className="flex flex-wrap items-center justify-between gap-2 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/content" className="p-1.5 sm:p-2 hover:bg-gray-100 rounded">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm sm:text-base">
                {slug === "new" ? "New Article" : "Edit Article"}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                {/* Status Badge */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    status === "published"
                      ? "bg-green-100 text-green-700"
                      : status === "scheduled"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {status === "published" ? (
                    <Globe className="w-3 h-3" />
                  ) : status === "scheduled" ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
                  {status === "published" ? "Published" : status === "scheduled" ? "Scheduled" : "Draft"}
                </div>

                {/* Publish/Unpublish Button */}
                {slug !== "new" && (
                  <div className="relative">
                    {status === "published" ? (
                      <button
                        onClick={unpublishArticle}
                        disabled={publishing}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        {publishing ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={publishArticle}
                        disabled={publishing}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors"
                      >
                        {publishing ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Globe className="w-3 h-3" />
                        )}
                        Publish
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Preview Mode Toggle - hidden on mobile */}
            <div className="hidden md:flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`p-2 ${
                  previewMode === "desktop" ? "bg-emerald-100 text-emerald-700" : "bg-white"
                }`}
                title="Desktop Preview"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`p-2 ${
                  previewMode === "mobile" ? "bg-emerald-100 text-emerald-700" : "bg-white"
                }`}
                title="Mobile Preview"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* SEO Score Badge - compact on mobile */}
            {article?.seoScore !== undefined && (
              <div
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                  article.seoScore >= 70
                    ? "bg-green-100 text-green-700"
                    : article.seoScore >= 50
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">SEO:</span> {article.seoScore}%
              </div>
            )}

            <button
              onClick={saveArticle}
              disabled={saving}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Save</span>
            </button>

            {slug !== "new" && (
              <a
                href={`https://jasperfinance.org/insights/${slug}`}
                target="_blank"
                className="hidden sm:flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4" />
                View Live
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Edit/Preview Toggle - only visible on small screens */}
      <div className="md:hidden flex bg-white border-b">
        <button
          onClick={() => setMobileView("edit")}
          className={`flex-1 py-2.5 text-sm font-medium text-center ${
            mobileView === "edit"
              ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => setMobileView("preview")}
          className={`flex-1 py-2.5 text-sm font-medium text-center ${
            mobileView === "preview"
              ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Main Content - Split Pane (responsive) */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-105px)] md:h-[calc(100vh-64px)]">
        {/* Editor Panel - full width on mobile, half on desktop */}
        <div className={`w-full md:w-1/2 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 ${
          mobileView === "edit" ? "block" : "hidden md:block"
        }`}>
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              className="w-full px-4 py-3 text-xl font-semibold border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Hero Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image</label>
            <div className="border rounded-lg overflow-hidden">
              {heroImage ? (
                <div className="relative">
                  <img
                    src={resolveImageUrl(heroImage)}
                    alt="Hero"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => openImagePicker()}
                    className="absolute bottom-2 right-2 flex items-center gap-2 px-3 py-1.5 bg-black/60 text-white text-sm rounded hover:bg-black/80"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Change Image
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openImagePicker()}
                  className="w-full h-48 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500"
                >
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span>Select Hero Image</span>
                </button>
              )}
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary of the article..."
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Content - Block Editor or Markdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Content</label>
              {/* Editor Mode Toggle */}
              <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
                <button
                  onClick={() => {
                    if (editorMode === "markdown") {
                      // Convert markdown to blocks when switching using new serializer
                      const blockNoteBlocks = markdownToBlockNote(content);
                      const blocks = blockNoteToContentBlocks(blockNoteBlocks as any);
                      setContentBlocks(blocks);
                    }
                    setEditorMode("blocks");
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded ${
                    editorMode === "blocks"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Blocks
                </button>
                <button
                  onClick={() => {
                    if (editorMode === "blocks") {
                      // Convert blocks to markdown when switching using new serializer
                      const markdown = contentBlocksToMarkdown(contentBlocks);
                      setContent(markdown);
                    }
                    setEditorMode("markdown");
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded ${
                    editorMode === "markdown"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  Markdown
                </button>
              </div>
            </div>

            {editorMode === "blocks" && !loading ? (
              <BlockNoteErrorBoundary
                onFallbackToMarkdown={() => setEditorMode("markdown")}
              >
                <BlockNoteEditor
                  key={`editor-${slug}`}
                  initialBlocks={contentBlocks}
                  initialContent={content}
                  onChange={(markdown, blocks) => {
                    setContentBlocks(blocks);
                    setContent(markdown); // Keep markdown in sync
                  }}
                  apiBase={API_BASE}
                />
              </BlockNoteErrorBoundary>
            ) : editorMode === "blocks" && loading ? (
              <div className="border border-gray-200 rounded-lg p-8 bg-gray-50 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content here... (Markdown supported)"
                rows={20}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
              />
            )}
          </div>

          {/* Author & Category - stack on mobile, side by side on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Author</label>
                <button
                  type="button"
                  onClick={suggestAuthor}
                  disabled={suggestingAuthor || (!title && !content)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="AI will suggest the best author based on content"
                >
                  {suggestingAuthor ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      AI Suggest
                    </>
                  )}
                </button>
              </div>
              <select
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value);
                  setAuthorSuggestion(null);
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {authors.length > 0 ? (
                  authors.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))
                ) : (
                  <option value="JASPER Research Team">JASPER Research Team</option>
                )}
              </select>

              {/* AI Suggestion Display */}
              {authorSuggestion && (
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">
                        {authorSuggestion.author_name}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      {authorSuggestion.confidence}% match
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{authorSuggestion.reasoning}</p>
                  <button
                    type="button"
                    onClick={applyAuthorSuggestion}
                    className="w-full px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Apply Suggestion
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="DFI Insights">DFI Insights</option>
                <option value="Financial Modelling">Financial Modelling</option>
                <option value="Sector Analysis">Sector Analysis</option>
                <option value="Industry News">Industry News</option>
                <option value="Case Studies">Case Studies</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex flex-wrap gap-1 p-2 border rounded-lg min-h-[42px]">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-sm"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-emerald-900">
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyDown={handleTagsChange}
                  placeholder="Add tag..."
                  className="flex-1 min-w-[100px] outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* SEO Fields */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              SEO Settings
            </h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                SEO Title ({seoTitle.length}/60)
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={title.slice(0, 60)}
                maxLength={60}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Meta Description ({seoDescription.length}/160)
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder={excerpt.slice(0, 160)}
                maxLength={160}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Research Sources */}
          {article?.research?.sources && article.research.sources.length > 0 && (
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Research Sources</h3>
              <p className="text-sm text-gray-600">
                Grounding Confidence: {article.research.grounding_confidence.toFixed(1)}%
              </p>
              <ul className="space-y-1">
                {article.research.sources.map((source, i) => (
                  <li key={i}>
                    <a
                      href={source.url}
                      target="_blank"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Preview Panel - full width on mobile, half on desktop */}
        <div className={`w-full md:w-1/2 bg-white md:border-l overflow-hidden flex flex-col ${
          mobileView === "preview" ? "block" : "hidden md:flex"
        }`}>
          <div className="hidden md:flex px-4 py-2 bg-gray-100 border-b items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Live Preview</span>
            <button
              onClick={updatePreview}
              className="p-1 hover:bg-gray-200 rounded"
              title="Refresh Preview"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div
            className={`flex-1 overflow-y-auto ${
              previewMode === "mobile" ? "max-w-[375px] mx-auto border-x" : ""
            }`}
          >
            <div key={previewKey} className="p-4 sm:p-6">
              {/* Preview Header */}
              {heroImage && (
                <div className="aspect-video mb-6 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={resolveImageUrl(heroImage)}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Preview Category */}
              <div className="mb-4">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                  {category}
                </span>
              </div>

              {/* Preview Title */}
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                {title || "Article Title"}
              </h1>

              {/* Preview Excerpt */}
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 border-l-4 border-emerald-500 pl-3 sm:pl-4 italic">
                {excerpt || "Article excerpt will appear here..."}
              </p>

              {/* Preview Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Preview Content */}
              <div className="prose prose-emerald max-w-none">
                {editorMode === "blocks" && contentBlocks.length > 0 ? (
                  <div className="space-y-4">
                    {contentBlocks.map((block) => {
                      switch (block.type) {
                        case "heading":
                          const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
                          return (
                            <HeadingTag key={block.id} className="font-bold text-gray-900">
                              {block.content}
                            </HeadingTag>
                          );
                        case "text":
                          return (
                            <div
                              key={block.id}
                              dangerouslySetInnerHTML={{
                                __html: renderMarkdown(block.content || ""),
                              }}
                            />
                          );
                        case "image":
                        case "infographic":
                          const sizeClasses = {
                            small: "max-w-xs",
                            medium: "max-w-md",
                            large: "max-w-2xl",
                            full: "w-full",
                          };
                          const alignClasses = {
                            left: "mr-auto",
                            center: "mx-auto",
                            right: "ml-auto",
                          };
                          return (
                            <figure
                              key={block.id}
                              className={`${sizeClasses[block.size || "full"]} ${alignClasses[block.alignment || "center"]}`}
                            >
                              {block.image_url ? (
                                <div className="relative">
                                  <img
                                    src={resolveImageUrl(block.image_url)}
                                    alt={block.alt_text || ""}
                                    className="rounded-lg shadow-md w-full"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.classList.remove("hidden");
                                    }}
                                  />
                                  <div className="hidden bg-gray-100 rounded-lg p-8 text-center text-gray-400">
                                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">Image not found</p>
                                    <p className="text-xs mt-1 opacity-60">{block.image_url?.split("/").pop()}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-400">
                                  <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                  <p>No image selected</p>
                                </div>
                              )}
                              {block.caption && (
                                <figcaption className="text-sm text-gray-500 mt-2 text-center italic">
                                  {block.caption}
                                </figcaption>
                              )}
                            </figure>
                          );
                        case "quote":
                          return (
                            <blockquote
                              key={block.id}
                              className="border-l-4 border-emerald-500 pl-4 italic text-gray-700"
                            >
                              {block.content}
                            </blockquote>
                          );
                        case "callout":
                          return (
                            <div
                              key={block.id}
                              className="bg-emerald-50 border border-emerald-200 rounded-lg p-4"
                            >
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: renderMarkdown(block.content || ""),
                                }}
                              />
                            </div>
                          );
                        case "gallery":
                          // Render gallery as horizontal images with equal heights
                          const galleryImages = block.images || [];
                          if (galleryImages.length === 0) return null;
                          return (
                            <GalleryPreview
                              key={block.id}
                              images={galleryImages}
                              caption={block.caption}
                              resolveImageUrl={resolveImageUrl}
                            />
                          );
                        default:
                          return null;
                      }
                    })}
                  </div>
                ) : content ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(content),
                    }}
                  />
                ) : (
                  <p className="text-gray-400">Start writing to see preview...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Image Picker Modal */}
      {showImagePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">
                  {inlineImageBlockId ? "Select Inline Image" : "Select Hero Image"}
                </h3>
                <span className="text-sm text-gray-500">
                  ({filteredImages.length} images)
                </span>
              </div>
              <button
                onClick={() => setShowImagePicker(false)}
                className="p-1.5 hover:bg-gray-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters Bar */}
            <div className="px-4 py-3 border-b bg-white flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search images..."
                  value={imageSearch}
                  onChange={(e) => setImageSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={imageCategory}
                  onChange={(e) => setImageCategory(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Filters */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors ${
                  showFavoritesOnly
                    ? "bg-yellow-100 border-yellow-300 text-yellow-700"
                    : "hover:bg-gray-50"
                }`}
              >
                <Star className={`w-4 h-4 ${showFavoritesOnly ? "fill-yellow-500" : ""}`} />
                Favorites
              </button>

              <button
                onClick={() => setShowHeroSuitableOnly(!showHeroSuitableOnly)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors ${
                  showHeroSuitableOnly
                    ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                    : "hover:bg-gray-50"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Hero Suitable
              </button>
            </div>

            {/* Upload Drop Zone */}
            <div className="px-4 pt-3">
              <label
                onDragOver={handleUploadDragOver}
                onDragEnter={handleUploadDragEnter}
                onDragLeave={handleUploadDragLeave}
                onDrop={handleUploadDrop}
                className={`relative flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  isDraggingUpload
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                }`}
              >
                {isUploadingImage ? (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Upload className={`w-6 h-6 mb-1 ${isDraggingUpload ? "text-emerald-600" : "text-gray-400"}`} />
                    <p className={`text-sm ${isDraggingUpload ? "text-emerald-600 font-medium" : "text-gray-500"}`}>
                      {isDraggingUpload ? "Drop image here" : "Drop image here or click to upload"}
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploadingImage}
                />
              </label>
            </div>

            {/* Image Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {imagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No images match your filters</p>
                  <button
                    onClick={() => {
                      setImageSearch("");
                      setImageCategory("all");
                      setShowFavoritesOnly(false);
                      setShowHeroSuitableOnly(false);
                    }}
                    className="mt-2 text-emerald-600 hover:underline text-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {filteredImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => selectImage(img)}
                      className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-emerald-500 focus:ring-2 focus:ring-emerald-500 text-left"
                    >
                      <img
                        src={img.public_url.startsWith("/") ? `${API_BASE}${img.public_url}` : img.public_url}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                      />

                      {/* Overlay with info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-sm font-medium truncate">
                            {(img as { original_filename?: string }).original_filename || img.filename}
                          </p>
                          {img.ai_evaluation?.style_tags && (
                            <p className="text-white/70 text-xs truncate mt-0.5">
                              {img.ai_evaluation.style_tags.slice(0, 3).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quality Score Badge */}
                      {img.ai_evaluation?.quality_score && (
                        <div
                          className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium ${getQualityColor(
                            img.ai_evaluation.quality_score
                          )}`}
                        >
                          {img.ai_evaluation.quality_score}%
                        </div>
                      )}

                      {/* Favorite indicator */}
                      {img.is_favorite && (
                        <Star className="absolute top-2 left-2 w-4 h-4 text-yellow-400 fill-yellow-400" />
                      )}

                      {/* Used indicator */}
                      {img.used_in && img.used_in.length > 0 && (
                        <CheckCircle className="absolute top-2 left-8 w-4 h-4 text-blue-400" />
                      )}

                      {/* Hero suitable badge */}
                      {img.ai_evaluation?.is_suitable_for_hero && (
                        <Sparkles className="absolute bottom-2 right-2 w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Click an image to select it as the hero image
              </p>
              <Link
                href="/images"
                className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
              >
                Manage Image Library
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
