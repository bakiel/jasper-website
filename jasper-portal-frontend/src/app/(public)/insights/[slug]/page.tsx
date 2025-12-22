'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// API URL - use relative path to go through Vercel rewrites (avoids mixed content)
const API_BASE = ''

// Blog post interface
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

// Clean content by removing structure tags
const cleanContent = (rawContent: string): string => {
  // Extract only the content after [CONTENT] marker if it exists
  let content = rawContent

  // Remove [TITLE]: line
  content = content.replace(/\[TITLE\]:.*$/gm, '')
  // Remove [SEO_TITLE]: line
  content = content.replace(/\[SEO_TITLE\]:.*$/gm, '')
  // Remove [SEO_DESCRIPTION]: line
  content = content.replace(/\[SEO_DESCRIPTION\]:.*$/gm, '')
  // Remove [EXCERPT]: line and any content until next marker
  content = content.replace(/\[EXCERPT\]:[\s\S]*?(?=\[CONTENT\]|\[TAGS\]|$)/gm, '')
  // Remove [CONTENT] marker
  content = content.replace(/\[CONTENT\]/g, '')
  // Remove [TAGS]: line and everything after
  content = content.replace(/\[TAGS\]:.*$/gm, '')

  // Clean up multiple blank lines
  content = content.replace(/\n{3,}/g, '\n\n')

  return content.trim()
}

// Parse markdown tables into beautiful HTML tables
const parseMarkdownTables = (content: string): string => {
  // Match markdown tables
  const tableRegex = /(\|[^\n]+\|\n)((?:\|[-:\s|]+\|\n))((?:\|[^\n]+\|\n?)+)/g

  return content.replace(tableRegex, (match, headerRow, separatorRow, bodyRows) => {
    // Parse header
    const headers = headerRow.split('|').filter((cell: string) => cell.trim()).map((cell: string) => cell.trim())

    // Parse alignment from separator
    const alignments = separatorRow.split('|').filter((cell: string) => cell.trim()).map((cell: string) => {
      const trimmed = cell.trim()
      if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center'
      if (trimmed.endsWith(':')) return 'right'
      return 'left'
    })

    // Parse body rows
    const rows = bodyRows.trim().split('\n').map((row: string) =>
      row.split('|').filter((cell: string) => cell.trim()).map((cell: string) => cell.trim())
    )

    // Build beautiful HTML table
    let html = `
      <div class="my-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-emerald-500/10 border-b border-white/10">`

    headers.forEach((header: string, i: number) => {
      const align = alignments[i] || 'left'
      html += `<th class="px-4 py-3 text-${align} font-semibold text-emerald-400 whitespace-nowrap">${header}</th>`
    })

    html += `</tr></thead><tbody>`

    rows.forEach((row: string[], rowIndex: number) => {
      const rowBg = rowIndex % 2 === 0 ? '' : 'bg-white/[0.02]'
      html += `<tr class="${rowBg} border-b border-white/[0.05] last:border-0 hover:bg-white/[0.04] transition-colors">`
      row.forEach((cell: string, i: number) => {
        const align = alignments[i] || 'left'
        // Make first column slightly bolder
        const cellStyle = i === 0 ? 'text-slate-200 font-medium' : 'text-slate-400'
        html += `<td class="px-4 py-3 text-${align} ${cellStyle}">${cell}</td>`
      })
      html += `</tr>`
    })

    html += `</tbody></table></div></div>`
    return html
  })
}

