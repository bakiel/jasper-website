/**
 * oEmbed Service for JASPER Content Hub
 *
 * Handles URL detection and embed generation for:
 * - YouTube, Vimeo, Dailymotion
 * - Twitter/X, Instagram, TikTok
 * - Spotify, SoundCloud
 * - CodePen, CodeSandbox, GitHub Gist
 * - Figma, Canva, Miro
 * - Generic oEmbed providers
 */

// Provider types
export type EmbedProviderType = "video" | "rich" | "photo" | "link" | "audio";

// Embed metadata returned from URL parsing
export interface EmbedMetadata {
  url: string; // Original URL
  embedUrl: string; // Embed/iframe URL
  provider: string; // Provider name (youtube, vimeo, twitter, etc.)
  providerType: EmbedProviderType;
  title?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  aspectRatio: string; // e.g., "16/9"
}

// Provider definitions with URL patterns and embed URL generators
interface ProviderConfig {
  name: string;
  type: EmbedProviderType;
  patterns: RegExp[];
  getEmbedUrl: (match: RegExpMatchArray, url: string) => string;
  getThumbnail?: (match: RegExpMatchArray, url: string) => string | undefined;
  aspectRatio?: string | ((match: RegExpMatchArray) => string);
}

// Whitelist of allowed embed domains for security
export const ALLOWED_EMBED_DOMAINS = [
  // Video
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "vimeo.com",
  "player.vimeo.com",
  "dailymotion.com",
  "www.dailymotion.com",
  "wistia.com",
  "loom.com",
  "www.loom.com",
  // Social
  "twitter.com",
  "x.com",
  "platform.twitter.com",
  "instagram.com",
  "www.instagram.com",
  "facebook.com",
  "www.facebook.com",
  "linkedin.com",
  "www.linkedin.com",
  "tiktok.com",
  "www.tiktok.com",
  // Audio
  "spotify.com",
  "open.spotify.com",
  "soundcloud.com",
  // Code
  "codepen.io",
  "codesandbox.io",
  "github.com",
  "gist.github.com",
  // Design
  "figma.com",
  "www.figma.com",
  "canva.com",
  "www.canva.com",
  "miro.com",
];

// Provider configurations
const providers: ProviderConfig[] = [
  // YouTube
  {
    name: "youtube",
    type: "video",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
    ],
    getEmbedUrl: (match) =>
      `https://www.youtube-nocookie.com/embed/${match[1]}`,
    getThumbnail: (match) =>
      `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`,
    aspectRatio: "16/9",
  },

  // Vimeo
  {
    name: "vimeo",
    type: "video",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
      /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/,
    ],
    getEmbedUrl: (match) =>
      `https://player.vimeo.com/video/${match[1]}?dnt=1`,
    aspectRatio: "16/9",
  },

  // Dailymotion
  {
    name: "dailymotion",
    type: "video",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([a-zA-Z0-9]+)/,
      /(?:https?:\/\/)?dai\.ly\/([a-zA-Z0-9]+)/,
    ],
    getEmbedUrl: (match) =>
      `https://www.dailymotion.com/embed/video/${match[1]}`,
    aspectRatio: "16/9",
  },

  // Loom
  {
    name: "loom",
    type: "video",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?loom\.com\/share\/([a-zA-Z0-9]+)/,
      /(?:https?:\/\/)?(?:www\.)?loom\.com\/embed\/([a-zA-Z0-9]+)/,
    ],
    getEmbedUrl: (match) => `https://www.loom.com/embed/${match[1]}`,
    aspectRatio: "16/9",
  },

  // Twitter/X
  {
    name: "twitter",
    type: "rich",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\/status\/(\d+)/,
    ],
    getEmbedUrl: (match, url) =>
      `https://platform.twitter.com/embed/Tweet.html?id=${match[2]}`,
    aspectRatio: "1/1",
  },

  // Instagram
  {
    name: "instagram",
    type: "rich",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/reel\/([a-zA-Z0-9_-]+)/,
    ],
    getEmbedUrl: (match, url) => `${url.split("?")[0]}embed/`,
    aspectRatio: "1/1",
  },

  // TikTok
  {
    name: "tiktok",
    type: "video",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)\/video\/(\d+)/,
    ],
    getEmbedUrl: (match) =>
      `https://www.tiktok.com/embed/v2/${match[2]}`,
    aspectRatio: "9/16",
  },

  // Spotify
  {
    name: "spotify",
    type: "audio",
    patterns: [
      /(?:https?:\/\/)?open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/,
    ],
    getEmbedUrl: (match) =>
      `https://open.spotify.com/embed/${match[1]}/${match[2]}`,
    aspectRatio: match => match[1] === "track" ? "100/80" : "100/352",
  },

  // SoundCloud
  {
    name: "soundcloud",
    type: "audio",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/,
    ],
    getEmbedUrl: (match, url) =>
      `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`,
    aspectRatio: "100/166",
  },

  // CodePen
  {
    name: "codepen",
    type: "rich",
    patterns: [
      /(?:https?:\/\/)?codepen\.io\/([a-zA-Z0-9_-]+)\/(?:pen|full|details)\/([a-zA-Z0-9]+)/,
    ],
    getEmbedUrl: (match) =>
      `https://codepen.io/${match[1]}/embed/${match[2]}?default-tab=result`,
    aspectRatio: "16/9",
  },

  // CodeSandbox
  {
    name: "codesandbox",
    type: "rich",
    patterns: [
      /(?:https?:\/\/)?codesandbox\.io\/s\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?codesandbox\.io\/embed\/([a-zA-Z0-9_-]+)/,
    ],
    getEmbedUrl: (match) =>
      `https://codesandbox.io/embed/${match[1]}?fontsize=14&hidenavigation=1&theme=dark`,
    aspectRatio: "16/9",
  },

  // GitHub Gist
  {
    name: "gist",
    type: "rich",
    patterns: [
      /(?:https?:\/\/)?gist\.github\.com\/([a-zA-Z0-9_-]+)\/([a-fA-F0-9]+)/,
    ],
    getEmbedUrl: (match) =>
      `https://gist.github.com/${match[1]}/${match[2]}.js`,
    aspectRatio: "16/9",
  },

  // Figma
  {
    name: "figma",
    type: "rich",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?figma\.com\/(file|proto)\/([a-zA-Z0-9]+)/,
    ],
    getEmbedUrl: (match, url) =>
      `https://www.figma.com/embed?embed_host=jasper&url=${encodeURIComponent(url)}`,
    aspectRatio: "16/9",
  },

  // Canva
  {
    name: "canva",
    type: "rich",
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?canva\.com\/design\/([a-zA-Z0-9_-]+)/,
    ],
    getEmbedUrl: (match, url) =>
      url.replace("/design/", "/embed/"),
    aspectRatio: "16/9",
  },

  // Miro
  {
    name: "miro",
    type: "rich",
    patterns: [
      /(?:https?:\/\/)?miro\.com\/app\/board\/([a-zA-Z0-9_=-]+)/,
    ],
    getEmbedUrl: (match) =>
      `https://miro.com/app/embed/${match[1]}/`,
    aspectRatio: "16/9",
  },
];

