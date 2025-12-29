/**
 * Content Serializers for JASPER Content Hub
 *
 * Converts between:
 * - BlockNote format (editor internal)
 * - JASPER ContentBlock format (API/storage)
 * - Markdown (backwards compatibility)
 * - HTML (Word import)
 */

import { Block, PartialBlock } from "@blocknote/core";
import DOMPurify from "dompurify";

// Gallery image type for multi-image galleries
export interface GalleryImage {
  url: string;
  caption: string;
}

// JASPER ContentBlock type (matches BlockEditor.tsx)
export interface ContentBlock {
  id: string;
  type: "heading" | "text" | "image" | "infographic" | "quote" | "callout" | "table" | "list" | "embed" | "gallery";
  content?: string;
  level?: 1 | 2 | 3;
  image_id?: string;
  image_url?: string;
  alt_text?: string;
  caption?: string;
  size?: "small" | "medium" | "large" | "full";
  alignment?: "left" | "center" | "right";
  infographic_type?: "comparison" | "timeline" | "flowchart" | "stats";
  list_type?: "bullet" | "numbered";
  items?: string[];
  table_data?: string[][];
  // Embed-specific fields
  url?: string;
  embed_url?: string;
  provider?: string;
  provider_type?: "video" | "rich" | "photo" | "link" | "audio";
  thumbnail_url?: string;
  aspect_ratio?: string;
  media_library_id?: string;
  // Gallery-specific fields
  images?: GalleryImage[];
}

// Generate unique block IDs
const generateBlockId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Inline content type for BlockNote rich text
interface InlineContent {
  type: "text" | "link";
  text?: string;
  href?: string;
  content?: InlineContent[];
  styles: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    code?: boolean;
  };
}

/**
 * Parse inline markdown formatting into BlockNote rich text format
 * Handles: **bold**, *italic*, ~~strikethrough~~, `code`, [links](url)
 *
 * Returns content in BlockNote's expected format:
 * - Text: { type: "text", text: string, styles: { bold?: true, italic?: true, ... } }
 * - Link: { type: "link", href: string, content: [{ type: "text", text: string, styles: {} }] }
 */
function parseInlineMarkdown(text: string): any[] {
  if (!text) return [];

  const result: any[] = [];
  let remaining = text;

  // Regex patterns for inline formatting (order matters - check multi-char markers first)
  // Note: Using simple patterns without lookbehind for browser compatibility
  const patterns = [
    // Bold: **text** (must be checked before single asterisk italic)
    { regex: /\*\*([^*]+)\*\*/, style: "bold" },
    // Bold: __text__
    { regex: /__([^_]+)__/, style: "bold" },
    // Strikethrough: ~~text~~
    { regex: /~~([^~]+)~~/, style: "strikethrough" },
    // Inline code: `text`
    { regex: /`([^`]+)`/, style: "code" },
    // Link: [text](url)
    { regex: /\[([^\]]+)\]\(([^)]+)\)/, style: "link" },
    // Italic: *text* (single asterisk, checked after bold)
    { regex: /\*([^*]+)\*/, style: "italic" },
    // Italic: _text_ (single underscore)
    { regex: /_([^_]+)_/, style: "italic" },
  ];

  // Process text, finding and handling inline formatting
  while (remaining.length > 0) {
    let earliestMatch: { index: number; length: number; text: string; style: string; href?: string } | null = null;

    // Find the earliest matching pattern
    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex);
      if (match && match.index !== undefined) {
        if (earliestMatch === null || match.index < earliestMatch.index) {
          earliestMatch = {
            index: match.index,
            length: match[0].length,
            text: match[1],
            style: pattern.style,
            href: pattern.style === "link" ? match[2] : undefined,
          };
        }
      }
    }

    if (earliestMatch) {
      // Add text before the match as unstyled
      if (earliestMatch.index > 0) {
        result.push({
          type: "text",
          text: remaining.slice(0, earliestMatch.index),
          styles: {},
        });
      }

      // Add the styled content in BlockNote's exact format
      if (earliestMatch.style === "link") {
        // Link format: { type: "link", href: string, content: [...] }
        result.push({
          type: "link",
          href: earliestMatch.href,
          content: [{ type: "text", text: earliestMatch.text, styles: {} }],
        });
      } else {
        // Text with styles: { type: "text", text: string, styles: { bold?: true, ... } }
        const styles: Record<string, true> = {};
        if (earliestMatch.style === "bold") styles.bold = true;
        if (earliestMatch.style === "italic") styles.italic = true;
        if (earliestMatch.style === "strikethrough") styles.strike = true; // BlockNote uses "strike" not "strikethrough"
        if (earliestMatch.style === "code") styles.code = true;

        result.push({
          type: "text",
          text: earliestMatch.text,
          styles,
        });
      }

      // Move past the matched content
      remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
    } else {
      // No more patterns found, add remaining text as unstyled
      result.push({
        type: "text",
        text: remaining,
        styles: {},
      });
      break;
    }
  }

  return result;
}

/**
 * Convert inline content array to simple string (for compatibility)
 */
function inlineContentToString(content: InlineContent[]): string {
  return content.map(item => {
    if (item.type === "link" && item.content) {
      return item.content.map(c => c.text || "").join("");
    }
    return item.text || "";
  }).join("");
}

/**
 * Extract text from BlockNote content array, preserving markdown formatting
 * This ensures bold, italic, code, and link formatting are retained
 */
export function extractTextContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item.type === "text") {
          let text = item.text || "";
          // Wrap with markdown syntax based on styles
          if (item.styles) {
            if (item.styles.code) text = `\`${text}\``;
            if (item.styles.bold) text = `**${text}**`;
            if (item.styles.italic) text = `*${text}*`;
            if (item.styles.strike) text = `~~${text}~~`;
          }
          return text;
        }
        if (item.type === "link") {
          const linkText = item.content?.map((c: any) => c.text || "").join("") || "";
          return `[${linkText}](${item.href || ""})`;
        }
        return "";
      })
      .join("");
  }
  return "";
}

