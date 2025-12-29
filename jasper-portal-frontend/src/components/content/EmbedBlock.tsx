"use client";

/**
 * Universal Embed Block for JASPER Content Hub
 *
 * Supports embedding content from:
 * - Video: YouTube, Vimeo, Dailymotion, Loom
 * - Social: Twitter/X, Instagram, TikTok
 * - Audio: Spotify, SoundCloud
 * - Code: CodePen, CodeSandbox, GitHub Gist
 * - Design: Figma, Canva, Miro
 */

import { createReactBlockSpec } from "@blocknote/react";
import { useState, useCallback, useEffect } from "react";
import {
  Play,
  Link2,
  ExternalLink,
  RefreshCw,
  X,
  AlertCircle,
} from "lucide-react";
import {
  parseEmbedUrl,
  getIframeSandbox,
  EmbedProviderType,
} from "@/lib/oembed-service";

// Provider icons (using simple SVG paths for common providers)
const providerIcons: Record<string, JSX.Element> = {
  youtube: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  vimeo: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 0 0 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  ),
  spotify: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  ),
  codepen: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M24 8.182l-.018-.087-.017-.05c-.01-.024-.018-.05-.03-.075-.003-.018-.015-.034-.02-.05l-.035-.067-.03-.05-.044-.06-.046-.045-.06-.06-.046-.04-.064-.05-.064-.036-.066-.044-.078-.04-.054-.024-.092-.042-.104-.044-.11-.042L12.45.01l-.086-.036-.078-.024-.09-.028-.088-.02-.096-.018-.088-.008h-.018l-.082-.008-.072-.002h-.032l-.078.002-.074.008-.084.01-.082.016-.09.022-.086.024-.084.03-.08.034-.08.04-.074.042-.068.048-.06.05-.054.052-.048.054-.044.058-.04.06-.036.066-.03.068-.026.07-.02.076-.016.078-.01.08-.006.084v.08l.002.01v.004l.012.078.018.08.022.074.03.074.038.068.046.064.05.058.056.056.06.05.068.046.076.04.082.036.086.03.096.028.102.024.11.022.116.018.124.014.132.012.14.008.148.006.158.002h.164l.082-.002h.082l.164-.006.152-.008.144-.012.132-.014.122-.018.114-.022.104-.024.096-.028.09-.03.082-.034.078-.04.072-.044.064-.048.06-.052.054-.056.048-.058.044-.062.04-.066.034-.07.03-.074.026-.078.022-.082.018-.086.014-.09.01-.094.006-.1.002-.102V9.14l-.002-.086-.006-.082-.01-.078-.014-.076-.018-.072-.022-.07-.026-.066-.03-.064-.034-.06-.04-.056-.044-.052-.048-.05-.054-.044-.058-.042-.064-.038-.068-.034-.074-.032-.078-.028-.082-.024-.088-.022-.092-.018-.098-.016-.102-.012-.108-.01-.112-.006-.118-.004-.124-.002-.13.002-.136.004L12 .008l-.128.006-.122.006-.118.01-.112.012-.106.016-.1.018-.094.022-.088.024-.082.028-.078.03-.072.034-.068.038-.062.04-.058.044-.052.048-.048.052-.044.054-.04.058-.036.062-.032.066-.028.07-.024.074-.022.078-.018.082-.016.086-.012.09-.01.094-.006.098-.004.102-.002.106V8.18zM12 16.069l-4.074-2.722 4.074-2.72 4.074 2.72-4.074 2.722zm-.542-6.333l-4.33 2.896V9.18l4.33-2.896v3.452zm1.084 0V6.284l4.33 2.896v3.452l-4.33-2.896zm5.374 7.446l-4.074 2.72v-3.452l4.074-2.72v3.452zm-10.832 0V13.73l4.074 2.72v3.452l-4.074-2.72zm5.916-1.61l4.33-2.894v3.45l-4.33 2.896v-3.452zm-1.084 0v3.452l-4.33-2.896v-3.45l4.33 2.894z" />
    </svg>
  ),
  figma: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
      <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zM8.148 24c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v4.49c0 2.476-2.014 4.49-4.588 4.49zm-.001-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02c1.665 0 3.019-1.355 3.019-3.019v-3.02H8.147zM8.148 8.981c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981H8.148zm-.001-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.147zM8.148 15.02c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98H8.148zm-.001-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019h3.117V7.51H8.147zM15.852 15.02h-4.588V6.04h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm0-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019z" />
    </svg>
  ),
};

// Get icon for provider, fallback to generic link icon
function getProviderIcon(provider: string): JSX.Element {
  return providerIcons[provider] || <Link2 className="w-5 h-5" />;
}

