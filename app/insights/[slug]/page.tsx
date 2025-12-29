'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/Navbar';
import { Footer } from '../../../components/Footer';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import {
  ArrowLeft,
  Clock,
  Share2,
  BookOpen,
  ArrowRight,
  Building2,
  LineChart,
  TrendingUp,
  Lightbulb,
  Newspaper,
  MessageSquare
} from 'lucide-react';
import {
  getPostBySlug,
  getRelatedPosts,
  type BlogPost,
  type ContentBlock
} from '../../../data/blog';
import {
  getPostBySlugAsync,
  getRelatedPostsAsync
} from '../../../data/blogApi';

interface ArticlePageProps {
  slug: string;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
}

// Category icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
  'DFI Insights': <Building2 className="w-4 h-4" />,
  'Financial Modelling': <LineChart className="w-4 h-4" />,
  'Sector Analysis': <TrendingUp className="w-4 h-4" />,
  'Case Studies': <Lightbulb className="w-4 h-4" />,
  'Industry News': <Newspaper className="w-4 h-4" />
};

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Custom components for ReactMarkdown with proper styling
const markdownComponents: Components = {
  // Headers
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold text-white mt-10 mb-6">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold text-white mt-10 mb-5">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-semibold text-white mt-8 mb-4">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-lg font-semibold text-white mt-6 mb-3">{children}</h4>
  ),
  // Paragraphs
  p: ({ children }) => (
    <p className="mb-5 text-brand-muted leading-relaxed">{children}</p>
  ),
  // Bold
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  // Italic
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),
  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-brand-emerald hover:underline transition-colors"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  // Unordered lists
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-6 mb-5 space-y-2 text-brand-muted">{children}</ul>
  ),
  // Ordered lists
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-6 mb-5 space-y-2 text-brand-muted">{children}</ol>
  ),
  // List items
  li: ({ children }) => (
    <li className="text-brand-muted leading-relaxed">{children}</li>
  ),
  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-brand-emerald pl-4 my-6 italic text-brand-muted bg-white/5 py-3 pr-4 rounded-r-lg">
      {children}
    </blockquote>
  ),
  // Horizontal rule
  hr: () => (
    <hr className="my-10 border-white/10" />
  ),
  // Code inline
  code: ({ children, className }) => {
    // Check if this is a code block (has language class) vs inline code
    const isCodeBlock = className?.includes('language-');
    if (isCodeBlock) {
      return (
        <code className={`block overflow-x-auto p-4 bg-black/30 rounded-lg text-sm font-mono text-brand-emerald ${className}`}>
          {children}
        </code>
      );
    }
    return (
      <code className="px-1.5 py-0.5 bg-white/10 rounded text-sm font-mono text-brand-emerald">
        {children}
      </code>
    );
  },
  // Code blocks (pre wrapper)
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-lg border border-white/10">
      {children}
    </pre>
  ),
  // Tables - Professional styling
  table: ({ children }) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-white/10">
      <table className="min-w-full bg-white/5 divide-y divide-white/10">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/10">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-white/10">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-white/5 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-emerald uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-sm text-brand-muted whitespace-normal">
      {children}
    </td>
  ),
  // Images
  img: ({ src, alt }) => (
    <figure className="my-6">
      <img
        src={src}
        alt={alt || ''}
        className="rounded-lg w-full object-cover border border-white/10"
      />
      {alt && (
        <figcaption className="mt-2 text-center text-sm text-gray-500 italic">
          {alt}
        </figcaption>
      )}
    </figure>
  ),
};

// Resolve image URLs - handles relative paths and full URLs
const resolveImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `https://api.jasperfinance.org${url}`;
  // Assume it's a filename from the image library
  return `https://api.jasperfinance.org/api/v1/images/library/serve/${encodeURIComponent(url)}`;
};

