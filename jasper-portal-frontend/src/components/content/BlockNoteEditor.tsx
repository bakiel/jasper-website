"use client";

/**
 * BlockNote Editor for JASPER Content Hub
 *
 * Production-ready Notion-style WYSIWYG editor featuring:
 * - Side menu (+) for adding blocks (images, lists, tables, etc.)
 * - Formatting toolbar on text selection (bold, italic, links, etc.)
 * - Slash commands (/) for quick block insertion
 * - Drag and drop block reordering
 * - Image upload to JASPER library with Media Library integration
 * - Word document import
 * - Multi-image gallery support (2-3 images side by side)
 *
 * @version 2.1.0
 * @date December 2025
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { PartialBlock, Block, BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import {
  useCreateBlockNote,
  useComponentsContext,
  FilePanelController,
} from "@blocknote/react";
import { CustomFilePanel } from "./CustomFilePanel";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import {
  FileText,
  Upload,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Undo2,
  Redo2,
  Library,
  Plus,
  Grid2X2,
  Grid3X3,
  Sparkles,
} from "lucide-react";
import {
  ContentBlock,
  contentBlocksToBlockNote,
  blockNoteToContentBlocks,
  blockNoteToMarkdown,
  markdownToBlockNote,
} from "@/lib/content-serializers";
import { ImagePicker } from "./ImagePickerBlock";
import { WordImporter } from "./WordImporter";
import { GalleryBlock } from "./GalleryBlock";

// ============================================================================
// Types
// ============================================================================

interface BlockNoteEditorProps {
  /** Markdown content (legacy support) */
  initialContent?: string;
  /** Structured block content */
  initialBlocks?: ContentBlock[];
  /** Called when content changes */
  onChange?: (markdown: string, blocks: ContentBlock[]) => void;
  /** API base URL for image uploads */
  apiBase: string;
  /** Placeholder text */
  placeholder?: string;
  /** Enable/disable editing */
  editable?: boolean;
}

interface ImageUploadResponse {
  id: string;
  public_url: string;
  filename: string;
}

// ============================================================================
// Block Validation
// ============================================================================

/**
 * Validate and sanitize blocks before passing to BlockNote
 * Returns only valid blocks, filtering out malformed ones
 */
function validateBlocks(blocks: PartialBlock[] | undefined): PartialBlock[] | undefined {
  if (!blocks || !Array.isArray(blocks)) {
    console.log("[BlockNote] No blocks to validate");
    return undefined;
  }

  const validBlocks = blocks.filter((block, index) => {
    // Must be an object
    if (!block || typeof block !== "object") {
      console.warn(`[BlockNote] Block ${index} is not an object, skipping`);
      return false;
    }

    // Type must be a string (we allow custom types)
    const blockType = (block as any).type;
    if (blockType !== undefined && typeof blockType !== "string") {
      console.warn(`[BlockNote] Block ${index} has invalid type, skipping`);
      return false;
    }

    return true;
  });

  console.log(`[BlockNote] Validated ${validBlocks.length}/${blocks.length} blocks`);

  return validBlocks.length > 0 ? validBlocks : undefined;
}

// ============================================================================
// Component
// ============================================================================

