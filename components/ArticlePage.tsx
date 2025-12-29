'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  Linkedin,
  Twitter,
  Link2,
  BookOpen,
  ArrowRight,
  MessageCircle,
  User,
  Send,
  TrendingUp,
  Building2,
  LineChart,
  Lightbulb,
  Newspaper
} from 'lucide-react';
import {
  getPostBySlug,
  getRelatedPosts,
  type BlogPost
} from '../data/blog';

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

// Simple Markdown renderer for article content
const renderMarkdown = (content: string): React.ReactNode => {
  const lines = content.trim().split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  const flushList = () => {
    if (currentList.length > 0) {
      const ListTag = listType;
      elements.push(
        <ListTag key={elements.length} className="my-4 pl-6 space-y-2 text-brand-muted">
          {currentList.map((item, i) => (
            <li key={i} className="leading-relaxed">{item}</li>
          ))}
        </ListTag>
      );
      currentList = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      flushList();
      return;
    }

    // Headers
    if (trimmedLine.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="text-2xl font-display font-bold text-white mt-12 mb-4">
          {trimmedLine.replace('## ', '')}
        </h2>
      );
      return;
    }

    if (trimmedLine.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-xl font-display font-bold text-white mt-8 mb-3">
          {trimmedLine.replace('### ', '')}
        </h3>
      );
      return;
    }

    // Horizontal rule
    if (trimmedLine === '---') {
      flushList();
      elements.push(
        <hr key={index} className="my-8 border-white/10" />
      );
      return;
    }

    // List items
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      inList = true;
      listType = 'ul';
      currentList.push(trimmedLine.replace(/^[-*]\s/, '').replace(/\*\*([^*]+)\*\*/g, '$1'));
      return;
    }

    if (/^\d+\.\s/.test(trimmedLine)) {
      inList = true;
      listType = 'ol';
      currentList.push(trimmedLine.replace(/^\d+\.\s/, '').replace(/\*\*([^*]+)\*\*/g, '$1'));
      return;
    }

    // Regular paragraph
    flushList();
    // Process inline formatting
    let processedLine = trimmedLine
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-emerald hover:underline">$1</a>');

    elements.push(
      <p
        key={index}
        className="text-brand-muted leading-relaxed my-4"
        dangerouslySetInnerHTML={{ __html: processedLine }}
      />
    );
  });

  flushList();
  return elements;
};

// Comment Form Component
const CommentForm: React.FC<{ postSlug: string }> = ({ postSlug }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Connect to backend API
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitted(true);
    setLoading(false);
    setName('');
    setEmail('');
    setComment('');
  };

  if (submitted) {
    return (
      <div className="p-6 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 text-center">
        <MessageCircle className="w-8 h-8 text-brand-emerald mx-auto mb-3" />
        <p className="text-white font-semibold">Thank you for your comment!</p>
        <p className="text-brand-muted text-sm mt-1">
          Your comment is awaiting moderation and will appear shortly.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-brand-emerald text-sm hover:underline"
        >
          Leave another comment
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald transition-colors"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald transition-colors"
            placeholder="your@email.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          Comment *
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          rows={4}
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald transition-colors resize-none"
          placeholder="Share your thoughts..."
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-emerald text-white font-semibold hover:bg-brand-emerald-dark transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Post Comment
          </>
        )}
      </button>
    </form>
  );
};

