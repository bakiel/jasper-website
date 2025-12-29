'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  ArrowRight,
  Search,
  TrendingUp,
  Building2,
  LineChart,
  Lightbulb,
  Newspaper,
  Leaf,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { type BlogPost } from '../../data/blog';

interface InsightsPageProps {
  onNavigate?: (path: string) => void;
}

const POSTS_PER_PAGE = 9;
const API_URL = 'https://api.jasperfinance.org/api/v1/blog/posts';
const API_BASE = 'https://api.jasperfinance.org';

// Resolve image URL - prepend API base for relative paths
const resolveImageUrl = (heroImage: string | undefined): string | undefined => {
  if (!heroImage) return undefined;
  // If it's a relative path (starts with /), prepend API base
  if (heroImage.startsWith('/')) {
    return `${API_BASE}${heroImage}`;
  }
  // Otherwise use as-is (already full URL)
  return heroImage;
};

// Category icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
  'DFI Insights': <Building2 className="w-4 h-4" />,
  'Financial Modelling': <LineChart className="w-4 h-4" />,
  'Sector Analysis': <TrendingUp className="w-4 h-4" />,
  'Case Studies': <Lightbulb className="w-4 h-4" />,
  'Industry News': <Newspaper className="w-4 h-4" />,
  'Climate Finance': <Leaf className="w-4 h-4" />
};

const CATEGORIES = [
  'DFI Insights',
  'Financial Modelling',
  'Sector Analysis',
  'Case Studies',
  'Industry News',
  'Climate Finance'
];

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Clean excerpt of markdown formatting (safety measure for API data)
const cleanExcerpt = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s*/gm, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
};

