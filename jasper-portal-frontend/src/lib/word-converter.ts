/**
 * Word Document Converter for JASPER Content Hub
 *
 * Converts .docx files to BlockNote format using mammoth.js
 * Handles:
 * - Text formatting (bold, italic, underline)
 * - Headings (H1-H3)
 * - Lists (bullet and numbered)
 * - Tables
 * - Images (extracted and uploaded to JASPER library)
 */

import mammoth from "mammoth";
import DOMPurify from "dompurify";
import { htmlToBlockNote, ContentBlock } from "./content-serializers";
import { PartialBlock } from "@blocknote/core";

// Conversion result interface
export interface WordConversionResult {
  blocks: PartialBlock[];
  contentBlocks: ContentBlock[];
  html: string;
  warnings: string[];
  images: ExtractedImage[];
}

// Extracted image interface
export interface ExtractedImage {
  contentType: string;
  base64: string;
  filename: string;
  uploadedUrl?: string;
}

/**
 * Convert Word document to BlockNote blocks
 */
export async function convertWordToBlocks(
  file: File,
  apiBase?: string
): Promise<WordConversionResult> {
  const warnings: string[] = [];
  const images: ExtractedImage[] = [];
  let imageIndex = 0;

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Configure mammoth options
    const options: any = {
      // Convert images to inline base64
      convertImage: mammoth.images.imgElement(async (image) => {
        const imageBuffer = await image.read();
        const base64 = Buffer.from(imageBuffer).toString("base64");
        const contentType = image.contentType || "image/png";
        const filename = `word-image-${++imageIndex}.${contentType.split("/")[1] || "png"}`;

        // Store extracted image for potential upload
        images.push({
          contentType,
          base64,
          filename,
        });

        // Return data URL for immediate display
        return {
          src: `data:${contentType};base64,${base64}`,
          alt: filename,
        };
      }),

      // Style mapping for headings
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
      ],
    };

    // Convert to HTML
    const result = await mammoth.convertToHtml({ arrayBuffer }, options);

    // Collect warnings
    if (result.messages) {
      result.messages.forEach((msg) => {
        if (msg.type === "warning") {
          warnings.push(msg.message);
        }
      });
    }

    // Sanitize HTML
    const cleanHtml = DOMPurify.sanitize(result.value, {
      ALLOWED_TAGS: [
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "table",
        "tr",
        "td",
        "th",
        "tbody",
        "thead",
        "img",
        "a",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "br",
        "blockquote",
        "pre",
        "code",
        "span",
      ],
      ALLOWED_ATTR: ["src", "alt", "href", "title", "class"],
    });

    // Convert HTML to BlockNote blocks
    const blocks = htmlToBlockNote(cleanHtml);

    // Convert to ContentBlocks for storage
    const contentBlocks = blocksToContentBlocks(blocks);

    // Upload images to JASPER library if apiBase provided
    if (apiBase && images.length > 0) {
      await uploadExtractedImages(images, apiBase);
    }

    return {
      blocks,
      contentBlocks,
      html: cleanHtml,
      warnings,
      images,
    };
  } catch (error) {
    console.error("Word conversion error:", error);
    throw new Error(
      `Failed to convert Word document: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Convert PartialBlocks to ContentBlocks (simplified)
 */
function blocksToContentBlocks(blocks: PartialBlock[]): ContentBlock[] {
  const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return blocks.map((block) => {
    const id = (block as any).id || generateId();
    const blockType = block.type || "paragraph";

    switch (blockType) {
      case "heading":
        return {
          id,
          type: "heading" as const,
          level: ((block as any).props?.level || 2) as 1 | 2 | 3,
          content: extractContent(block),
        };

      case "paragraph":
        return {
          id,
          type: "text" as const,
          content: extractContent(block),
        };

      case "bulletListItem":
        return {
          id,
          type: "text" as const,
          content: `- ${extractContent(block)}`,
        };

      case "numberedListItem":
        return {
          id,
          type: "text" as const,
          content: `1. ${extractContent(block)}`,
        };

      case "image":
        return {
          id,
          type: "image" as const,
          image_url: (block as any).props?.url || "",
          caption: (block as any).props?.caption || "",
          alt_text: (block as any).props?.caption || "Image",
        };

      case "table":
        const tableContent = (block as any).content;
        if (tableContent?.rows) {
          return {
            id,
            type: "table" as const,
            table_data: tableContent.rows.map((row: any) =>
              row.cells.map((cell: any) => extractCellContent(cell))
            ),
          };
        }
        return {
          id,
          type: "text" as const,
          content: "",
        };

      default:
        return {
          id,
          type: "text" as const,
          content: extractContent(block),
        };
    }
  });
}

/**
 * Extract text content from block
 */
function extractContent(block: PartialBlock): string {
  const content = (block as any).content;
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item.type === "text") return item.text || "";
        return "";
      })
      .join("");
  }
  return "";
}

/**
 * Extract text from table cell
 */
function extractCellContent(cell: any): string {
  if (!cell) return "";
  if (Array.isArray(cell)) {
    return cell
      .map((innerCell) => {
        if (Array.isArray(innerCell)) {
          return innerCell
            .map((item) => {
              if (typeof item === "string") return item;
              if (item.text) return item.text;
              return "";
            })
            .join("");
        }
        return "";
      })
      .join("");
  }
  return "";
}

/**
 * Upload extracted images to JASPER library
 */
async function uploadExtractedImages(images: ExtractedImage[], apiBase: string): Promise<void> {
  for (const image of images) {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(image.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: image.contentType });

      // Create FormData
      const formData = new FormData();
      formData.append("file", blob, image.filename);
      formData.append("source", "word-import");
      formData.append("category", "imported-images");

      // Upload to JASPER
      const response = await fetch(`${apiBase}/api/v1/images/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        image.uploadedUrl = data.public_url;
      }
    } catch (err) {
      console.error(`Failed to upload image ${image.filename}:`, err);
    }
  }
}

/**
 * Validate Word document file
 */
export function isValidWordDocument(file: File): boolean {
  const validTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  const validExtensions = [".docx", ".doc"];

  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  return hasValidType || hasValidExtension;
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