/**
 * Normalize image URL to full path
 * Handles: full URLs, relative paths, and bare filenames
 */
function normalizeImageUrl(url: string | undefined, apiBase?: string): string {
  if (!url) return "";
  // Already a full URL
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Relative path starting with /
  if (url.startsWith("/") && apiBase) return `${apiBase}${url}`;
  // Just a filename - resolve through image library API
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) && apiBase) {
    return `${apiBase}/api/v1/images/library/serve/${encodeURIComponent(url)}`;
  }
  // Fallback - return as-is
  return url;
}

/**
 * Convert JASPER ContentBlocks to BlockNote format
 * @param blocks - Array of ContentBlocks
 * @param apiBase - Optional API base URL for normalizing image paths
 */
export function contentBlocksToBlockNote(blocks: ContentBlock[], apiBase?: string): PartialBlock[] {
  if (!blocks || blocks.length === 0) {
    return [];
  }

  const result: PartialBlock[] = [];

  // Helper to create content with proper inline formatting
  // Falls back to plain text if parsing fails
  const createRichContent = (text: string): any => {
    if (!text) return "";
    try {
      const parsed = parseInlineMarkdown(text);
      // If no formatting found or only one plain text segment, return as simple string
      if (parsed.length === 0) return text;
      if (parsed.length === 1 && parsed[0].type === "text" && Object.keys(parsed[0].styles || {}).length === 0) {
        return text;
      }
      // Return rich content array for formatted text
      return parsed;
    } catch (err) {
      // If parsing fails, return as plain text
      console.warn("Failed to parse inline markdown, falling back to plain text:", err);
      return text;
    }
  };

  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        result.push({
          id: block.id,
          type: "heading",
          props: { level: block.level || 2 },
          content: createRichContent(block.content || ""),
        });
        break;

      case "text":
        // Check if content contains list markers
        if (block.content?.startsWith("- ") || block.content?.startsWith("* ")) {
          result.push({
            id: block.id,
            type: "bulletListItem",
            content: createRichContent(block.content.replace(/^[-*]\s+/, "")),
          });
        } else if (block.content?.match(/^\d+\.\s+/)) {
          result.push({
            id: block.id,
            type: "numberedListItem",
            content: createRichContent(block.content.replace(/^\d+\.\s+/, "")),
          });
        } else {
          result.push({
            id: block.id,
            type: "paragraph",
            content: createRichContent(block.content || ""),
          });
        }
        break;

      case "quote":
        // BlockNote doesn't have native quote - use paragraph with formatting
        result.push({
          id: block.id,
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `"${block.content || ""}"`,
              styles: { italic: true },
            },
          ],
        });
        break;

      case "image":
      case "infographic":
        result.push({
          id: block.id,
          type: "image",
          props: {
            url: normalizeImageUrl(block.image_url, apiBase),
            caption: block.caption || block.alt_text || "",
            previewWidth: block.size === "small" ? 300 : block.size === "medium" ? 500 : 800,
          },
        });
        break;

      case "gallery":
        // Convert gallery to BlockNote gallery block
        const galleryImages = (block.images || []).map(img => ({
          url: normalizeImageUrl(img.url, apiBase),
          caption: img.caption || "",
        }));
        result.push({
          id: block.id,
          type: "gallery" as any,
          props: {
            imagesJson: JSON.stringify(galleryImages),
            caption: block.caption || "",
          },
        } as any);
        break;

      case "list":
        // Convert list items to individual list blocks
        const listItems = block.items || [];
        listItems.forEach((item, index) => {
          result.push({
            id: `${block.id}_${index}`,
            type: block.list_type === "numbered" ? "numberedListItem" : "bulletListItem",
            content: createRichContent(item),
          });
        });
        break;

      case "table":
        // Create BlockNote table from table_data
        if (block.table_data && block.table_data.length > 0) {
          // Use any type to work around complex BlockNote table types
          const tableBlock: any = {
            id: block.id,
            type: "table",
            content: {
              type: "tableContent",
              rows: block.table_data.map((row) => ({
                cells: row.map((cell) => [[{ type: "text", text: cell, styles: {} }]]),
              })),
            },
          };
          result.push(tableBlock);
        }
        break;

      case "callout":
        // Will be custom block in Phase 6, for now use paragraph
        result.push({
          id: block.id,
          type: "paragraph",
          content: createRichContent(block.content || ""),
        });
        break;

      case "embed":
        // Cast to any to handle custom embed block type
        result.push({
          id: block.id,
          type: "embed",
          props: {
            url: block.url || "",
            embedUrl: block.embed_url || "",
            provider: block.provider || "",
            providerType: block.provider_type || "video",
            title: block.content || "",
            thumbnailUrl: block.thumbnail_url || "",
            aspectRatio: block.aspect_ratio || "16/9",
          },
        } as any);
        break;

      default:
        result.push({
          id: block.id || generateBlockId(),
          type: "paragraph",
          content: "",
        });
    }
  }

  return result;
}