// Lead Capture Sidebar
const LeadCaptureSidebar: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to backend API
    setSubmitted(true);
    setEmail('');
  };

  return (
    <div className="sticky top-32 space-y-6">
      {/* Newsletter CTA */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-brand-emerald/20 to-brand-navy border border-brand-emerald/20">
        <h4 className="text-lg font-display font-bold text-white mb-3">
          Get Weekly Insights
        </h4>
        <p className="text-sm text-brand-muted mb-4">
          DFI funding tips, financial modelling best practices, and sector updates.
        </p>

        {submitted ? (
          <div className="text-brand-emerald text-sm font-semibold">
            Thanks! Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald transition-colors text-sm"
            />
            <button
              type="submit"
              className="w-full px-4 py-2.5 rounded-lg bg-brand-emerald text-white font-semibold hover:bg-brand-emerald-dark transition-colors text-sm"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>

      {/* Consultation CTA */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h4 className="text-lg font-display font-bold text-white mb-3">
          Need a Financial Model?
        </h4>
        <p className="text-sm text-brand-muted mb-4">
          Get a DFI-compliant model built by our team. Zero errors guaranteed.
        </p>
        <button
          onClick={() => onNavigate?.('/contact')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors text-sm"
        >
          Get Started
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Related Articles
const RelatedArticles: React.FC<{
  currentSlug: string;
  onNavigate?: (path: string) => void;
}> = ({ currentSlug, onNavigate }) => {
  const relatedPosts = getRelatedPosts(currentSlug, 3);

  if (relatedPosts.length === 0) return null;

  return (
    <div className="mt-16 pt-16 border-t border-white/10">
      <h3 className="text-2xl font-display font-bold text-white mb-8">
        Related Articles
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <article
            key={post.slug}
            onClick={() => onNavigate?.(`/insights/${post.slug}`)}
            className="group cursor-pointer p-6 rounded-xl bg-white/5 border border-white/10 hover:border-brand-emerald/30 transition-all"
          >
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-emerald/20 text-brand-emerald text-xs font-semibold mb-3">
              {categoryIcons[post.category]}
              {post.category}
            </span>
            <h4 className="font-display font-bold text-white group-hover:text-brand-emerald transition-colors line-clamp-2 mb-2">
              {post.title}
            </h4>
            <p className="text-sm text-brand-muted line-clamp-2">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {post.readTime} min read
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

// Share buttons
const ShareButtons: React.FC<{ post: BlogPost }> = ({ post }) => {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = encodeURIComponent(post.title);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    // Could add toast notification here
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 mr-2">Share:</span>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        <Linkedin className="w-4 h-4 text-gray-400 hover:text-white" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        <Twitter className="w-4 h-4 text-gray-400 hover:text-white" />
      </a>
      <button
        onClick={copyLink}
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        <Link2 className="w-4 h-4 text-gray-400 hover:text-white" />
      </button>
    </div>
  );
};

export const ArticlePage: React.FC<ArticlePageProps> = ({ slug, onBack, onNavigate }) => {
  const post = getPostBySlug(slug);

  // 404 state
  if (!post) {
    return (
      <div className="min-h-screen bg-brand-navy text-brand-text font-sans flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-white mb-2">Article Not Found</h1>
          <p className="text-brand-muted mb-6">The article you're looking for doesn't exist.</p>
          <button
            onClick={() => onNavigate?.('/insights')}
            className="inline-flex items-center gap-2 text-brand-emerald hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Insights
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-navy text-brand-text font-sans selection:bg-brand-emerald selection:text-brand-navy">
      <Navbar onNavigate={onNavigate} />

      <main className="pt-32 pb-20">
        {/* Article Header */}
        <section className="relative px-6 lg:px-12 mb-12">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-emerald/10 blur-[150px] rounded-full pointer-events-none" />

          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
            >
              {/* Back link */}
              <button
                onClick={() => onNavigate?.('/insights')}
                className="inline-flex items-center gap-2 text-brand-muted hover:text-brand-emerald transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Insights
              </button>

              {/* Category */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-emerald/20 text-brand-emerald text-xs font-semibold mb-6">
                {categoryIcons[post.category]}
                {post.category}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 tracking-tight leading-[1.2]">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-brand-muted mb-8">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{post.author.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTime} min read</span>
                </div>
              </div>

              {/* Share */}
              <ShareButtons post={post} />
            </motion.div>
          </div>
        </section>

        {/* Article Content */}
        <section className="px-6 lg:px-12">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Main Content */}
              <article className="flex-1 max-w-3xl">
                <div className="prose prose-invert prose-lg max-w-none">
                  {renderMarkdown(post.content)}
                </div>

                {/* Tags */}
                <div className="mt-12 pt-8 border-t border-white/10">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Author */}
                <div className="mt-8 p-6 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-brand-emerald/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-brand-emerald" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-white">{post.author.name}</h4>
                    <p className="text-sm text-brand-muted">{post.author.role}</p>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mt-16 pt-16 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-8">
                    <MessageCircle className="w-5 h-5 text-brand-emerald" />
                    <h3 className="text-2xl font-display font-bold text-white">
                      Leave a Comment
                    </h3>
                  </div>
                  <CommentForm postSlug={post.slug} />
                </div>

                {/* Related Articles */}
                <RelatedArticles currentSlug={post.slug} onNavigate={onNavigate} />
              </article>

              {/* Sidebar */}
              <aside className="lg:w-80">
                <LeadCaptureSidebar onNavigate={onNavigate} />
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
