"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Type,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Quote,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  Search,
  Star,
  Filter,
  CheckCircle,
} from "lucide-react";

/**
 * Content Block Types for JASPER Article Editor
 * Designed for AI agent manipulation and website rendering
 */
export interface ContentBlock {
  id: string;
  type: "heading" | "text" | "image" | "infographic" | "quote" | "callout";

  // For text/heading blocks
  content?: string;
  level?: 1 | 2 | 3; // For headings

  // For image blocks
  image_id?: string;
  image_url?: string;
  alt_text?: string;
  caption?: string;
  size?: "small" | "medium" | "large" | "full";
  alignment?: "left" | "center" | "right";

  // For infographic blocks (Nano Banana Pro)
  infographic_type?: "comparison" | "timeline" | "flowchart" | "stats";
}

export interface ArticleContent {
  blocks: ContentBlock[];
  version: number;
}

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

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  onOpenImagePicker: (blockId: string) => void;
  images?: ImageEntry[];
  apiBase: string;
}

// Generate unique block IDs
const generateBlockId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function BlockEditor({
  blocks,
  onChange,
  onOpenImagePicker,
  images = [],
  apiBase,
}: BlockEditorProps) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState<number | null>(null);

  // Add a new block at specified position
  const addBlock = (type: ContentBlock["type"], position?: number, level?: number) => {
    const newBlock: ContentBlock = {
      id: generateBlockId(),
      type,
      content: "",
      ...(type === "heading" && { level: (level || 2) as 1 | 2 | 3 }),
      ...(type === "image" && { size: "large" as const, alignment: "center" as const }),
    };

    const newBlocks = [...blocks];
    const insertAt = position !== undefined ? position : blocks.length;
    newBlocks.splice(insertAt, 0, newBlock);
    onChange(newBlocks);
    setShowAddMenu(false);
    setAddMenuPosition(null);
    setActiveBlockId(newBlock.id);
  };

  // Update a block's content
  const updateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    const newBlocks = blocks.map((block) =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    onChange(newBlocks);
  };

  // Delete a block
  const deleteBlock = (blockId: string) => {
    const newBlocks = blocks.filter((block) => block.id !== blockId);
    onChange(newBlocks);
    if (activeBlockId === blockId) {
      setActiveBlockId(null);
    }
  };

  // Move block up
  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    onChange(newBlocks);
  };

  // Move block down
  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    onChange(newBlocks);
  };

  // Resolve image URLs (handle relative paths)
  const resolveImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/")) return `${apiBase}${url}`;
    return url;
  };

  // Render individual block
  const renderBlock = (block: ContentBlock, index: number) => {
    const isActive = activeBlockId === block.id;

    return (
      <div
        key={block.id}
        className={`group relative border rounded-lg transition-all ${
          isActive
            ? "border-emerald-500 ring-2 ring-emerald-100"
            : "border-gray-200 hover:border-gray-300"
        }`}
        onClick={() => setActiveBlockId(block.id)}
      >
        {/* Block Controls */}
        <div
          className={`absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          } transition-opacity`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveBlockUp(index);
            }}
            disabled={index === 0}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Move up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <div className="p-1 text-gray-300 cursor-grab">
            <GripVertical className="w-4 h-4" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              moveBlockDown(index);
            }}
            disabled={index === blocks.length - 1}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Move down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteBlock(block.id);
          }}
          className={`absolute -right-3 -top-3 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          } transition-opacity`}
          title="Delete block"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        {/* Block Content */}
        <div className="p-3">
          {block.type === "heading" && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">H{block.level || 2}</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <button
                      key={level}
                      onClick={() => updateBlock(block.id, { level: level as 1 | 2 | 3 })}
                      className={`px-2 py-0.5 text-xs rounded ${
                        block.level === level
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      H{level}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={block.content || ""}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="Heading text..."
                className={`w-full outline-none font-semibold ${
                  block.level === 1
                    ? "text-2xl"
                    : block.level === 2
                    ? "text-xl"
                    : "text-lg"
                }`}
              />
            </div>
          )}

          {block.type === "text" && (
            <textarea
              value={block.content || ""}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Write your content here... (Markdown supported)"
              rows={4}
              className="w-full outline-none resize-none text-gray-700 font-mono text-sm"
            />
          )}

          {block.type === "quote" && (
            <div className="border-l-4 border-emerald-500 pl-4">
              <textarea
                value={block.content || ""}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="Quote text..."
                rows={2}
                className="w-full outline-none resize-none text-gray-600 italic"
              />
            </div>
          )}

          {(block.type === "image" || block.type === "infographic") && (
            <div>
              {block.image_url ? (
                <div className="space-y-2">
                  <div
                    className={`relative rounded-lg overflow-hidden bg-gray-100 ${
                      block.size === "small"
                        ? "max-w-xs"
                        : block.size === "medium"
                        ? "max-w-md"
                        : block.size === "large"
                        ? "max-w-2xl"
                        : "w-full"
                    } ${
                      block.alignment === "left"
                        ? ""
                        : block.alignment === "right"
                        ? "ml-auto"
                        : "mx-auto"
                    }`}
                  >
                    <img
                      src={resolveImageUrl(block.image_url)}
                      alt={block.alt_text || ""}
                      className="w-full h-auto"
                    />
                    <button
                      onClick={() => onOpenImagePicker(block.id)}
                      className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded hover:bg-black/80"
                    >
                      Change
                    </button>
                  </div>

                  {/* Image Options */}
                  <div className="flex flex-wrap gap-3 text-xs">
                    {/* Size */}
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Size:</span>
                      {(["small", "medium", "large", "full"] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => updateBlock(block.id, { size })}
                          className={`px-2 py-0.5 rounded capitalize ${
                            block.size === size
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>

                    {/* Alignment */}
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Align:</span>
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          key={align}
                          onClick={() => updateBlock(block.id, { alignment: align })}
                          className={`px-2 py-0.5 rounded capitalize ${
                            block.alignment === align
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Caption */}
                  <input
                    type="text"
                    value={block.caption || ""}
                    onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                    placeholder="Add a caption..."
                    className="w-full text-sm text-gray-500 italic outline-none border-b border-transparent focus:border-gray-300"
                  />
                </div>
              ) : (
                <button
                  onClick={() => onOpenImagePicker(block.id)}
                  className="w-full py-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span>Select {block.type === "infographic" ? "Infographic" : "Image"}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add Block Between */}
        <div
          className={`absolute -bottom-4 left-1/2 -translate-x-1/2 z-10 ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          } transition-opacity`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAddMenuPosition(index + 1);
              setShowAddMenu(true);
            }}
            className="p-1 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 shadow-md"
            title="Add block below"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Blocks */}
      <div className="space-y-6 pl-10">
        {blocks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">No content blocks yet</p>
            <button
              onClick={() => {
                setAddMenuPosition(0);
                setShowAddMenu(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              Add First Block
            </button>
          </div>
        ) : (
          blocks.map((block, index) => renderBlock(block, index))
        )}
      </div>

      {/* Add Block Button (at end) */}
      {blocks.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setAddMenuPosition(blocks.length);
              setShowAddMenu(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Block
          </button>
        </div>
      )}

      {/* Add Block Menu Modal */}
      {showAddMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowAddMenu(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-4 w-72"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Add Block</h3>
              <button
                onClick={() => setShowAddMenu(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addBlock("text", addMenuPosition ?? undefined)}
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
              >
                <Type className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Text</span>
              </button>
              <button
                onClick={() => addBlock("heading", addMenuPosition ?? undefined, 2)}
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
              >
                <Heading1 className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Heading</span>
              </button>
              <button
                onClick={() => addBlock("image", addMenuPosition ?? undefined)}
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
              >
                <ImageIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Image</span>
              </button>
              <button
                onClick={() => addBlock("infographic", addMenuPosition ?? undefined)}
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
              >
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-gray-700">Infographic</span>
              </button>
              <button
                onClick={() => addBlock("quote", addMenuPosition ?? undefined)}
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
              >
                <Quote className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Quote</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Convert blocks to markdown for backwards compatibility
 */
export function blocksToMarkdown(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          const hashes = "#".repeat(block.level || 2);
          return `${hashes} ${block.content || ""}`;
        case "text":
          return block.content || "";
        case "quote":
          return `> ${block.content || ""}`;
        case "image":
        case "infographic":
          const alt = block.alt_text || block.caption || "Image";
          return `![${alt}](${block.image_url || ""})${block.caption ? `\n*${block.caption}*` : ""}`;
        default:
          return "";
      }
    })
    .join("\n\n");
}

/**
 * Convert markdown to blocks (basic parser)
 */
export function markdownToBlocks(markdown: string): ContentBlock[] {
  if (!markdown) return [];

  const blocks: ContentBlock[] = [];
  const lines = markdown.split("\n");
  let currentText = "";

  const flushText = () => {
    if (currentText.trim()) {
      blocks.push({
        id: generateBlockId(),
        type: "text",
        content: currentText.trim(),
      });
      currentText = "";
    }
  };

  for (const line of lines) {
    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushText();
      blocks.push({
        id: generateBlockId(),
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        content: headingMatch[2],
      });
      continue;
    }

    // Quote
    if (line.startsWith("> ")) {
      flushText();
      blocks.push({
        id: generateBlockId(),
        type: "quote",
        content: line.substring(2),
      });
      continue;
    }

    // Image
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushText();
      blocks.push({
        id: generateBlockId(),
        type: "image",
        alt_text: imageMatch[1],
        image_url: imageMatch[2],
        size: "large",
        alignment: "center",
      });
      continue;
    }

    // Regular text
    if (line.trim() === "") {
      if (currentText.trim()) {
        flushText();
      }
    } else {
      currentText += (currentText ? "\n" : "") + line;
    }
  }

  flushText();
  return blocks;
}

export default BlockEditor;