/**
 * Convert BlockNote blocks to JASPER ContentBlocks
 */
export function blockNoteToContentBlocks(blocks: Block[]): ContentBlock[] {
  if (!blocks || blocks.length === 0) {
    return [];
  }

  const result: ContentBlock[] = [];

  // Debug: log all incoming blocks
  console.log("[Serializer] Converting BlockNote blocks:", blocks.length, "blocks");
  blocks.forEach((b, i) => {
    console.log(`[Serializer] Block ${i}: type=${b.type}, props=`, (b as any).props);
  });

  for (const block of blocks) {
    const id = block.id || generateBlockId();

    // Cast to string to allow custom block types like "embed"
    switch (block.type as string) {
      case "heading":
        const headingProps = block.props as any;
        result.push({
          id,
          type: "heading",
          level: (headingProps?.level || 2) as 1 | 2 | 3,
          content: extractTextContent(block.content),
        });
        break;

      case "paragraph":
        const text = extractTextContent(block.content);
        if (text.trim()) {
          result.push({
            id,
            type: "text",
            content: text,
          });
        }
        break;

      case "bulletListItem":
        result.push({
          id,
          type: "text",
          content: `- ${extractTextContent(block.content)}`,
        });
        break;

      case "numberedListItem":
        result.push({
          id,
          type: "text",
          content: `1. ${extractTextContent(block.content)}`,
        });
        break;

      case "image":
        const imageProps = block.props as any;
        // Debug: log ALL available data for image blocks
        console.log("[Serializer] IMAGE BLOCK FOUND:", {
          id,
          type: block.type,
          props: imageProps,
          fullBlock: JSON.stringify(block, null, 2)
        });
        // BlockNote can store image URL in different places depending on version/source
        const imageUrl = imageProps?.url || imageProps?.src || (block as any).url || "";
        console.log("[Serializer] Extracted imageUrl:", imageUrl);
        // Only add image block if we have a URL
        if (imageUrl) {
          const imageBlock = {
            id,
            type: "image" as const,
            image_url: imageUrl,
            caption: imageProps?.caption || imageProps?.name || "",
            alt_text: imageProps?.caption || imageProps?.alt || imageProps?.name || "Image",
            size: (imageProps?.previewWidth && imageProps.previewWidth < 400 ? "small" :
                  imageProps?.previewWidth && imageProps.previewWidth < 600 ? "medium" : "large") as "small" | "medium" | "large",
            alignment: "center" as const,
          };
          console.log("[Serializer] Creating image ContentBlock:", imageBlock);
          result.push(imageBlock);
        } else {
          // Log for debugging - image block without URL
          console.warn("[Serializer] Image block has no URL - SKIPPING:", { id, props: imageProps, fullBlock: block });
        }
        break;

      case "table":
        const tableContent = block.content as any;
        if (tableContent?.rows) {
          result.push({
            id,
            type: "table",
            table_data: tableContent.rows.map((row: any) =>
              row.cells.map((cell: any) => extractTextContent(cell))
            ),
          });
        }
        break;

      case "codeBlock":
        result.push({
          id,
          type: "text",
          content: "```\n" + extractTextContent(block.content) + "\n```",
        });
        break;

      case "embed":
        const embedProps = block.props as any;
        result.push({
          id,
          type: "embed",
          url: embedProps?.url || "",
          embed_url: embedProps?.embedUrl || "",
          provider: embedProps?.provider || "",
          provider_type: embedProps?.providerType || "video",
          content: embedProps?.title || "",
          thumbnail_url: embedProps?.thumbnailUrl || "",
          aspect_ratio: embedProps?.aspectRatio || "16/9",
        });
        break;

      case "gallery":
        // Convert BlockNote gallery to ContentBlock
        const galleryProps = block.props as any;
        let parsedImages: Array<{ url: string; caption: string }> = [];
        try {
          parsedImages = JSON.parse(galleryProps?.imagesJson || "[]");
        } catch {
          parsedImages = [];
        }
        if (parsedImages.length > 0) {
          result.push({
            id,
            type: "gallery",
            images: parsedImages,
            caption: galleryProps?.caption || "",
          });
        }
        break;

      default:
        const defaultText = extractTextContent(block.content);
        if (defaultText.trim()) {
          result.push({
            id,
            type: "text",
            content: defaultText,
          });
        }
    }
  }

  // Debug: log final result with focus on image blocks
  const imageBlocks = result.filter(b => b.type === "image");
  console.log("[Serializer] FINAL RESULT:", result.length, "ContentBlocks,", imageBlocks.length, "images");
  if (imageBlocks.length > 0) {
    console.log("[Serializer] Image blocks in result:", imageBlocks);
  }

  return result;
}

