'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// Pagination constant
const POSTS_PER_PAGE = 9

// Blog post interface matching API
interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  author: { name: string; role: string }
  publishedAt: string
  readTime: number
  heroImage?: string
  seo?: { score: number; title?: string; description?: string }
  status: string
}

// API URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.jasperfinance.org'

// Category icon components
const categoryIcons: Record<string, React.ReactNode> = {
  'DFI Insights': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  'Financial Modelling': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  'Sector Analysis': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  'Case Studies': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  'Industry News': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  'Climate Finance': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Glass Card Article Component (Dark Theme)
const ArticleCard: React.FC<{
  post: BlogPost
  featured?: boolean
  size?: 'small' | 'medium' | 'large'
}> = ({ post, featured = false, size = 'small' }) => {
  const isLarge = size === 'large' || featured
  const isMedium = size === 'medium'

  // Clean excerpt - remove markdown symbols
  const cleanExcerpt = post.excerpt
    ?.replace(/^#+\s*/gm, '')
    ?.replace(/\*\*/g, '')
    ?.replace(/\*/g, '')
    ?.slice(0, 180) || ''

  return (
    <Link
      href={`/insights/${post.slug}`}
      className={`group block h-full ${isLarge ? 'col-span-full lg:col-span-2' : ''}`}
    >
      <article className={`
        relative overflow-hidden rounded-2xl h-full
        bg-white/[0.03] backdrop-blur-sm
        border border-white/[0.06]
        hover:border-emerald-500/30 hover:bg-white/[0.05]
        transition-all duration-500 ease-out
        ${isLarge ? 'lg:flex lg:items-stretch min-h-[340px]' : ''}
      `}>
        {/* Hover glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
        </div>

        {/* Hero Image or Placeholder */}
        <div className={`
          relative overflow-hidden
          ${isLarge ? 'lg:w-1/2 h-56 lg:h-auto' : isMedium ? 'h-40' : 'h-48'}
        `}>
          {post.heroImage ? (
            <Image
              src={post.heroImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-slate-800/50 to-slate-900/50 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                {categoryIcons[post.category] || (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-transparent to-transparent opacity-60" />

          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-semibold shadow-lg shadow-emerald-500/20">
              {categoryIcons[post.category]}
              {post.category}
            </span>
          </div>

          {/* SEO Score badge for high-scoring articles */}
          {post.seo?.score && post.seo.score >= 75 && (
            <div className="absolute top-4 right-4">
              <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-400 text-xs font-bold">
                {post.seo.score}%
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`relative p-6 flex flex-col ${isLarge ? 'lg:w-1/2 lg:justify-center lg:p-8' : ''}`}>
          <h3 className={`
            font-display font-semibold text-white mb-3 group-hover:text-emerald-400 transition-colors duration-300 line-clamp-2
            ${isLarge ? 'text-xl lg:text-2xl' : isMedium ? 'text-lg' : 'text-lg'}
          `}>
            {post.title}
          </h3>

          <p className={`text-slate-400 mb-4 line-clamp-2 leading-relaxed ${isLarge ? 'text-sm lg:text-base' : 'text-sm'}`}>
            {cleanExcerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {post.readTime} min read
              </span>
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1">
              <span className="text-xs font-medium">Read</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

// Lead Capture CTA (Dark Theme)
const LeadCaptureCTA: React.FC = () => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
      setEmail('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/20 p-8 lg:p-12">
      {/* Glow effects */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/30 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Newsletter
        </div>

        <h3 className="text-2xl lg:text-3xl font-display font-bold text-white mb-3">
          Get DFI Funding Insights Delivered
        </h3>
        <p className="text-slate-400 text-base mb-6 leading-relaxed">
          Weekly insights on development finance, financial modelling best practices, and sector-specific analysis.
          Join 500+ finance professionals.
        </p>

        {submitted ? (
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
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
              className="flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-all duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-70 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// Pagination component (Dark Theme)
const Pagination: React.FC<{
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const maxVisiblePages = 5

  let visiblePages = pages
  if (totalPages > maxVisiblePages) {
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, start + maxVisiblePages - 1)
    visiblePages = pages.slice(start - 1, end)
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {visiblePages[0] > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-300">1</button>
          {visiblePages[0] > 2 && <span className="text-slate-600 px-1">...</span>}
        </>
      )}

      {visiblePages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3.5 py-2 rounded-xl border transition-all duration-300 ${
            page === currentPage
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30'
              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          {page}
        </button>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && <span className="text-slate-600 px-1">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-300">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

// 3-Article Featured Section (1 Large + 2 Small)
const FeaturedSection: React.FC<{ posts: BlogPost[] }> = ({ posts }) => {
  const eligiblePosts = posts
    .filter(p => (p.seo?.score || 0) >= 70)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  if (eligiblePosts.length < 3) {
    // Fallback to most recent if not enough high-SEO posts
    const recentPosts = [...posts].sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    ).slice(0, 3)

    if (recentPosts.length < 3) return null

    return (
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Featured Insights</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 lg:row-span-2">
            <ArticleCard post={recentPosts[0]} featured size="large" />
          </div>
          {recentPosts.slice(1).map((post) => (
            <div key={post.slug}>
              <ArticleCard post={post} size="medium" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  const mainFeature = eligiblePosts[0]
  const secondaryPosts: BlogPost[] = []
  const usedCategories = new Set([mainFeature.category])

  for (const post of eligiblePosts.slice(1)) {
    if (secondaryPosts.length >= 2) break
    if (!usedCategories.has(post.category)) {
      secondaryPosts.push(post)
      usedCategories.add(post.category)
    }
  }

  if (secondaryPosts.length < 2) {
    for (const post of eligiblePosts.slice(1)) {
      if (secondaryPosts.length >= 2) break
      if (!secondaryPosts.includes(post)) {
        secondaryPosts.push(post)
      }
    }
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Featured Insights</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 lg:row-span-2">
          <ArticleCard post={mainFeature} featured size="large" />
        </div>
        {secondaryPosts.map((post) => (
          <div key={post.slug}>
            <ArticleCard post={post} size="medium" />
          </div>
        ))}
      </div>
    </section>
  )
}

export default function InsightsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`${API_BASE}/api/blog/posts?limit=100`)
        const data = await res.json()

        if (data.success && data.posts) {
          const publishedPosts = data.posts.filter((p: BlogPost) => p.status === 'published')
          setPosts(publishedPosts)
          const uniqueCategories = Array.from(new Set(publishedPosts.map((p: BlogPost) => p.category))) as string[]
          setCategories(uniqueCategories)
        }
      } catch (err) {
        setError('Failed to load articles')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory])

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  )

  // Show featured section only on first page with no filters
  const showFeatured = currentPage === 1 && !searchQuery && !selectedCategory

  return (
    <div className="min-h-screen bg-[#050A14] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Hero glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full" />
        {/* Side accents */}
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/3 -right-32 w-64 h-64 bg-slate-500/10 blur-[100px] rounded-full" />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#050A14]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white tracking-tight">JASPER</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest -mt-0.5">Insights</span>
              </div>
            </Link>

            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 text-sm font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 lg:py-16">
        {/* Hero Section */}
        <section className="mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            JASPER Insights
          </div>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-white mb-6 tracking-tight leading-[1.1]">
            DFI Funding
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500">
              Intelligence
            </span>
          </h1>
          <p className="text-slate-400 text-lg lg:text-xl max-w-2xl leading-relaxed">
            Expert insights on development finance, financial modelling, and sector-specific funding strategies.
            Knowledge that helps you secure capital.
          </p>
        </section>

        {/* Search & Filter */}
        <section className="mb-10">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-80">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
              />
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  !selectedCategory
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {categoryIcons[category]}
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-10">
            {/* Featured skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 lg:row-span-2 h-80 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
              <div className="h-40 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
              <div className="h-40 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
            </div>
            {/* Articles skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-red-500/20">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Content (after loading) */}
        {!isLoading && !error && (
          <>
            {/* Featured Section */}
            {showFeatured && <FeaturedSection posts={posts} />}

            {/* Lead Capture */}
            <section className="mb-12">
              <LeadCaptureCTA />
            </section>

            {/* All Articles */}
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                  {searchQuery || selectedCategory ? 'Results' : 'Latest Articles'}
                </h2>
                <span className="text-xs text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
                  {filteredPosts.length}
                </span>
              </div>

              {paginatedPosts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedPosts.map((post) => (
                      <ArticleCard key={post.slug} post={post} />
                    ))}
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              ) : (
                <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                  <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-slate-500 text-sm mb-4">No articles found matching your criteria.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory(null)
                    }}
                    className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {/* CTA Section */}
        <section>
          <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-10 lg:p-16 text-center">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-xl mx-auto">
              <h2 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4">
                Need a Custom Financial Model?
              </h2>
              <p className="text-slate-400 text-base mb-8 leading-relaxed">
                Our team builds DFI-compliant financial models that get funded.
                Zero reference errors. Investment-grade quality.
              </p>
              <Link
                href="/intake"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-all duration-300 text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
              >
                Start Your Project
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] mt-16">
        <div className="max-w-6xl mx-auto px-4 py-10 text-center">
          <p className="text-slate-600 text-xs">
            JASPER Financial Architecture is a division of Gahn Eden (Pty) Ltd.
          </p>
          <p className="mt-3 text-xs">
            <a href="mailto:models@jasperfinance.org" className="text-emerald-500 hover:text-emerald-400 transition-colors">
              models@jasperfinance.org
            </a>
            <span className="text-slate-700 mx-3">|</span>
            <a href="https://jasperfinance.org" className="text-emerald-500 hover:text-emerald-400 transition-colors">
              jasperfinance.org
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
