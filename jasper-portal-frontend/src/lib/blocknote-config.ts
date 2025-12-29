/**
 * BlockNote Editor Configuration
 *
 * JASPER Content Hub - Notion-style block editor
 * Uses JASPER brand colors and typography
 */

import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from "@blocknote/core";
import { CalloutBlock, StatsBlock, DividerBlock } from "@/components/content/CustomBlocks";
import { EmbedBlock } from "@/components/content/EmbedBlock";

// JASPER Brand Colors
export const jasperColors = {
  // Primary
  navy: "#0F2A3C",
  emerald: "#2C8A5B",
  emeraldDark: "#1E6B45",

  // Secondary
  carbon: "#1A1A2E",
  graphite: "#2D3748",
  slate: "#64748B",
  slateLight: "#94A3B8",

  // Surfaces
  white: "#FFFFFF",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",

  // Status
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

// JASPER Typography
export const jasperFonts = {
  heading: "'Century Gothic', 'Poppins', sans-serif",
  body: "'Inter', 'Century Gothic', sans-serif",
  mono: "'Fira Code', 'Consolas', monospace",
};

// BlockNote Theme Configuration
export const jasperBlockNoteTheme = {
  colors: {
    editor: {
      text: jasperColors.carbon,
      background: jasperColors.white,
    },
    menu: {
      text: jasperColors.graphite,
      background: jasperColors.white,
    },
    tooltip: {
      text: jasperColors.white,
      background: jasperColors.navy,
    },
    hovered: {
      text: jasperColors.carbon,
      background: jasperColors.gray100,
    },
    selected: {
      text: jasperColors.white,
      background: jasperColors.emerald,
    },
    disabled: {
      text: jasperColors.slateLight,
      background: jasperColors.gray50,
    },
    shadow: jasperColors.slate,
    border: jasperColors.gray100,
    sideMenu: jasperColors.slate,
    highlights: {
      gray: { text: jasperColors.graphite, background: jasperColors.gray100 },
      brown: { text: "#78350F", background: "#FEF3C7" },
      red: { text: "#991B1B", background: "#FEE2E2" },
      orange: { text: "#9A3412", background: "#FFEDD5" },
      yellow: { text: "#854D0E", background: "#FEF9C3" },
      green: { text: jasperColors.emeraldDark, background: "#DCFCE7" },
      blue: { text: "#1E40AF", background: "#DBEAFE" },
      purple: { text: "#6B21A8", background: "#F3E8FF" },
      pink: { text: "#9D174D", background: "#FCE7F3" },
    },
  },
  borderRadius: 6,
  fontFamily: jasperFonts.body,
};

// Default BlockNote schema with all standard blocks plus custom blocks
export const jasperSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    // Custom JASPER blocks - invoke as functions to get block specs
    callout: CalloutBlock(),
    stats: StatsBlock(),
    divider: DividerBlock(),
    embed: EmbedBlock(),
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
  },
  styleSpecs: {
    ...defaultStyleSpecs,
  },
});

// Editor configuration options
export const jasperEditorOptions = {
  // Enable all standard formatting
  enableBlockNoteExtensions: true,

  // Placeholder text
  placeholders: {
    default: "Start typing or paste content...",
    heading: "Heading",
    bulletListItem: "List item",
    numberedListItem: "List item",
  },

  // Upload configuration (for images)
  uploadFile: async (file: File): Promise<string> => {
    // This will be replaced with actual JASPER image library integration
    // For now, create a temporary object URL
    return URL.createObjectURL(file);
  },
};

// Toolbar items configuration
export const toolbarItems = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
  "link",
] as const;

// Block type menu items
export const blockTypeMenuItems = [
  { name: "Paragraph", type: "paragraph" },
  { name: "Heading 1", type: "heading", props: { level: 1 } },
  { name: "Heading 2", type: "heading", props: { level: 2 } },
  { name: "Heading 3", type: "heading", props: { level: 3 } },
  { name: "Bullet List", type: "bulletListItem" },
  { name: "Numbered List", type: "numberedListItem" },
  { name: "Quote", type: "quote" },
  { name: "Code Block", type: "codeBlock" },
  { name: "Table", type: "table" },
  { name: "Image", type: "image" },
  // Custom JASPER blocks
  { name: "Callout", type: "callout", props: { variant: "info" } },
  { name: "Stats", type: "stats" },
  { name: "Divider", type: "divider" },
  { name: "Embed (Video/Audio/Social)", type: "embed" },
] as const;

// Export type for schema
export type JasperSchema = typeof jasperSchema;