/**
 * Convert BlockNote blocks to Markdown
 */
export function blockNoteToMarkdown(blocks: Block[]): string {
  if (!blocks || blocks.length === 0) return "";

  const lines: string[] = [];

  for (const block of blocks) {
    // Cast to string to allow custom block types like "embed"
    switch (block.type as string) {
      case "heading":
        const mdHeadingProps = block.props as any;
        const hashes = "#".repeat(mdHeadingProps?.level || 2);
        lines.push(`${hashes} ${extractTextContent(block.content)}`);
        break;

      case "paragraph":
        lines.push(extractTextContent(block.content));
        break;

      case "bulletListItem":
        lines.push(`- ${extractTextContent(block.content)}`);
        break;

      case "numberedListItem":
        lines.push(`1. ${extractTextContent(block.content)}`);
        break;

      case "image":
        const mdImageProps = block.props as any;
        const caption = mdImageProps?.caption || "Image";
        lines.push(`![${caption}](${mdImageProps?.url || ""})`);
        break;

      case "table":
        const tableContent = block.content as any;
        if (tableContent?.rows && tableContent.rows.length > 0) {
          // Header row
          const headerRow = tableContent.rows[0];
          const headerCells = headerRow.cells.map((cell: any) => extractTextContent(cell));
          lines.push(`| ${headerCells.join(" | ")} |`);
          lines.push(`| ${headerCells.map(() => "---").join(" | ")} |`);

          // Data rows
          for (let i = 1; i < tableContent.rows.length; i++) {
            const row = tableContent.rows[i];
            const cells = row.cells.map((cell: any) => extractTextContent(cell));
            lines.push(`| ${cells.join(" | ")} |`);
          }
        }
        break;

      case "codeBlock":
        lines.push("```");
        lines.push(extractTextContent(block.content));
        lines.push("```");
        break;

      case "embed":
        // Embeds fallback to link in markdown
        const mdEmbedProps = block.props as any;
        const embedTitle = mdEmbedProps?.title || mdEmbedProps?.provider || "Embedded content";
        lines.push(`[${embedTitle}](${mdEmbedProps?.url || ""})`);
        break;

      default:
        const text = extractTextContent(block.content);
        if (text.trim()) {
          lines.push(text);
        }
    }
  }

  return lines.join("\n\n");
}