// Enhanced markdown to HTML converter (dark theme)
const renderMarkdown = (content: string): string => {
  // First clean the content
  let cleaned = cleanContent(content)

  // Parse tables FIRST before other transformations
  cleaned = parseMarkdownTables(cleaned)

  return cleaned
    // Headers with # syntax
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-10 mb-6">$1</h1>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-white mt-8 mb-4">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-10 mb-5">$1</h2>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-white">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em class="text-slate-300">$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">$1</a>')
    // Unordered lists
    .replace(/^\- (.*$)/gim, '<li class="ml-6 mb-2 text-slate-300 list-disc">$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 text-slate-300 list-decimal">$1</li>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr class="my-10 border-white/10" />')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-5 text-slate-300 leading-relaxed">')
    // Code inline
    .replace(/`(.*?)`/g, '<code class="px-2 py-0.5 bg-white/10 rounded text-sm font-mono text-emerald-300">$1</code>')
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Category icons
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

// Lead Capture Sidebar (Dark Theme)
const LeadCaptureSidebar: React.FC = () => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    setEmail('')
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/20 p-6">
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/30 blur-[50px] rounded-full pointer-events-none" />

      <h3 className="text-white font-semibold mb-2">Get Weekly DFI Insights</h3>
      <p className="text-slate-400 text-sm mb-4">
        Join 500+ finance professionals receiving our weekly newsletter.
      </p>
      {submitted ? (
        <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Thanks! Check your inbox.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 text-sm"
          />
          <button
            type="submit"
            className="w-full px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-all text-sm shadow-lg shadow-emerald-500/20"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  )
}

// Related Posts (Dark Theme)
const RelatedPosts: React.FC<{ posts: BlogPost[], currentSlug: string }> = ({ posts, currentSlug }) => {
  const related = posts
    .filter(p => p.slug !== currentSlug && p.status === 'published')
    .slice(0, 3)

  if (related.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Related Articles</h3>
      {related.map((post) => (
        <Link
          key={post.slug}
          href={`/insights/${post.slug}`}
          className="block p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all duration-300 group"
        >
          <h4 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors line-clamp-2 mb-1">
            {post.title}
          </h4>
          <p className="text-xs text-slate-500">{post.readTime} min read</p>
        </Link>
      ))}
    </div>
  )
}

export default function ArticlePage() {
  const params = useParams()
  const slug = params.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [allPosts, setAllPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        // Fetch all posts to get the specific one and related posts
        const res = await fetch(`${API_BASE}/api/blog/posts?limit=100`)
        const data = await res.json()

        if (data.success && data.posts) {
          const publishedPosts = data.posts.filter((p: BlogPost) => p.status === 'published')
          setAllPosts(publishedPosts)

          const foundPost = publishedPosts.find((p: BlogPost) => p.slug === slug)
          if (foundPost) {
            setPost(foundPost)
          } else {
            setError('Article not found')
          }
        }
      } catch (err) {
        setError('Failed to load article')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A14] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#050A14] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Article Not Found</h1>
          <p className="text-slate-400 mb-6">The article you're looking for doesn't exist.</p>
          <Link href="/insights" className="text-emerald-400 hover:text-emerald-300 font-medium">
            ← Back to Insights
          </Link>
        </div>
      </div>
    )
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="min-h-screen bg-[#050A14] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[150px] rounded-full" />
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/3 -right-32 w-64 h-64 bg-slate-500/10 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#050A14]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/insights" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
              <span className="text-white font-bold text-lg">J</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-tight">JASPER</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest -mt-0.5">Insights</span>
            </div>
          </Link>
          <Link
            href="/insights"
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Articles
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Main Content */}
          <article className="lg:col-span-2">
            {/* Hero Image */}
            {post.heroImage && (
              <div className="relative h-64 lg:h-80 rounded-2xl overflow-hidden mb-8">
                <Image
                  src={post.heroImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-transparent to-transparent" />
              </div>
            )}

            {/* Article Header */}
            <header className="mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs font-semibold mb-5">
                {categoryIcons[post.category]}
                {post.category}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-5 leading-tight tracking-tight">
                {post.title}
              </h1>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                {post.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-xs">
                    {post.author.name.charAt(0)}
                  </div>
                  <span className="text-slate-300">{post.author.name}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(post.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {post.readTime} min read
                </span>
              </div>
            </header>

            {/* Article Content */}
            <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 lg:p-10 mb-10">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: `<p class="mb-5 text-slate-300 leading-relaxed">${renderMarkdown(post.content)}</p>`
                }}
              />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-10">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Share */}
            <div className="flex items-center gap-4 mb-10 pb-10 border-b border-white/[0.06]">
              <span className="text-sm font-medium text-slate-400">Share:</span>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                title="Copy link"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>

            {/* CTA Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/20 p-8 text-center">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-16 bg-emerald-500/30 blur-[60px] rounded-full pointer-events-none" />
              <h3 className="text-xl font-bold text-white mb-3">Need a DFI-Grade Financial Model?</h3>
              <p className="text-slate-400 text-sm mb-5 max-w-md mx-auto">
                Our team builds investment-grade models that get funded. Zero reference errors guaranteed.
              </p>
              <Link
                href="/intake"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-all text-sm shadow-lg shadow-emerald-500/30"
              >
                Start Your Project
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1 mt-10 lg:mt-0 space-y-6">
            <LeadCaptureSidebar />
            <RelatedPosts posts={allPosts} currentSlug={slug} />

            {/* Quick CTA Card */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
              <h3 className="font-semibold text-white mb-2">Need a Financial Model?</h3>
              <p className="text-sm text-slate-400 mb-4">
                DFI-grade models built by experts. Zero reference errors guaranteed.
              </p>
              <Link
                href="/intake"
                className="block w-full text-center px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all text-sm"
              >
                Start Project
              </Link>
            </div>
          </aside>
        </div>
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
