/**
 * JASPER Blog Auto-Post API
 * Endpoint for AI to automatically create and publish blog posts
 * Also handles processing of scheduled posts
 */
import { blogPosts, processScheduledPosts, CATEGORIES } from './posts.js';

const AI_API_KEY = process.env.BLOG_AI_API_KEY || 'jasper-ai-blog-key';

// Verify AI API key
function verifyAIKey(req) {
  const apiKey = req.headers['x-ai-api-key'];
  return apiKey === AI_API_KEY;
}

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

// Calculate read time
function calculateReadTime(content) {
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / 200);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-AI-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify AI API key for all requests
  if (!verifyAIKey(req)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing AI API key'
    });
  }

  // GET - Process scheduled posts (can be called by cron)
  if (req.method === 'GET') {
    const { action } = req.query;

    if (action === 'process-scheduled') {
      const publishedCount = processScheduledPosts();

      return res.status(200).json({
        success: true,
        message: `Processed scheduled posts`,
        publishedCount,
        timestamp: new Date().toISOString()
      });
    }

    // Return status
    const now = new Date();
    const scheduledPosts = blogPosts.filter(p => p.status === 'scheduled');
    const upcomingPosts = scheduledPosts.filter(p => new Date(p.scheduledAt) > now);
    const overdueScheduled = scheduledPosts.filter(p => new Date(p.scheduledAt) <= now);

    return res.status(200).json({
      success: true,
      status: {
        totalPosts: blogPosts.length,
        published: blogPosts.filter(p => p.status === 'published').length,
        scheduled: scheduledPosts.length,
        drafts: blogPosts.filter(p => p.status === 'draft').length,
        upcomingScheduled: upcomingPosts.length,
        overdueScheduled: overdueScheduled.length
      },
      upcomingPosts: upcomingPosts.map(p => ({
        id: p.id,
        title: p.title,
        scheduledAt: p.scheduledAt
      })),
      timestamp: new Date().toISOString()
    });
  }

  // POST - AI creates and publishes a new post
  if (req.method === 'POST') {
    try {
      const {
        title,
        excerpt,
        content,
        category,
        tags = [],
        scheduledAt,
        featured = false,
        seoTitle,
        seoDescription,
        publishImmediately = false
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

      // Generate unique slug
      let slug = generateSlug(title);
      let slugCounter = 1;
      let originalSlug = slug;
      while (blogPosts.some(p => p.slug === slug)) {
        slug = `${originalSlug}-${slugCounter}`;
        slugCounter++;
      }

      const now = new Date().toISOString();

      // Determine status
      let status = 'draft';
      let publishedAt = null;

      if (publishImmediately) {
        status = 'published';
        publishedAt = now;
      } else if (scheduledAt) {
        const scheduledDate = new Date(scheduledAt);
        if (scheduledDate <= new Date()) {
          // If scheduled time has passed, publish immediately
          status = 'published';
          publishedAt = now;
        } else {
          status = 'scheduled';
        }
      }

      const newPost = {
        id: generateId(),
        slug,
        title,
        excerpt: excerpt || content.substring(0, 200).replace(/[#*`]/g, '') + '...',
        content,
        category,
        tags: Array.isArray(tags) ? tags : [],
        author: {
          name: 'JASPER AI',
          role: 'AI Content Generator'
        },
        publishedAt,
        scheduledAt: status === 'scheduled' ? scheduledAt : null,
        updatedAt: now,
        readTime: calculateReadTime(content),
        featured,
        heroImage: null,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt || content.substring(0, 160),
        status,
        createdAt: now,
        createdBy: 'ai-auto-post',
        viewCount: 0
      };

      blogPosts.unshift(newPost);

      return res.status(201).json({
        success: true,
        post: {
          id: newPost.id,
          slug: newPost.slug,
          title: newPost.title,
          status: newPost.status,
          publishedAt: newPost.publishedAt,
          scheduledAt: newPost.scheduledAt
        },
        message: status === 'published'
          ? 'Post published successfully by AI'
          : status === 'scheduled'
          ? `Post scheduled for ${new Date(scheduledAt).toISOString()}`
          : 'Post saved as draft'
      });
    } catch (error) {
      console.error('AI auto-post error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create post'
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}