/**
 * Convert Markdown to BlockNote format with proper inline styling
 */
export function markdownToBlockNote(markdown: string): PartialBlock[] {
  if (!markdown) return [];

  const blocks: PartialBlock[] = [];
  const lines = markdown.split("\n");
  let currentParagraph = "";
  let inCodeBlock = false;
  let codeContent = "";
  let inTable = false;
  let tableRows: string[][] = [];

  // Helper to create content with proper inline formatting
  // Falls back to plain text if parsing fails
  const createRichContent = (text: string): any => {
    if (!text) return "";
    try {
      const parsed = parseInlineMarkdown(text);
      // If no formatting found or only one plain text segment, return as simple string
      if (parsed.length === 0) return text;
      if (parsed.length === 1 && parsed[0].type === "text" && Object.keys(parsed[0].styles || {}).length === 0) {
        return text;
      }
      // Return rich content array for formatted text
      return parsed;
    } catch (err) {
      // If parsing fails, return as plain text
      console.warn("Failed to parse inline markdown, falling back to plain text:", err);
      return text;
    }
  };

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      blocks.push({
        id: generateBlockId(),
        type: "paragraph",
        content: createRichContent(currentParagraph.trim()),
      });
      currentParagraph = "";
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      // Convert table to bullet list items for better compatibility
      // BlockNote table blocks can cause rendering crashes with certain content
      // This approach is more robust and still displays the data clearly

      const headers = tableRows[0] || [];
      const dataRows = tableRows.slice(1);

      // If we have headers and data, format as "Header: Value" bullet items
      if (headers.length > 0 && dataRows.length > 0) {
        for (const row of dataRows) {
          const formattedRow = headers
            .map((header, i) => `**${header.trim()}**: ${(row[i] || "").trim()}`)
            .filter(item => item.includes(": ") && !item.endsWith(": "))
            .join(" | ");

          if (formattedRow) {
            blocks.push({
              id: generateBlockId(),
              type: "bulletListItem",
              content: createRichContent(formattedRow),
            });
          }
        }
      } else {
        // Fallback: just output each row as a bullet item
        for (const row of tableRows) {
          const rowText = row.map(cell => cell.trim()).filter(Boolean).join(" | ");
          if (rowText) {
            blocks.push({
              id: generateBlockId(),
              type: "bulletListItem",
              content: createRichContent(rowText),
            });
          }
        }
      }

      tableRows = [];
      inTable = false;
    }
  };

  for (const line of lines) {
    // Code block handling
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        blocks.push({
          id: generateBlockId(),
          type: "codeBlock",
          content: codeContent.trim(),
        });
        codeContent = "";
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? "\n" : "") + line;
      continue;
    }

    // Table row
    if (line.startsWith("|") && line.endsWith("|")) {
      flushParagraph();
      // Skip separator row
      if (line.match(/^\|[\s\-:|]+\|$/)) continue;

      inTable = true;
      const cells = line.split("|").slice(1, -1);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({
        id: generateBlockId(),
        type: "heading",
        props: { level: headingMatch[1].length as 1 | 2 | 3 },
        content: createRichContent(headingMatch[2]),
      });
      continue;
    }

    // Bullet list
    if (line.match(/^[-*]\s+/)) {
      flushParagraph();
      blocks.push({
        id: generateBlockId(),
        type: "bulletListItem",
        content: createRichContent(line.replace(/^[-*]\s+/, "")),
      });
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s+/)) {
      flushParagraph();
      blocks.push({
        id: generateBlockId(),
        type: "numberedListItem",
        content: createRichContent(line.replace(/^\d+\.\s+/, "")),
      });
      continue;
    }

    // Image
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushParagraph();
      blocks.push({
        id: generateBlockId(),
        type: "image",
        props: {
          url: imageMatch[2],
          caption: imageMatch[1],
        },
      });
      continue;
    }

    // Empty line = end of paragraph
    if (line.trim() === "") {
      flushParagraph();
    } else {
      currentParagraph += (currentParagraph ? "\n" : "") + line;
    }
  }

  flushParagraph();
  flushTable();

  return blocks;
}

