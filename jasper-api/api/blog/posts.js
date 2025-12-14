/**
 * JASPER Blog Posts API
 * Handles CRUD operations for blog posts
 * Supports scheduling, draft status, and AI auto-posting
 */
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.SECRET_KEY || 'jasper-default-secret-key-change-in-production';
const AI_API_KEY = process.env.BLOG_AI_API_KEY || 'jasper-ai-blog-key'; // For AI auto-posting

function getSecretKey() {
  return new TextEncoder().encode(SECRET_KEY);
}

// Verify JWT token from Authorization header (admin access)
async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch (error) {
    return null;
  }
}

// Verify AI API key for auto-posting
function verifyAIKey(req) {
  const apiKey = req.headers['x-ai-api-key'];
  return apiKey === AI_API_KEY;
}

// Post statuses
const POST_STATUSES = ['draft', 'scheduled', 'published'];

// Categories
const CATEGORIES = [
  'DFI Insights',
  'Financial Modelling',
  'Sector Analysis',
  'Case Studies',
  'Industry News'
];

// In-memory store (use PostgreSQL in production)
let blogPosts = [
  {
    id: 'post-1',
    slug: 'understanding-idc-funding-requirements-2024',
    title: 'Understanding IDC Funding Requirements: What South African Businesses Need to Know in 2024',
    excerpt: 'Navigate the Industrial Development Corporation\'s funding criteria with confidence. Learn about the key requirements, application process, and how to structure your financial model for success.',
    content: `## Introduction

The Industrial Development Corporation (IDC) remains South Africa's premier development finance institution, providing crucial funding for businesses across key sectors. Understanding their requirements is essential for any company seeking growth capital.

## Key Funding Criteria

### 1. Sector Alignment

The IDC prioritises funding for businesses in sectors that contribute to:
- **Job creation** in underserved communities
- **Industrial capacity building**
- **Export growth and foreign exchange earnings**
- **Black economic empowerment**

### 2. Financial Viability

Your financial model must demonstrate:
- Clear path to profitability within 3-5 years
- Debt service coverage ratio (DSCR) above 1.3x
- Adequate equity contribution (typically 30-40%)
- Realistic revenue projections backed by offtake agreements

## How JASPER Helps

Our JASPER financial modelling platform is specifically designed to meet DFI requirements. We ensure:
- Zero reference errors in Excel models
- IDC-compliant ratio calculations
- Sensitivity analysis across multiple scenarios
- Professional presentation standards

---

*Need help with your IDC application? [Contact our team](/contact) for a consultation.*`,
    category: 'DFI Insights',
    tags: ['IDC', 'Development Finance', 'South Africa', 'Funding Requirements', 'Financial Modelling'],
    author: {
      name: 'JASPER Team',
      role: 'Financial Architecture'
    },
    publishedAt: '2024-12-10T09:00:00Z',
    scheduledAt: null,
    updatedAt: '2024-12-10T09:00:00Z',
    readTime: 8,
    featured: true,
    heroImage: null,
    seoTitle: 'IDC Funding Requirements 2024 | Complete Guide for SA Businesses',
    seoDescription: 'Learn everything about IDC funding requirements in South Africa. Discover key criteria, application process, and how to structure your financial model for approval.',
    status: 'published',
    createdAt: '2024-12-09T14:00:00Z',
    createdBy: 'admin',
    viewCount: 0
  }
];