// Get provider display name
function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    youtube: "YouTube",
    vimeo: "Vimeo",
    dailymotion: "Dailymotion",
    loom: "Loom",
    twitter: "Twitter/X",
    instagram: "Instagram",
    tiktok: "TikTok",
    spotify: "Spotify",
    soundcloud: "SoundCloud",
    codepen: "CodePen",
    codesandbox: "CodeSandbox",
    gist: "GitHub Gist",
    figma: "Figma",
    canva: "Canva",
    miro: "Miro",
  };
  return names[provider] || provider;
}

/**
 * Embed Block Component
 */
interface EmbedBlockProps {
  block: {
    id: string;
    props: {
      url: string;
      embedUrl: string;
      provider: string;
      providerType: string; // BlockNote returns string, we cast when needed
      title: string;
      thumbnailUrl: string;
      aspectRatio: string;
    };
  };
  editor: any;
}

function EmbedBlockComponent({ block, editor }: EmbedBlockProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const hasEmbed = block.props.url && block.props.embedUrl;

  // Parse URL and update block props
  const handleUrlSubmit = useCallback(async () => {
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const metadata = parseEmbedUrl(inputUrl.trim());

      if (!metadata) {
        setError("This URL is not supported. Try YouTube, Vimeo, Twitter, Spotify, or other supported providers.");
        return;
      }

      // Update block with embed data
      editor.updateBlock(block, {
        type: "embed",
        props: {
          url: metadata.url,
          embedUrl: metadata.embedUrl,
          provider: metadata.provider,
          providerType: metadata.providerType,
          title: metadata.title || "",
          thumbnailUrl: metadata.thumbnailUrl || "",
          aspectRatio: metadata.aspectRatio,
        },
      });

      setInputUrl("");
    } catch (err) {
      setError("Failed to parse URL. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [inputUrl, editor, block]);

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUrlSubmit();
    }
  };

  // Clear embed
  const handleClearEmbed = useCallback(() => {
    editor.updateBlock(block, {
      type: "embed",
      props: {
        url: "",
        embedUrl: "",
        provider: "",
        providerType: "video",
        title: "",
        thumbnailUrl: "",
        aspectRatio: "16/9",
      },
    });
    setIframeLoaded(false);
  }, [editor, block]);

  // Calculate aspect ratio for container
  const getAspectRatioStyle = (): React.CSSProperties => {
    const ratio = block.props.aspectRatio || "16/9";
    const [w, h] = ratio.split("/").map(Number);
    const paddingTop = (h / w) * 100;
    return { paddingTop: `${paddingTop}%` };
  };

  // Render empty state with URL input
  if (!hasEmbed) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Play className="w-8 h-8" />
            <span className="text-lg font-medium">Embed Media</span>
          </div>

          <p className="text-sm text-gray-500 text-center max-w-md">
            Paste a URL from YouTube, Vimeo, Twitter, Spotify, CodePen, Figma,
            or other supported platforms.
          </p>

          <div className="w-full max-w-lg">
            <div className="flex gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                disabled={isLoading || !inputUrl.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  "Embed"
                )}
              </button>
            </div>

            {error && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {["youtube", "vimeo", "twitter", "spotify", "codepen", "figma"].map(
              (provider) => (
                <div
                  key={provider}
                  className="flex items-center gap-1.5 text-gray-400 text-xs"
                  title={getProviderDisplayName(provider)}
                >
                  {getProviderIcon(provider)}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render embed iframe
  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-900 group">
      {/* Header with provider info */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-white">
          <span className="text-white/80">{getProviderIcon(block.props.provider)}</span>
          <span className="text-sm font-medium">
            {getProviderDisplayName(block.props.provider)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={block.props.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-white/70 hover:text-white rounded transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={handleClearEmbed}
            className="p-1.5 text-white/70 hover:text-white rounded transition-colors"
            title="Remove embed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aspect ratio container */}
      <div className="relative w-full" style={getAspectRatioStyle()}>
        {/* Loading state */}
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        )}

        {/* Iframe */}
        <iframe
          src={block.props.embedUrl}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          sandbox={getIframeSandbox(block.props.provider)}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </div>
  );
}

/**
 * Create the Embed block specification
 */
export const EmbedBlock = createReactBlockSpec(
  {
    type: "embed",
    propSchema: {
      url: { default: "" },
      embedUrl: { default: "" },
      provider: { default: "" },
      providerType: { default: "video" },
      title: { default: "" },
      thumbnailUrl: { default: "" },
      aspectRatio: { default: "16/9" },
    },
    content: "none",
  },
  {
    render: (props) => (
      <EmbedBlockComponent block={props.block as any} editor={props.editor} />
    ),
  }
);

// Export for use in blocknote-config
export { EmbedBlock as Embed };