/**
 * Check if a URL matches any known embed provider
 */
export function detectProvider(url: string): ProviderConfig | null {
  for (const provider of providers) {
    for (const pattern of provider.patterns) {
      if (pattern.test(url)) {
        return provider;
      }
    }
  }
  return null;
}

/**
 * Check if a URL is from an allowed domain
 */
export function isAllowedDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_EMBED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Parse a URL and extract embed metadata
 */
export function parseEmbedUrl(url: string): EmbedMetadata | null {
  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Check if URL is from allowed domain
  if (!isAllowedDomain(normalizedUrl)) {
    return null;
  }

  // Find matching provider
  const provider = detectProvider(normalizedUrl);
  if (!provider) {
    return null;
  }

  // Find the matching pattern and extract groups
  let match: RegExpMatchArray | null = null;
  for (const pattern of provider.patterns) {
    match = normalizedUrl.match(pattern);
    if (match) break;
  }

  if (!match) {
    return null;
  }

  // Calculate aspect ratio
  let aspectRatio = "16/9";
  if (typeof provider.aspectRatio === "function") {
    aspectRatio = (provider.aspectRatio as (match: RegExpMatchArray) => string)(match);
  } else if (provider.aspectRatio) {
    aspectRatio = provider.aspectRatio;
  }

  return {
    url: normalizedUrl,
    embedUrl: provider.getEmbedUrl(match, normalizedUrl),
    provider: provider.name,
    providerType: provider.type,
    thumbnailUrl: provider.getThumbnail?.(match, normalizedUrl),
    aspectRatio,
  };
}

/**
 * Check if a string looks like a URL that might be embeddable
 */
export function looksLikeEmbedUrl(text: string): boolean {
  const urlPattern = /^https?:\/\/[^\s]+$/;
  if (!urlPattern.test(text.trim())) {
    return false;
  }

  // Check if it matches any known provider
  return detectProvider(text.trim()) !== null;
}

/**
 * Get a list of supported providers with their names
 */
export function getSupportedProviders(): { name: string; type: EmbedProviderType }[] {
  return providers.map((p) => ({ name: p.name, type: p.type }));
}

/**
 * Generate iframe sandbox attributes for secure embedding
 */
export function getIframeSandbox(provider: string): string {
  // Base sandbox with minimal permissions
  const basePermissions = [
    "allow-scripts",
    "allow-same-origin",
  ];

  // Additional permissions based on provider type
  const providerConfig = providers.find((p) => p.name === provider);
  if (providerConfig) {
    if (providerConfig.type === "video" || providerConfig.type === "audio") {
      basePermissions.push("allow-presentation");
    }
    if (providerConfig.type === "rich") {
      basePermissions.push("allow-popups");
      basePermissions.push("allow-popups-to-escape-sandbox");
    }
  }

  return basePermissions.join(" ");
}