// Loading Skeleton Component
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-12">
    {/* Featured skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 lg:row-span-2 h-80 bg-white/5 animate-pulse rounded-2xl" />
      <div className="h-36 bg-white/5 animate-pulse rounded-2xl" />
      <div className="h-36 bg-white/5 animate-pulse rounded-2xl" />
    </div>
    {/* Article grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-72 bg-white/5 animate-pulse rounded-2xl" />
      ))}
    </div>
  </div>
);

// Error State Component
const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
    <p className="text-red-400 mb-2 text-lg font-semibold">Failed to load articles</p>
    <p className="text-gray-500 mb-6">Please check your connection and try again.</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-emerald text-white font-semibold hover:bg-brand-emerald-dark transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      Try Again
    </button>
  </div>
);

// Pagination Component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all ${
          currentPage === 1
            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
            : 'bg-white/5 text-white hover:bg-white/10'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => (
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                currentPage === page
                  ? 'bg-brand-emerald text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-2 text-gray-500">...</span>
          )
        ))}
      </div>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all ${
          currentPage === totalPages
            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
            : 'bg-white/5 text-white hover:bg-white/10'
        }`}
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// Article Card Component
const ArticleCard: React.FC<{
  post: BlogPost;
  onNavigate?: (path: string) => void;
  size?: 'large' | 'medium' | 'small';
}> = ({ post, onNavigate, size = 'small' }) => {
  const isLarge = size === 'large';
  const isMedium = size === 'medium';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group cursor-pointer h-full"
      onClick={() => onNavigate?.(`/insights/${post.slug}`)}
    >
      <div className={`
        relative overflow-hidden rounded-2xl bg-white/5 border border-white/10
        hover:border-brand-emerald/30 transition-all duration-300 h-full
        ${isLarge ? 'lg:flex lg:items-stretch' : ''}
      `}>
        {/* Hero Image */}
        <div className={`
          relative overflow-hidden bg-gradient-to-br from-brand-emerald/20 to-brand-navy
          ${isLarge ? 'lg:w-1/2 h-64 lg:h-auto min-h-[320px]' : isMedium ? 'h-40' : 'h-48'}
        `}>
          {post.heroImage ? (
            <img
              src={resolveImageUrl(post.heroImage)}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {categoryIcons[post.category] || <BookOpen className="w-12 h-12 text-brand-emerald/50" />}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/20 text-brand-emerald text-xs font-semibold backdrop-blur-sm">
              {categoryIcons[post.category]}
              {post.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className={`p-5 ${isLarge ? 'lg:w-1/2 lg:flex lg:flex-col lg:justify-center lg:p-8' : ''}`}>
          <h3 className={`
            font-display font-bold text-white mb-2 group-hover:text-brand-emerald transition-colors line-clamp-2
            ${isLarge ? 'text-2xl lg:text-3xl' : isMedium ? 'text-base' : 'text-lg'}
          `}>
            {post.title}
          </h3>

          <p className={`text-brand-muted mb-4 ${isLarge ? 'line-clamp-3' : 'line-clamp-2'} ${isMedium ? 'text-xs' : 'text-sm'}`}>
            {cleanExcerpt(post.excerpt)}
          </p>

          <div className={`flex items-center justify-between ${isMedium ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.readTime} min
              </span>
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-emerald opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </motion.article>
  );
};

// 3-Article Featured Section
const FeaturedSection: React.FC<{
  posts: BlogPost[];
  onNavigate?: (path: string) => void;
}> = ({ posts, onNavigate }) => {
  // Filter for high SEO score posts (75%+) and sort by recency
  const eligible = posts
    .filter(p => (p.seo?.score || 75) >= 70) // Default to 75 if no SEO score
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  if (eligible.length < 3) return null;

  const main = eligible[0];
  const secondary = eligible.slice(1, 3);

  return (
    <section className="px-6 lg:px-12 mb-16">
      <div className="container mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1 h-6 bg-brand-emerald rounded-full" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Featured Insights</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main featured - large */}
          <div className="lg:col-span-2 lg:row-span-2">
            <ArticleCard post={main} onNavigate={onNavigate} size="large" />
          </div>

          {/* Secondary featured - medium */}
          {secondary.map((post) => (
            <div key={post.slug}>
              <ArticleCard post={post} onNavigate={onNavigate} size="medium" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Lead Capture CTA
const LeadCaptureCTA: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setEmail('');
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-emerald/20 to-brand-navy border border-brand-emerald/20 p-8 lg:p-12">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-emerald/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        <h3 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4">
          Get DFI Funding Insights Delivered
        </h3>
        <p className="text-brand-muted mb-6">
          Weekly insights on development finance, financial modelling best practices, and sector analysis.
          Join 500+ finance professionals.
        </p>

        {submitted ? (
          <div className="flex items-center gap-2 text-brand-emerald font-semibold">
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
            Thanks! Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-brand-emerald text-white font-semibold hover:bg-brand-emerald-dark transition-colors flex items-center justify-center gap-2"
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

const InsightsPage: React.FC<InsightsPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);

  // Fetch posts from live API
  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.success !== false) {
        // Handle both array and {posts: []} formats
        const posts = Array.isArray(data) ? data : (data.posts || []);
        const publishedPosts = posts
          .filter((p: BlogPost) => p.status === 'published')
          .sort((a: BlogPost, b: BlogPost) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
          );
        setAllPosts(publishedPosts);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError('Failed to load articles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Filter posts
  const filteredPosts = allPosts.filter(post => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query));
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  // Show featured only when not searching/filtering
  const showFeatured = !searchQuery && !selectedCategory && currentPage === 1;

  return (
    <div className="min-h-screen bg-brand-navy text-brand-text font-sans selection:bg-brand-emerald selection:text-brand-navy">
      <Navbar onNavigate={onNavigate} />

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="relative px-6 lg:px-12 mb-16">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-emerald/10 blur-[150px] rounded-full pointer-events-none" />

          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald">
                  JASPER Insights
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 tracking-tight leading-[1.1]">
                DFI Funding <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-white">
                  Intelligence.
                </span>
              </h1>
              <p className="text-xl text-brand-muted max-w-2xl leading-relaxed">
                Expert insights on development finance, financial modelling, and sector-specific funding strategies.
                Knowledge that helps you secure capital.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Search & Filter */}
        <section className="px-6 lg:px-12 mb-12">
          <div className="container mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search with clear button */}
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-emerald transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    !selectedCategory
                      ? 'bg-brand-emerald text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      selectedCategory === category
                        ? 'bg-brand-emerald text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {categoryIcons[category]}
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            {(searchQuery || selectedCategory) && !isLoading && (
              <div className="mt-4 text-sm text-gray-500">
                Found <span className="text-brand-emerald font-semibold">{filteredPosts.length}</span> article{filteredPosts.length !== 1 ? 's' : ''}
                {searchQuery && <span> matching "{searchQuery}"</span>}
                {selectedCategory && <span> in {selectedCategory}</span>}
              </div>
            )}
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <section className="px-6 lg:px-12 mb-16">
            <div className="container mx-auto">
              <LoadingSkeleton />
            </div>
          </section>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <section className="px-6 lg:px-12 mb-16">
            <div className="container mx-auto">
              <ErrorState onRetry={fetchPosts} />
            </div>
          </section>
        )}

        {/* Content when loaded */}
        {!isLoading && !error && (
          <>
            {/* Featured Section - 3 articles */}
            {showFeatured && allPosts.length >= 3 && (
              <FeaturedSection posts={allPosts} onNavigate={onNavigate} />
            )}

            {/* Lead Capture */}
            {showFeatured && (
              <section className="px-6 lg:px-12 mb-16">
                <div className="container mx-auto">
                  <LeadCaptureCTA />
                </div>
              </section>
            )}

            {/* All Articles */}
            <section className="px-6 lg:px-12 mb-16">
              <div className="container mx-auto">
                <div className="flex items-center gap-2 mb-8">
                  <span className="w-1 h-6 bg-brand-emerald rounded-full" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                    {searchQuery || selectedCategory ? 'Results' : 'Latest Articles'}
                  </h2>
                  <span className="text-sm text-gray-500">({filteredPosts.length})</span>
                </div>

                {filteredPosts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginatedPosts.map((post, index) => (
                        <motion.div
                          key={post.slug}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <ArticleCard post={post} onNavigate={onNavigate} />
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination */}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </>
                ) : (
                  <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                    <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">No articles found matching your criteria.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory(null);
                      }}
                      className="mt-4 text-brand-emerald hover:underline font-medium"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* CTA Section */}
        <section className="px-6 lg:px-12">
          <div className="container mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-[#050A14] border border-white/5 p-12 lg:p-16 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
                  Need a Custom Financial Model?
                </h2>
                <p className="text-brand-muted mb-8">
                  Our team builds DFI-compliant financial models that get funded.
                  Zero reference errors. Investment-grade quality.
                </p>
                <button
                  onClick={() => onNavigate?.('/contact')}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-brand-emerald text-white font-semibold hover:bg-brand-emerald-dark transition-colors"
                >
                  Start Your Project
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default InsightsPage;