// Generate post ID
function generateId() {
  return `post-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
}

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Calculate read time (approx 200 words per minute)
function calculateReadTime(content) {
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / 200);
}

// Get only published posts (respects scheduling)
function getPublishedPosts() {
  const now = new Date();
  return blogPosts.filter(post => {
    if (post.status !== 'published') return false;
    if (post.scheduledAt && new Date(post.scheduledAt) > now) return false;
    return true;
  });
}

// Process scheduled posts (called by cron or AI)
function processScheduledPosts() {
  const now = new Date();
  let publishedCount = 0;

  blogPosts.forEach(post => {
    if (post.status === 'scheduled' && post.scheduledAt) {
      if (new Date(post.scheduledAt) <= now) {
        post.status = 'published';
        post.publishedAt = now.toISOString();
        post.updatedAt = now.toISOString();
        publishedCount++;
      }
    }
  });

  return publishedCount;
}

export default async function handler(req, res) {
  // CORS
  const allowedOrigins = [
    'https://jasperfinance.org',
    'https://portal.jasperfinance.org',
    'http://localhost:3000',
    'http://localhost:3004'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-AI-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Public access for published posts, admin access for all
  if (req.method === 'GET') {
    const { id, slug, category, tag, search, status, featured, page = 1, limit = 10, admin } = req.query;

    // Admin mode requires authentication
    if (admin === 'true') {
      const user = await verifyAuth(req);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required for admin access' });
      }

      // Get specific post by ID (admin)
      if (id) {
        const post = blogPosts.find(p => p.id === id);
        if (!post) {
          return res.status(404).json({ success: false, message: 'Post not found' });
        }
        return res.status(200).json({ success: true, post });
      }

      // Return all posts for admin (including drafts and scheduled)
      let filteredPosts = [...blogPosts];

      if (status) {
        filteredPosts = filteredPosts.filter(p => p.status === status);
      }

      // Sort by createdAt descending
      filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Pagination
      const startIndex = (page - 1) * limit;
      const paginatedPosts = filteredPosts.slice(startIndex, startIndex + parseInt(limit));

      // Stats
      const stats = {
        total: blogPosts.length,
        published: blogPosts.filter(p => p.status === 'published').length,
        scheduled: blogPosts.filter(p => p.status === 'scheduled').length,
        draft: blogPosts.filter(p => p.status === 'draft').length
      };

      return res.status(200).json({
        success: true,
        posts: paginatedPosts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredPosts.length,
          totalPages: Math.ceil(filteredPosts.length / limit)
        },
        stats
      });
    }

    // Public access - only published posts
    let posts = getPublishedPosts();

    // Get by slug (public)
    if (slug) {
      const post = posts.find(p => p.slug === slug);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }
      // Increment view count
      const originalPost = blogPosts.find(p => p.slug === slug);
      if (originalPost) {
        originalPost.viewCount = (originalPost.viewCount || 0) + 1;
      }
      return res.status(200).json({ success: true, post });
    }

    // Filter by category
    if (category) {
      posts = posts.filter(p => p.category === category);
    }

    // Filter by tag
    if (tag) {
      posts = posts.filter(p => p.tags.includes(tag));
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.excerpt.toLowerCase().includes(searchLower) ||
        p.content.toLowerCase().includes(searchLower)
      );
    }

    // Featured only
    if (featured === 'true') {
      posts = posts.filter(p => p.featured);
    }

    // Sort by publishedAt descending
    posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedPosts = posts.slice(startIndex, startIndex + parseInt(limit));

    // Get featured post
    const featuredPost = posts.find(p => p.featured);

    // Get all categories with counts
    const categories = CATEGORIES.map(cat => ({
      name: cat,
      count: posts.filter(p => p.category === cat).length
    }));

    return res.status(200).json({
      success: true,
      posts: paginatedPosts,
      featuredPost,
      categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: posts.length,
        totalPages: Math.ceil(posts.length / limit)
      }
    });
  }

  // POST - Create new post (admin or AI)
  if (req.method === 'POST') {
    const user = await verifyAuth(req);
    const isAI = verifyAIKey(req);

    if (!user && !isAI) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      const {
        title,
        excerpt,
        content,
        category,
        tags = [],
        author,
        scheduledAt,
        featured = false,
        heroImage,
        seoTitle,
        seoDescription,
        status = 'draft'
      } = req.body;

      // Validation
      if (!title || !content || !category) {
        return res.status(400).json({
          success: false,
          message: 'Title, content, and category are required'
        });
      }

      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}`
        });
      }

      if (!POST_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${POST_STATUSES.join(', ')}`
        });
      }

      // Generate slug
      let slug = generateSlug(title);

      // Ensure unique slug
      let slugCounter = 1;
      let originalSlug = slug;
      while (blogPosts.some(p => p.slug === slug)) {
        slug = `${originalSlug}-${slugCounter}`;
        slugCounter++;
      }

      const now = new Date().toISOString();
      const newPost = {
        id: generateId(),
        slug,
        title,
        excerpt: excerpt || content.substring(0, 200).replace(/[#*`]/g, '') + '...',
        content,
        category,
        tags: Array.isArray(tags) ? tags : [],
        author: author || {
          name: isAI ? 'JASPER AI' : (user?.name || 'JASPER Team'),
          role: isAI ? 'AI Content Generator' : 'Financial Architecture'
        },
        publishedAt: status === 'published' ? now : null,
        scheduledAt: status === 'scheduled' ? scheduledAt : null,
        updatedAt: now,
        readTime: calculateReadTime(content),
        featured,
        heroImage: heroImage || null,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt || content.substring(0, 160),
        status,
        createdAt: now,
        createdBy: isAI ? 'ai' : (user?.email || 'admin'),
        viewCount: 0
      };

      blogPosts.unshift(newPost);

      return res.status(201).json({
        success: true,
        post: newPost,
        message: status === 'scheduled'
          ? `Post scheduled for ${new Date(scheduledAt).toLocaleString()}`
          : status === 'published'
          ? 'Post published successfully'
          : 'Draft saved successfully'
      });
    } catch (error) {
      console.error('Create post error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create post'
      });
    }
  }

  // PUT/PATCH - Update post (admin only)
  if (req.method === 'PUT' || req.method === 'PATCH') {
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      const { id } = req.query;
      const updates = req.body;

      if (!id) {
        return res.status(400).json({ success: false, message: 'Post ID is required' });
      }

      const postIndex = blogPosts.findIndex(p => p.id === id);
      if (postIndex === -1) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Validate status if provided
      if (updates.status && !POST_STATUSES.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${POST_STATUSES.join(', ')}`
        });
      }

      // Validate category if provided
      if (updates.category && !CATEGORIES.includes(updates.category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}`
        });
      }

      // Update slug if title changed
      if (updates.title && updates.title !== blogPosts[postIndex].title) {
        let newSlug = generateSlug(updates.title);
        let slugCounter = 1;
        let originalSlug = newSlug;
        while (blogPosts.some((p, i) => i !== postIndex && p.slug === newSlug)) {
          newSlug = `${originalSlug}-${slugCounter}`;
          slugCounter++;
        }
        updates.slug = newSlug;
      }

      // Calculate read time if content changed
      if (updates.content) {
        updates.readTime = calculateReadTime(updates.content);
      }

      // Set publishedAt if publishing
      if (updates.status === 'published' && blogPosts[postIndex].status !== 'published') {
        updates.publishedAt = new Date().toISOString();
      }

      // Update post
      blogPosts[postIndex] = {
        ...blogPosts[postIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        post: blogPosts[postIndex]
      });
    } catch (error) {
      console.error('Update post error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update post'
      });
    }
  }

  // DELETE - Delete post (admin only)
  if (req.method === 'DELETE') {
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, message: 'Post ID is required' });
      }

      const postIndex = blogPosts.findIndex(p => p.id === id);
      if (postIndex === -1) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      const deletedPost = blogPosts.splice(postIndex, 1)[0];

      return res.status(200).json({
        success: true,
        message: 'Post deleted',
        post: deletedPost
      });
    } catch (error) {
      console.error('Delete post error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete post'
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}

// Export for use in other modules
export { blogPosts, getPublishedPosts, processScheduledPosts, CATEGORIES };