export function BlockNoteEditorComponent({
  initialContent,
  initialBlocks,
  onChange,
  apiBase,
  placeholder = "Start typing or press '/' for commands...",
  editable = true,
}: BlockNoteEditorProps) {
  // State
  const [error, setError] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showWordImporter, setShowWordImporter] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  // Track which image block we're adding an inline image after (for gallery creation)
  const [insertAfterBlockId, setInsertAfterBlockId] = useState<string | null>(null);

  // Track the mode: "new" for new image, "gallery" for adding to existing
  const [imagePickerMode, setImagePickerMode] = useState<"new" | "gallery">("new");

  // Track selected image block for showing the "+" button
  const [selectedImageBlockId, setSelectedImageBlockId] = useState<string | null>(null);
  const [imageButtonPosition, setImageButtonPosition] = useState<{ top: number; right: number } | null>(null);

  // Track if we're analyzing an image for auto-caption
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  // Ref for the editor container
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Debug logging
  console.log("[BlockNote] Component mounting with:", {
    hasInitialContent: !!initialContent,
    contentLength: initialContent?.length || 0,
    hasInitialBlocks: !!initialBlocks,
    blocksLength: initialBlocks?.length || 0,
  });

  // Convert initial content to BlockNote format
  // Using typeof window check instead of useState to avoid race condition
  const initialBlockNoteContent = useMemo((): PartialBlock[] | undefined => {
    // SSR check - synchronous, no state dependency
    if (typeof window === "undefined") {
      console.log("[BlockNote] SSR detected, returning undefined");
      return undefined;
    }

    try {
      // Priority 1: Use structured blocks if available
      if (initialBlocks && initialBlocks.length > 0) {
        console.log("[BlockNote] Converting initialBlocks:", initialBlocks.length, "blocks");
        const blocks = contentBlocksToBlockNote(initialBlocks, apiBase);
        console.log("[BlockNote] Converted to BlockNote blocks:", blocks?.length || 0);
        const validatedBlocks = validateBlocks(blocks as PartialBlock[]);
        if (validatedBlocks) {
          console.log("[BlockNote] Using validated blocks from initialBlocks");
          return validatedBlocks;
        }
      }

      // Priority 2: Convert markdown content
      if (initialContent && initialContent.trim()) {
        console.log("[BlockNote] Converting markdown content:", initialContent.length, "chars");
        const blocks = markdownToBlockNote(initialContent);
        console.log("[BlockNote] Converted markdown to blocks:", blocks?.length || 0);
        const validatedBlocks = validateBlocks(blocks as PartialBlock[]);
        if (validatedBlocks) {
          console.log("[BlockNote] Using validated blocks from markdown");
          return validatedBlocks;
        }
      }

      console.log("[BlockNote] No content to convert, using empty editor");
    } catch (err) {
      console.error("[BlockNote] Error converting initial content:", err);
      setError(`Failed to load content: ${err instanceof Error ? err.message : String(err)}`);
    }

    return undefined;
  }, [initialBlocks, initialContent, apiBase]);

  // Image upload handler
  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      setIsUploading(true);

      try {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files are allowed");
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("Image must be less than 10MB");
        }

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

        const data: ImageUploadResponse = await response.json();

        // Normalize URL - handle all formats consistently
        let imageUrl: string;
        if (data.public_url.startsWith("http://") || data.public_url.startsWith("https://")) {
          imageUrl = data.public_url;
        } else if (data.public_url.startsWith("/")) {
          imageUrl = `${apiBase}${data.public_url}`;
        } else {
          // Just a filename - use serve endpoint
          imageUrl = `${apiBase}/api/v1/images/library/serve/${encodeURIComponent(data.public_url)}`;
        }

        console.log("[BlockNote] Upload successful, URL:", imageUrl);
        return imageUrl;
      } catch (err) {
        console.error("[BlockNote] Image upload failed:", err);
        // Fallback to local object URL
        return URL.createObjectURL(file);
      } finally {
        setIsUploading(false);
      }
    },
    [apiBase]
  );

  // Create custom schema with gallery block
  // GalleryBlock is a factory function that returns the block spec
  const schema = useMemo(
    () =>
      BlockNoteSchema.create({
        blockSpecs: {
          ...defaultBlockSpecs,
          gallery: GalleryBlock(),
        },
      }),
    []
  );

  // Create BlockNote editor instance
  const editor = useCreateBlockNote({
    schema,
    initialContent: initialBlockNoteContent,
    uploadFile,
  });


  // Handle content changes with debouncing
  const handleChange = useCallback(() => {
    if (!editor || !onChange) return;

    try {
      const blocks = editor.document;
      const markdown = blockNoteToMarkdown(blocks as any);
      const contentBlocks = blockNoteToContentBlocks(blocks as any);
      onChange(markdown, contentBlocks);
    } catch (err) {
      console.error("[BlockNote] Error converting content:", err);
    }
  }, [editor, onChange]);

  // Helper to normalize image URLs
  const normalizeImageUrl = useCallback(
    (url: string): string => {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      } else if (url.startsWith("/")) {
        return `${apiBase}${url}`;
      } else {
        return `${apiBase}/api/v1/images/library/serve/${encodeURIComponent(url)}`;
      }
    },
    [apiBase]
  );

  // Handle image selection from JASPER library
  const handleImageSelect = useCallback(
    (image: { id: string; public_url: string; filename: string }) => {
      if (!editor) return;

      const imageUrl = normalizeImageUrl(image.public_url);

      // If we're in gallery mode (adding to existing image), convert to gallery
      if (imagePickerMode === "gallery" && insertAfterBlockId) {
        const targetBlock = editor.document.find((b: any) => b.id === insertAfterBlockId);
        if (targetBlock) {
          // Check if target is already a gallery
          if ((targetBlock as any).type === "gallery") {
            // Add to existing gallery
            let currentImages: Array<{ url: string; caption: string }> = [];
            try {
              currentImages = JSON.parse((targetBlock as any).props?.imagesJson || "[]");
            } catch {
              currentImages = [];
            }
            if (currentImages.length < 3) {
              const newImages = [...currentImages, { url: imageUrl, caption: image.filename }];
              editor.updateBlock(targetBlock, {
                props: {
                  imagesJson: JSON.stringify(newImages),
                },
              });
            }
          } else if ((targetBlock as any).type === "image") {
            // Convert image block to gallery with both images
            const existingUrl = (targetBlock as any).props?.url || "";
            const existingCaption = (targetBlock as any).props?.caption || "";

            const galleryImages = [
              { url: existingUrl, caption: existingCaption },
              { url: imageUrl, caption: image.filename },
            ];

            editor.updateBlock(targetBlock, {
              type: "gallery",
              props: {
                imagesJson: JSON.stringify(galleryImages),
              },
            });
          }
        }
      } else {
        // Normal mode: insert at cursor position
        const currentBlock = editor.getTextCursorPosition().block;
        editor.insertBlocks(
          [
            {
              type: "image",
              props: {
                url: imageUrl,
                caption: image.filename,
              },
            },
          ],
          currentBlock,
          "after"
        );
      }

      // Reset state
      setShowImagePicker(false);
      setInsertAfterBlockId(null);
      setImagePickerMode("new");
      setSelectedImageBlockId(null);
      setImageButtonPosition(null);

      // Trigger change after insertion
      setTimeout(handleChange, 100);
    },
    [editor, normalizeImageUrl, imagePickerMode, insertAfterBlockId, handleChange]
  );

  // Open Media Library in gallery mode (to add image after existing one)
  const openGalleryPicker = useCallback((blockId: string) => {
    setInsertAfterBlockId(blockId);
    setImagePickerMode("gallery");
    setShowImagePicker(true);
  }, []);

  // Open Media Library in normal mode
  const openMediaLibrary = useCallback(() => {
    setInsertAfterBlockId(null);
    setImagePickerMode("new");
    setShowImagePicker(true);
  }, []);

  // Close image picker and reset all related state
  const closeImagePicker = useCallback(() => {
    setShowImagePicker(false);
    setInsertAfterBlockId(null);
    setImagePickerMode("new");
  }, []);

  // Effect to detect clicks on image blocks and show the "+" button
  // BlockNote uses: .bn-block-outer[data-id] > .bn-block[data-id] > .bn-block-content[data-content-type]
  const handleImageBlockClick = useCallback(
    (e: MouseEvent) => {
      if (!editorContainerRef.current || !editor) return;

      const target = e.target as HTMLElement;

      // Method 1: Check if clicked on an img element directly
      const imgElement = target.tagName === 'IMG' ? target : target.querySelector('img');

      // Method 2: Check if clicked inside an image block content area
      const imageContent = target.closest('[data-content-type="image"]');

      // Method 3: Check for BlockNote's image wrapper class
      const imageWrapper = target.closest('.bn-image-block-content-wrapper') ||
                          target.closest('[class*="bn-image"]');

      // If we found an image element or image block content
      const isImageBlock = imgElement || imageContent || imageWrapper;

      if (isImageBlock) {
        // Find the block container with data-id (BlockNote structure)
        // Look for .bn-block-outer or .bn-block with data-id attribute
        const blockElement = target.closest('.bn-block-outer[data-id]') ||
                            target.closest('.bn-block[data-id]') ||
                            target.closest('[data-node-type="blockOuter"][data-id]') ||
                            target.closest('[data-node-type="blockContainer"][data-id]');

        if (blockElement) {
          const blockId = blockElement.getAttribute('data-id');

          if (blockId) {
            // Verify this is actually an image block by checking the editor
            const block = editor.document.find((b: any) => b.id === blockId);

            // Only show button for image blocks (not galleries, which have their own "+ Add Image")
            if (block && (block as any).type === 'image') {
              // Get position for the "+" button - position it at bottom right of the image
              const targetRect = (imgElement || imageContent || imageWrapper || target).getBoundingClientRect();
              const containerRect = editorContainerRef.current.getBoundingClientRect();

              setSelectedImageBlockId(blockId);
              setImageButtonPosition({
                top: targetRect.bottom - containerRect.top - 44,
                right: containerRect.right - targetRect.right + 8,
              });

              console.log('[BlockNote] Image block selected:', blockId);
              return;
            }
          }
        }
      }

      // Click was not on an image - but don't clear if clicking on our buttons
      const clickedOnButton = target.closest('.gallery-add-button');
      if (!clickedOnButton && selectedImageBlockId) {
        console.log('[BlockNote] Clearing image selection');
        setSelectedImageBlockId(null);
        setImageButtonPosition(null);
      }
    },
    [editor, selectedImageBlockId]
  );

  // Add click listener for image detection
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    container.addEventListener('click', handleImageBlockClick as any);

    return () => {
      container.removeEventListener('click', handleImageBlockClick as any);
    };
  }, [handleImageBlockClick]);

  // Handle Word document import
  const handleWordImport = useCallback(
    (blocks: PartialBlock[]) => {
      if (!editor) return;

      // Replace all content with imported blocks
      editor.replaceBlocks(editor.document, blocks);

      // Trigger change after import
      setTimeout(handleChange, 100);
    },
    [editor, handleChange]
  );

  // Auto-caption a single image using AI
  const handleAutoCaption = useCallback(
    async (blockId: string) => {
      if (!editor || isAnalyzingImage) return;

      const block = editor.document.find((b: any) => b.id === blockId);
      if (!block || (block as any).type !== "image") return;

      const imageUrl = (block as any).props?.url || "";
      if (!imageUrl) return;

      setIsAnalyzingImage(true);

      try {
        // Get article title from first heading
        let articleTitle = "";
        for (const b of editor.document) {
          if ((b as any).type === "heading" && (b as any).content) {
            const content = (b as any).content;
            articleTitle = content
              .map((c: any) => (typeof c === "string" ? c : c.text || ""))
              .join("");
            break;
          }
        }

        // Extract filename for context
        const urlParts = imageUrl.split("/");
        let imageName = urlParts[urlParts.length - 1] || "";
        imageName = decodeURIComponent(imageName).replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");

        // Call the AI analysis endpoint
        const response = await fetch(`${apiBase}/api/v1/images/library/analyze-gallery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: [{ url: imageUrl, name: imageName }],
            image_urls: [imageUrl],
            image_names: [imageName],
            article_title: articleTitle,
            num_images: 1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const caption = data.caption || "";
          const altText = data.alt_text || caption || imageName;

          // Update the image block with caption and alt (custom prop for SEO)
          editor.updateBlock(block, {
            type: "image",
            props: {
              ...(block as any).props,
              caption: caption,
              alt: altText, // Custom prop - serializer will pick this up for alt_text
            },
          });

          console.log("[BlockNote] Image auto-captioned:", { caption, altText });

          // Trigger change to sync with parent (contentBlocks)
          setTimeout(handleChange, 100);
        }
      } catch (err) {
        console.error("[BlockNote] Auto-caption failed:", err);
      } finally {
        setIsAnalyzingImage(false);
      }
    },
    [editor, apiBase, isAnalyzingImage, handleChange]
  );

  // Reset error state
  const handleRetry = useCallback(() => {
    setError(null);
    window.location.reload();
  }, []);

  // ============================================================================
  // Render States
  // ============================================================================

  // Note: SSR loading state is now handled by parent component (conditional render)
  // The parent only mounts this component after content is loaded

  // Error state
  if (error) {
    return (
      <div className="border border-red-200 rounded-lg p-6 bg-red-50">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">Editor Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="blocknote-editor-wrapper">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-t-lg">
        {/* Undo Button */}
        <button
          type="button"
          onClick={() => editor?.undo()}
          disabled={!editable}
          className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo Button */}
        <button
          type="button"
          onClick={() => editor?.redo()}
          disabled={!editable}
          className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300" />

        {/* Image Library Button - Primary way to add images */}
        <button
          type="button"
          onClick={openMediaLibrary}
          disabled={!editable}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Insert image from JASPER media library (with AI analysis)"
        >
          <Library className="w-4 h-4" />
          <span className="hidden sm:inline">Media Library</span>
        </button>

        <div className="w-px h-5 bg-gray-300" />

        {/* Word Import Button */}
        <button
          type="button"
          onClick={() => setShowWordImporter(true)}
          disabled={!editable}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Import from Word document"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Import .docx</span>
        </button>

        <div className="flex-1" />

        {/* Upload indicator */}
        {isUploading && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Uploading...
          </span>
        )}

        {/* Editor label */}
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <FileText className="w-3 h-3" />
          <span className="hidden sm:inline">BlockNote Editor</span>
        </span>
      </div>

      {/* Editor */}
      <div
        ref={editorContainerRef}
        className="border border-gray-200 border-t-0 rounded-b-lg bg-white overflow-hidden relative"
        style={{ minHeight: "400px" }}
      >
        <BlockNoteView
          editor={editor}
          editable={editable}
          onChange={handleChange}
          theme="light"
          filePanel={false}
        >
          {/* Custom file panel with Library/Upload/URL tabs */}
          <FilePanelController filePanel={CustomFilePanel} />
        </BlockNoteView>

        {/* Floating buttons for image actions */}
        {selectedImageBlockId && imageButtonPosition && editable && (
          <div
            className="gallery-add-button absolute z-50 flex gap-1 animate-fade-in"
            style={{
              top: imageButtonPosition.top,
              right: imageButtonPosition.right,
            }}
          >
            {/* Auto Caption button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleAutoCaption(selectedImageBlockId);
              }}
              disabled={isAnalyzingImage}
              className={`gallery-add-button flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg shadow-lg transition-all border ${
                isAnalyzingImage
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-wait"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-400 hover:from-purple-600 hover:to-indigo-600"
              }`}
              title="AI-generate caption and alt text for SEO"
            >
              {isAnalyzingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isAnalyzingImage ? "..." : "Caption"}</span>
            </button>

            {/* Add to Gallery button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('[BlockNote] Add Image clicked for block:', selectedImageBlockId);
                openGalleryPicker(selectedImageBlockId);
              }}
              className="gallery-add-button flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg shadow-lg hover:bg-emerald-700 transition-all border border-emerald-500"
              title="Add another image to create a gallery (2-3 images side by side)"
            >
              <Grid2X2 className="w-4 h-4" />
              <span>+ Gallery</span>
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-2 px-1 text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">/</kbd>
          {" "}commands
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">+</kbd>
          {" "}add block
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Ctrl+Z</kbd>
          {" "}undo
        </span>
        <span>Drag to reorder</span>
      </div>

      {/* Keyboard Shortcuts Reference (collapsed by default) */}
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-gray-400 hover:text-gray-600">
          Keyboard shortcuts
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-2 text-gray-600">
          <div><kbd className="font-mono bg-white px-1 rounded border">Ctrl+B</kbd> Bold</div>
          <div><kbd className="font-mono bg-white px-1 rounded border">Ctrl+I</kbd> Italic</div>
          <div><kbd className="font-mono bg-white px-1 rounded border">Ctrl+U</kbd> Underline</div>
          <div><kbd className="font-mono bg-white px-1 rounded border">Ctrl+K</kbd> Link</div>
          <div><kbd className="font-mono bg-white px-1 rounded border">Ctrl+Z</kbd> Undo</div>
          <div><kbd className="font-mono bg-white px-1 rounded border">Ctrl+Y</kbd> Redo</div>
        </div>
      </details>

      {/* Image Picker Modal */}
      <ImagePicker
        isOpen={showImagePicker}
        onClose={closeImagePicker}
        onSelect={handleImageSelect}
        apiBase={apiBase}
      />

      {/* Word Importer Modal */}
      <WordImporter
        isOpen={showWordImporter}
        onClose={() => setShowWordImporter(false)}
        onImport={handleWordImport}
        apiBase={apiBase}
      />
    </div>
  );
}

// Named exports
export { BlockNoteEditorComponent as BlockNoteEditor };
export default BlockNoteEditorComponent;
