"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

interface Article {
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
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
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [heroImage, setHeroImage] = useState("");
  const [heroImageId, setHeroImageId] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (slug && slug !== "new") {
      fetchArticle();
    } else {
      setLoading(false);
    }
  }, [slug]);

  // Filter images when search/filters change
  useEffect(() => {
    let filtered = [...images];

    // Search filter
    if (imageSearch) {
      const search = imageSearch.toLowerCase();
      filtered = filtered.filter(
        (img) =>
          img.filename.toLowerCase().includes(search) ||
          img.original_filename.toLowerCase().includes(search) ||
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

  const fetchArticle = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/blog/posts/${slug}`);
      if (!res.ok) throw new Error("Article not found");
      const data = await res.json();
      setArticle(data);
      setTitle(data.title || "");
      setContent(data.content || "");
      setExcerpt(data.excerpt || "");
      setCategory(data.category || "DFI Insights");
      setSeoTitle(data.seoTitle || "");
      setSeoDescription(data.seoDescription || "");
      setTags(data.tags || []);
      setHeroImage(data.heroImage || "");
      setHeroImageId(data.heroImageId || null);
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

  const saveArticle = async () => {
    setSaving(true);
    try {
      const endpoint =
        slug === "new"
          ? `${API_BASE}/api/v1/blog/admin/posts`
          : `${API_BASE}/api/v1/blog/admin/posts/${slug}`;

      const method = slug === "new" ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          category,
          seoTitle: seoTitle || title.slice(0, 60),
          seoDescription: seoDescription || excerpt.slice(0, 160),
          tags,
          heroImage,
          heroImageId,
          status: article?.status || "draft",
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
    setHeroImage(img.public_url);
    setHeroImageId(img.id);
    setShowImagePicker(false);

    // Mark image as used in this article
    if (slug && slug !== "new") {
      await markImageAsUsed(img.id, slug);
    }
  };

  const openImagePicker = () => {
    fetchImages();
    setImageSearch("");
    setImageCategory("all");
    setShowFavoritesOnly(false);
    setShowHeroSuitableOnly(true);
    setShowImagePicker(true);
  };

  const resolveImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/")) return `${API_BASE}${url}`;
    return url;
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
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/content" className="p-2 hover:bg-gray-100 rounded">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">
                {slug === "new" ? "New Article" : "Edit Article"}
              </h1>
              <p className="text-sm text-gray-500">{article?.status || "draft"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Preview Mode Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
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

            {/* SEO Score Badge */}
            {article?.seoScore !== undefined && (
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  article.seoScore >= 70
                    ? "bg-green-100 text-green-700"
                    : article.seoScore >= 50
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                SEO: {article.seoScore}%
              </div>
            )}

            <button
              onClick={saveArticle}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>

            {slug !== "new" && (
              <a
                href={`https://jasperfinance.org/insights/${slug}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4" />
                View Live
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Split Pane */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Editor Panel */}
        <div className="w-1/2 overflow-y-auto p-6 space-y-6">
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
                    onClick={openImagePicker}
                    className="absolute bottom-2 right-2 flex items-center gap-2 px-3 py-1.5 bg-black/60 text-white text-sm rounded hover:bg-black/80"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Change Image
                  </button>
                </div>
              ) : (
                <button
                  onClick={openImagePicker}
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

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article content here... (Markdown supported)"
              rows={20}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
            />
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-2 gap-4">
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

        {/* Preview Panel */}
        <div className="w-1/2 bg-white border-l overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-gray-100 border-b flex items-center justify-between">
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
            <div key={previewKey} className="p-6">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {title || "Article Title"}
              </h1>

              {/* Preview Excerpt */}
              <p className="text-lg text-gray-600 mb-6 border-l-4 border-emerald-500 pl-4 italic">
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
                {content ? (
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
                <h3 className="font-semibold text-gray-900">Select Hero Image</h3>
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
                        src={img.public_url}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                      />

                      {/* Overlay with info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-sm font-medium truncate">
                            {img.original_filename || img.filename}
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