// Content Block Renderer for structured content
const ContentBlockRenderer: React.FC<{ blocks: ContentBlock[] }> = ({ blocks }) => {
  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p key={block.id} className="mb-5 text-brand-muted leading-relaxed">
            {block.content}
          </p>
        );

      case 'heading':
        const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
        const headingClasses: Record<number, string> = {
          1: 'text-3xl font-bold text-white mt-10 mb-6',
          2: 'text-2xl font-bold text-white mt-10 mb-5',
          3: 'text-xl font-semibold text-white mt-8 mb-4',
          4: 'text-lg font-semibold text-white mt-6 mb-3',
        };
        return (
          <HeadingTag key={block.id} className={headingClasses[block.level || 2]}>
            {block.content}
          </HeadingTag>
        );

      case 'image':
      case 'infographic':
        const sizeClasses: Record<string, string> = {
          small: 'max-w-md mx-auto',
          medium: 'max-w-2xl mx-auto',
          large: 'max-w-4xl mx-auto',
          full: 'w-full',
        };
        return (
          <figure key={block.id} className={`my-6 ${sizeClasses[block.size || 'full']}`}>
            {block.image_url ? (
              <img
                src={resolveImageUrl(block.image_url)}
                alt={block.alt_text || ''}
                className="rounded-lg w-full object-cover border border-white/10"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="bg-white/5 rounded-lg p-8 text-center text-gray-500">
                Image not available
              </div>
            )}
            {block.caption && (
              <figcaption className="mt-2 text-center text-sm text-gray-500 italic">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );

      case 'gallery':
        const columns = block.columns || 3;
        return (
          <div key={block.id} className={`my-6 grid gap-4 grid-cols-1 md:grid-cols-${Math.min(columns, 3)}`}>
            {block.images?.map((img, idx) => (
              <figure key={idx} className="relative">
                <img
                  src={resolveImageUrl(img.url)}
                  alt={img.alt || ''}
                  className="rounded-lg w-full h-48 object-cover border border-white/10"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                {img.caption && (
                  <figcaption className="mt-1 text-center text-xs text-gray-500">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        );

      case 'quote':
        return (
          <blockquote key={block.id} className="border-l-4 border-brand-emerald pl-4 my-6 italic text-brand-muted bg-white/5 py-3 pr-4 rounded-r-lg">
            <p>{block.content}</p>
            {block.attribution && (
              <footer className="text-sm text-gray-500 mt-2">— {block.attribution}</footer>
            )}
          </blockquote>
        );

      case 'callout':
        const styleClasses: Record<string, string> = {
          info: 'border-blue-500/30 bg-blue-500/10',
          warning: 'border-yellow-500/30 bg-yellow-500/10',
          success: 'border-brand-emerald/30 bg-brand-emerald/10',
          tip: 'border-purple-500/30 bg-purple-500/10',
        };
        return (
          <div key={block.id} className={`my-6 p-4 rounded-lg border ${styleClasses[block.style || 'info']}`}>
            <p className="text-brand-muted">{block.content}</p>
          </div>
        );

      case 'list':
        const ListTag = block.listType === 'numbered' ? 'ol' : 'ul';
        const listClass = block.listType === 'numbered'
          ? 'list-decimal list-outside ml-6 mb-5 space-y-2 text-brand-muted'
          : 'list-disc list-outside ml-6 mb-5 space-y-2 text-brand-muted';
        return (
          <ListTag key={block.id} className={listClass}>
            {block.items?.map((item, idx) => (
              <li key={idx} className="text-brand-muted leading-relaxed">{item}</li>
            ))}
          </ListTag>
        );

      case 'divider':
        return <hr key={block.id} className="my-10 border-white/10" />;

      case 'table':
        return (
          <div key={block.id} className="overflow-x-auto my-6 rounded-lg border border-white/10">
            <table className="min-w-full bg-white/5 divide-y divide-white/10">
              {block.headers && (
                <thead className="bg-white/10">
                  <tr>
                    {block.headers.map((header, idx) => (
                      <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-brand-emerald uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-white/10">
                {block.rows?.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-white/5 transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-sm text-brand-muted whitespace-normal">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return <>{blocks.map(renderBlock)}</>;
};

// Comment Form Component
const CommentForm: React.FC<{ postSlug: string }> = ({ postSlug }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Connect to backend API
      await new Promise(resolve => setTimeout(resolve, 500));
      setSubmitted(true);
      setName('');
      setEmail('');
      setComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 rounded-lg bg-brand-emerald/10 border border-brand-emerald/20">
        <p className="font-medium text-brand-emerald">Thank you for your comment!</p>
        <p className="text-brand-emerald/80 mt-1 text-sm">Your comment is pending moderation and will appear shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald transition-colors text-sm"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald transition-colors text-sm"
            placeholder="your@email.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Comment *</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald transition-colors text-sm resize-none"
          placeholder="Share your thoughts..."
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-5 py-2.5 rounded-lg bg-brand-emerald text-white font-medium hover:bg-brand-emerald-dark transition-colors text-sm disabled:opacity-70 flex items-center gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        {isSubmitting ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
};

// Lead Capture Sidebar
const LeadCaptureSidebar: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to backend
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setEmail('');
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-emerald/20 to-brand-navy border border-brand-emerald/20 p-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-emerald/10 blur-[60px] rounded-full pointer-events-none" />
      <div className="relative z-10">
        <h3 className="text-white font-semibold mb-2">Get Weekly DFI Insights</h3>
        <p className="text-brand-muted text-sm mb-4">
          Join 500+ finance professionals receiving our weekly newsletter.
        </p>
        {submitted ? (
          <p className="text-brand-emerald text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
            Thanks! Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald text-sm"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg bg-brand-emerald text-white font-medium hover:bg-brand-emerald-dark transition-colors text-sm flex items-center justify-center gap-2"
            >
              Subscribe
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// Related Posts
const RelatedPosts: React.FC<{
  posts: BlogPost[];
  onNavigate?: (path: string) => void;
}> = ({ posts, onNavigate }) => {
  if (posts.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Related Articles</h3>
      {posts.map((post) => (
        <div
          key={post.slug}
          onClick={() => onNavigate?.(`/insights/${post.slug}`)}
          className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-brand-emerald/30 transition-colors group cursor-pointer"
        >
          <h4 className="text-sm font-medium text-white group-hover:text-brand-emerald transition-colors line-clamp-2">
            {post.title}
          </h4>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readTime} min read
          </p>
        </div>
      ))}
    </div>
  );
};

const ArticlePage: React.FC<ArticlePageProps> = ({ slug, onBack, onNavigate }) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const loadPost = async () => {
      // First try static data for immediate render
      const staticPost = getPostBySlug(slug);
      if (staticPost) {
        setPost(staticPost);
        setRelatedPosts(getRelatedPosts(slug, 3));
        setLoading(false);
      }

      // Then fetch from API for latest content
      try {
        const [apiPost, apiRelated] = await Promise.all([
          getPostBySlugAsync(slug),
          getRelatedPostsAsync(slug, 3),
        ]);

        if (apiPost) {
          setPost(apiPost);
          setRelatedPosts(apiRelated);
        }
        setLoading(false);
      } catch (error) {
        console.warn('Failed to load from API:', error);
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-navy flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-emerald/20 border-t-brand-emerald rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-brand-navy text-brand-text font-sans">
        <Navbar onNavigate={onNavigate} />
        <main className="pt-32 pb-20 px-6 lg:px-12">
          <div className="container mx-auto text-center">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-6" />
            <h1 className="text-3xl font-display font-bold text-white mb-4">Article Not Found</h1>
            <p className="text-brand-muted mb-8">The article you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => onNavigate?.('/insights')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-emerald text-white font-semibold hover:bg-brand-emerald-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Insights
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-brand-navy text-brand-text font-sans selection:bg-brand-emerald selection:text-brand-navy">
      <Navbar onNavigate={onNavigate} />

      <main className="pt-32 pb-20">
        {/* Article Header */}
        <section className="relative px-6 lg:px-12 mb-12">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-emerald/10 blur-[150px] rounded-full pointer-events-none" />

          <div className="container mx-auto">
            {/* Back button */}
            <button
              onClick={() => onNavigate?.('/insights')}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-emerald transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">All Articles</span>
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl"
            >
              {/* Category */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/20 text-brand-emerald text-xs font-semibold mb-6">
                {categoryIcons[post.category]}
                {post.category}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 tracking-tight leading-tight">
                {post.title}
              </h1>

              {/* Excerpt */}
              <p className="text-xl text-brand-muted mb-8 leading-relaxed">
                {post.excerpt}
              </p>

              {/* Hero Image */}
              {post.heroImage && (
                <div className="relative rounded-2xl overflow-hidden mb-8 aspect-[16/9]">
                  <img
                    src={post.heroImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-3">
                  {/* JASPER Team Avatar */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-emerald/30 to-brand-navy border-2 border-brand-emerald/40 flex items-center justify-center overflow-hidden">
                    <img
                      src={typeof post.author === 'object' && post.author?.avatar ? post.author.avatar : 'https://api.jasperfinance.org/static/jasper-icon.png'}
                      alt="JASPER"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-white font-medium">{typeof post.author === 'string' ? post.author : post.author?.name || 'JASPER Team'}</p>
                    <p className="text-xs text-gray-500">{typeof post.author === 'string' ? 'Research Team' : post.author?.role || 'Research Team'}</p>
                  </div>
                </div>
                <span>{formatDate(post.publishedAt)}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readTime} min read
                </span>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 hover:text-brand-emerald transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="px-6 lg:px-12">
          <div className="container mx-auto">
            <div className="lg:grid lg:grid-cols-3 lg:gap-12">
              {/* Article Content */}
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                {/* Content */}
                <div className="prose prose-invert max-w-none rounded-2xl bg-white/5 border border-white/10 p-8 lg:p-10 mb-10">
                  {/* Use content_blocks if available (structured content), otherwise fall back to markdown */}
                  {post.content_blocks && post.content_blocks.length > 0 ? (
                    <ContentBlockRenderer blocks={post.content_blocks} />
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {post.content}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-10">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Share buttons */}
                <div className="flex items-center gap-4 mb-10 pb-10 border-b border-white/10">
                  <span className="text-sm font-medium text-gray-400">Share:</span>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-brand-emerald hover:bg-brand-emerald/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(post.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-brand-emerald hover:bg-brand-emerald/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <button
                    onClick={handleShare}
                    className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-brand-emerald hover:bg-brand-emerald/10 transition-colors"
                    title="Copy link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Comments Section */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-8">
                  <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-brand-emerald" />
                    Comments
                  </h2>
                  <CommentForm postSlug={post.slug} />
                </div>
              </motion.article>

              {/* Sidebar */}
              <aside className="lg:col-span-1 mt-12 lg:mt-0 space-y-6">
                <LeadCaptureSidebar />
                <RelatedPosts posts={relatedPosts} onNavigate={onNavigate} />

                {/* CTA Card */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h3 className="font-semibold text-white mb-2">Need a Financial Model?</h3>
                  <p className="text-sm text-brand-muted mb-4">
                    DFI-grade models built by experts. Zero reference errors guaranteed.
                  </p>
                  <button
                    onClick={() => onNavigate?.('/contact')}
                    className="w-full px-4 py-3 rounded-lg bg-brand-emerald text-white font-medium hover:bg-brand-emerald-dark transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    Start Your Project
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ArticlePage;
