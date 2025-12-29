"use client";

/**
 * Gallery Block for BlockNote
 *
 * Custom block that displays 2-3 images side by side.
 * Features:
 * - Horizontal layout with responsive widths (50% for 2, 33% for 3)
 * - "+" button to add more images (up to 3)
 * - Integration with JASPER media library
 */

import React, { useState, useCallback } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import { Plus, X, Image as ImageIcon, Library, Sparkles, Loader2 } from "lucide-react";

// Gallery block props schema
const galleryBlockConfig = {
  type: "gallery" as const,
  content: "none" as const,
  propSchema: {
    images: {
      default: [] as Array<{ url: string; caption: string }>,
    },
  },
};

// Gallery block render component
interface GalleryBlockProps {
  block: {
    id: string;
    type: "gallery";
    props: {
      imagesJson: string;
      caption?: string;
    };
  };
  editor: any;
  contentRef?: React.Ref<HTMLDivElement>;
}

interface GalleryImage {
  url: string;
  caption: string;
}

function GalleryBlockComponent({ block, editor }: GalleryBlockProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCaptionInput, setShowCaptionInput] = useState(false);

  // Track loaded image dimensions for proper sizing
  const [imageDimensions, setImageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Parse images from JSON string
  const images: GalleryImage[] = React.useMemo(() => {
    try {
      const parsed = JSON.parse(block.props.imagesJson || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [block.props.imagesJson]);
  const maxImages = 3;
  const canAddMore = images.length < maxImages;

  // Get API base
  const apiBase =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE || "https://api.jasperfinance.org"
      : "https://api.jasperfinance.org";

  // Calculate image width based on count
  const getImageWidth = () => {
    switch (images.length) {
      case 1:
        return "100%";
      case 2:
        return "calc(50% - 0.5rem)";
      case 3:
        return "calc(33.333% - 0.5rem)";
      default:
        return "100%";
    }
  };

  // Resolve image URL
  const resolveUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return `${apiBase}${url}`;
    return `${apiBase}/api/v1/images/library/serve/${encodeURIComponent(url)}`;
  };

  // Handle image load to capture dimensions
  const handleImageLoad = useCallback((index: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions(prev => {
      const newMap = new Map(prev);
      newMap.set(index, { width: img.naturalWidth, height: img.naturalHeight });
      return newMap;
    });
  }, []);

  // Calculate optimal dimensions so all images fit side-by-side at same height
  // Math: H = (ContainerWidth - Gaps) / sum(aspectRatios)
  // Then each image width = H * its aspectRatio
  const calculatedSizes = React.useMemo(() => {
    if (imageDimensions.size !== images.length || images.length === 0) {
      return null; // Not all images loaded yet
    }

    const gap = 8; // 0.5rem = 8px
    const maxHeight = 250; // Maximum row height
    const containerWidth = containerRef.current?.clientWidth || 600;
    const availableWidth = containerWidth - (images.length - 1) * gap - (canAddMore ? 80 + gap : 0); // Reserve space for Add button

    // Calculate sum of aspect ratios
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

    // Calculate common height that makes all images fit
    let commonHeight = availableWidth / sumAspectRatios;

    // Cap at maxHeight
    if (commonHeight > maxHeight) {
      commonHeight = maxHeight;
    }

    // Calculate individual widths
    const widths = aspectRatios.map(ar => Math.floor(commonHeight * ar));

    return {
      height: Math.floor(commonHeight),
      widths,
    };
  }, [imageDimensions, images.length, canAddMore]);

  // Add image to gallery
  const addImage = useCallback(
    (imageUrl: string, caption: string = "") => {
      if (!canAddMore) return;

      const newImages = [...images, { url: imageUrl, caption }];
      editor.updateBlock(block, {
        props: { imagesJson: JSON.stringify(newImages) },
      });
      setShowImagePicker(false);
    },
    [block, editor, images, canAddMore]
  );

  // Remove image from gallery
  const removeImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);

      if (newImages.length === 0) {
        // If no images left, convert to paragraph
        editor.updateBlock(block, {
          type: "paragraph",
          props: {},
          content: [],
        });
      } else if (newImages.length === 1) {
        // If only one image left, convert to regular image block
        editor.updateBlock(block, {
          type: "image",
          props: {
            url: newImages[0].url,
            caption: newImages[0].caption,
          },
        });
      } else {
        // Update with remaining images as JSON string
        editor.updateBlock(block, {
          props: { imagesJson: JSON.stringify(newImages) },
        });
      }
    },
    [block, editor, images]
  );

  // Extract article title and context for AI analysis
  const getArticleContext = useCallback((): { title: string; context: string } => {
    try {
      const blocks = editor.document || [];
      let title = "";
      let context = "";

      for (const b of blocks) {
        if (b.type === "heading" && b.content) {
          const headingText = b.content
            .map((c: any) => (typeof c === "string" ? c : c.text || ""))
            .join("");
          // First heading is the article title
          if (!title) {
            title = headingText;
          } else {
            context += `## ${headingText}\n`;
          }
        } else if (b.type === "paragraph" && b.content) {
          const paraText = b.content
            .map((c: any) => (typeof c === "string" ? c : c.text || ""))
            .join("");
          if (paraText.trim()) {
            context += paraText + "\n";
          }
        }
      }

      return {
        title: title.trim(),
        context: context.slice(0, 1500)
      };
    } catch {
      return { title: "", context: "" };
    }
  }, [editor]);

  // Analyze images and generate contextual caption
  const analyzeGallery = useCallback(async () => {
    if (images.length === 0 || isAnalyzing) return;

    setIsAnalyzing(true);

    try {
      const { title, context } = getArticleContext();

      // Prepare image data with URLs and names/captions
      const imageData = images.map((img) => {
        // Extract filename from URL or use caption
        let imageName = img.caption || "";
        if (!imageName && img.url) {
          // Try to extract filename from URL
          const urlParts = img.url.split("/");
          imageName = urlParts[urlParts.length - 1] || "";
          // Clean up encoded characters and extensions
          imageName = decodeURIComponent(imageName).replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        }
        return {
          url: resolveUrl(img.url),
          name: imageName,
        };
      });

      // Call the AI analysis endpoint
      const response = await fetch(`${apiBase}/api/v1/images/library/analyze-gallery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: imageData,
          image_urls: imageData.map((d) => d.url),
          image_names: imageData.map((d) => d.name),
          article_title: title,
          article_context: context,
          num_images: images.length,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedCaption = data.caption || data.description || "";

        // Update the gallery with the generated caption
        editor.updateBlock(block, {
          props: {
            imagesJson: block.props.imagesJson,
            caption: generatedCaption,
          },
        });
      } else {
        console.error("Failed to analyze gallery:", response.statusText);
      }
    } catch (err) {
      console.error("Gallery analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [images, isAnalyzing, getArticleContext, apiBase, block, editor]);

  // Update caption manually
  const updateCaption = useCallback(
    (newCaption: string) => {
      editor.updateBlock(block, {
        props: {
          imagesJson: block.props.imagesJson,
          caption: newCaption,
        },
      });
    },
    [block, editor]
  );

  // Empty state
  if (images.length === 0) {
    return (
      <div className="bn-gallery-empty flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-center">
          <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Gallery is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bn-gallery-block relative group my-4">
      {/* Image Row - calculated sizes for perfect fit */}
      <div
        ref={containerRef}
        className="bn-gallery-container flex items-end justify-center gap-2"
        style={{
          width: "100%",
        }}
      >
        {images.map((image, index) => {
          const hasCalculatedSize = calculatedSizes && calculatedSizes.widths[index];
          return (
          <div
            key={index}
            className="bn-gallery-image relative rounded-lg overflow-hidden"
            style={hasCalculatedSize ? {
              width: `${calculatedSizes.widths[index]}px`,
              height: `${calculatedSizes.height}px`,
            } : {
              height: "200px", // Fallback while loading
            }}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <img
              src={resolveUrl(image.url)}
              alt={image.caption || `Gallery image ${index + 1}`}
              className="w-full h-full object-cover"
              onLoad={(e) => handleImageLoad(index, e)}
            />

            {/* Remove button on hover */}
            {hoverIndex === index && (
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                title="Remove from gallery"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          );
        })}

        {/* Add More Button (if less than max) */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => setShowImagePicker(true)}
            className="bn-gallery-add px-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all"
            style={{
              height: calculatedSizes ? `${calculatedSizes.height}px` : "200px",
              minWidth: "70px",
            }}
            title="Add another image"
          >
            <Plus className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-xs text-gray-400">Add</span>
          </button>
        )}
      </div>

      {/* Caption and Controls Row */}
      <div className="mt-2 flex items-center gap-2">
        {/* Caption display/edit */}
        {block.props.caption ? (
          <div className="flex-1">
            {showCaptionInput ? (
              <input
                type="text"
                value={block.props.caption}
                onChange={(e) => updateCaption(e.target.value)}
                onBlur={() => setShowCaptionInput(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setShowCaptionInput(false);
                }}
                className="w-full px-2 py-1 text-sm text-gray-600 italic border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            ) : (
              <p
                onClick={() => setShowCaptionInput(true)}
                className="text-sm text-gray-600 italic cursor-text hover:bg-gray-50 px-2 py-1 rounded"
              >
                {block.props.caption}
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1 text-xs text-gray-400 opacity-60">
            {images.length} of {maxImages}
          </div>
        )}

        {/* Analyze Button */}
        <button
          type="button"
          onClick={analyzeGallery}
          disabled={isAnalyzing || images.length === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            isAnalyzing
              ? "bg-gray-100 text-gray-400 cursor-wait"
              : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-sm hover:shadow"
          }`}
          title="AI-generate caption based on images and article context"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto Caption</span>
            </>
          )}
        </button>
      </div>

      {/* Inline Image Picker Modal */}
      {showImagePicker && (
        <GalleryImagePicker
          apiBase={apiBase}
          onSelect={(url, caption) => addImage(url, caption)}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}

// Mini image picker for gallery
interface GalleryImagePickerProps {
  apiBase: string;
  onSelect: (url: string, caption: string) => void;
  onClose: () => void;
}

function GalleryImagePicker({
  apiBase,
  onSelect,
  onClose,
}: GalleryImagePickerProps) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch images
  React.useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`${apiBase}/api/v1/images/library`);
        if (response.ok) {
          const data = await response.json();
          setImages(data.images || []);
        }
      } catch (err) {
        console.error("Failed to fetch images:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [apiBase]);

  // Filter images
  const filteredImages = images.filter((img) =>
    searchQuery
      ? img.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.category?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  // Resolve URL
  const resolveUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return `${apiBase}${url}`;
    return `${apiBase}/api/v1/images/library/serve/${encodeURIComponent(url)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[400px] max-h-[500px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Library className="w-4 h-4 text-emerald-600" />
            Add to Gallery
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <ImageIcon className="w-8 h-8 mb-2" />
              <p className="text-sm">No images found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredImages.slice(0, 30).map((image) => (
                <button
                  key={image.id}
                  onClick={() =>
                    onSelect(resolveUrl(image.public_url), image.filename || "")
                  }
                  className="aspect-square rounded overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all"
                >
                  <img
                    src={resolveUrl(image.public_url)}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Create the block spec
// Note: We store images as a JSON string because BlockNote's PropSchema
// doesn't support complex nested types like arrays of objects
export const GalleryBlock = createReactBlockSpec(
  {
    type: "gallery",
    content: "none",
    propSchema: {
      // Store images as JSON string
      imagesJson: {
        default: "[]",
      },
      // AI-generated or manual caption for the gallery
      caption: {
        default: "",
      },
    },
  },
  {
    render: GalleryBlockComponent,
  }
);

export default GalleryBlock;