/**
 * Convert HTML to BlockNote format (for Word import)
 */
export function htmlToBlockNote(html: string): PartialBlock[] {
  if (!html) return [];

  // Sanitize HTML first
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "table", "tr", "td", "th", "tbody", "thead", "img", "a", "strong", "b", "em", "i", "u", "br", "blockquote", "pre", "code"],
    ALLOWED_ATTR: ["src", "alt", "href", "title"],
  });

  // Create a temporary DOM element to parse HTML
  if (typeof window === "undefined") {
    // Server-side: return empty (will be handled client-side)
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHtml, "text/html");
  const blocks: PartialBlock[] = [];

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push({
          id: generateBlockId(),
          type: "paragraph",
          content: text,
        });
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case "h1":
      case "h2":
      case "h3":
        const level = parseInt(tagName[1]) as 1 | 2 | 3;
        blocks.push({
          id: generateBlockId(),
          type: "heading",
          props: { level: Math.min(level, 3) as 1 | 2 | 3 },
          content: element.textContent || "",
        });
        break;

      case "p":
        const pText = element.textContent?.trim();
        if (pText) {
          blocks.push({
            id: generateBlockId(),
            type: "paragraph",
            content: pText,
          });
        }
        break;

      case "ul":
        element.querySelectorAll(":scope > li").forEach((li) => {
          blocks.push({
            id: generateBlockId(),
            type: "bulletListItem",
            content: li.textContent || "",
          });
        });
        break;

      case "ol":
        element.querySelectorAll(":scope > li").forEach((li) => {
          blocks.push({
            id: generateBlockId(),
            type: "numberedListItem",
            content: li.textContent || "",
          });
        });
        break;

      case "table":
        // Create proper BlockNote table block from HTML table
        const htmlTableRows: string[][] = [];
        element.querySelectorAll("tr").forEach((tr) => {
          const cells: string[] = [];
          tr.querySelectorAll("td, th").forEach((cell) => {
            cells.push(cell.textContent || "");
          });
          if (cells.length > 0) {
            htmlTableRows.push(cells);
          }
        });
        if (htmlTableRows.length > 0) {
          const tableBlock: any = {
            id: generateBlockId(),
            type: "table",
            content: {
              type: "tableContent",
              rows: htmlTableRows.map((row) => ({
                cells: row.map((cell) => [[{ type: "text", text: cell, styles: {} }]]),
              })),
            },
          };
          blocks.push(tableBlock);
        }
        break;

      case "img":
        blocks.push({
          id: generateBlockId(),
          type: "image",
          props: {
            url: element.getAttribute("src") || "",
            caption: element.getAttribute("alt") || "",
          },
        });
        break;

      case "blockquote":
        blocks.push({
          id: generateBlockId(),
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `"${element.textContent || ""}"`,
              styles: { italic: true },
            },
          ],
        });
        break;

      case "pre":
      case "code":
        blocks.push({
          id: generateBlockId(),
          type: "codeBlock",
          content: element.textContent || "",
        });
        break;

      default:
        // Process children for container elements
        element.childNodes.forEach(processNode);
    }
  }

  doc.body.childNodes.forEach(processNode);

  return blocks;
}

/**
 * Convert JASPER ContentBlocks to Markdown
 */
export function contentBlocksToMarkdown(blocks: ContentBlock[]): string {
  if (!blocks || blocks.length === 0) return "";

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

        case "list":
          const marker = block.list_type === "numbered" ? "1." : "-";
          return (block.items || []).map((item) => `${marker} ${item}`).join("\n");

        case "table":
          if (!block.table_data || block.table_data.length === 0) return "";
          const header = block.table_data[0];
          const separator = header.map(() => "---");
          const rows = [
            `| ${header.join(" | ")} |`,
            `| ${separator.join(" | ")} |`,
            ...block.table_data.slice(1).map((row) => `| ${row.join(" | ")} |`),
          ];
          return rows.join("\n");

        case "embed":
          const embedTitle = block.content || block.provider || "Embedded content";
          return `[${embedTitle}](${block.url || ""})`;

        default:
          return "";
      }
    })
    .filter((text) => text.trim() !== "")
    .join("\n\n");
}
