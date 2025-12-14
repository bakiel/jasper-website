/**
 * JASPER Blog Comments API
 * Handles comment submission and moderation
 */
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.SECRET_KEY || 'jasper-default-secret-key-change-in-production';

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

// In-memory store (use PostgreSQL in production)
let comments = [];

// Generate comment ID
function generateId() {
  return `comment-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
}

// Simple spam detection
function isSpam(content, email) {
  const spamPatterns = [
    /\b(viagra|casino|lottery|prize|winner|click here|free money|earn money fast)\b/i,
    /http[s]?:\/\/[^\s]+\.(ru|cn|tk|ga|ml)\//i, // Suspicious TLDs
    /<[^>]+>/g // HTML tags
  ];

  const contentLower = content.toLowerCase();

  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return true;
    }
  }

  // Too many URLs
  const urlCount = (content.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) {
    return true;
  }

  return false;
}

// Sanitize content
function sanitizeContent(content) {
  return content
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 2000); // Max 2000 chars
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Get comments (public: approved only, admin: all)
  if (req.method === 'GET') {
    const { postSlug, admin, page = 1, limit = 20 } = req.query;

    if (!postSlug) {
      return res.status(400).json({
        success: false,
        message: 'Post slug is required'
      });
    }

    // Admin mode requires authentication
    if (admin === 'true') {
      const user = await verifyAuth(req);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required for admin access'
        });
      }

      // Get all comments for post (including unapproved)
      let postComments = comments.filter(c => c.postSlug === postSlug);

      // Sort by createdAt descending
      postComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Pagination
      const startIndex = (page - 1) * limit;
      const paginatedComments = postComments.slice(startIndex, startIndex + parseInt(limit));

      // Stats
      const stats = {
        total: postComments.length,
        approved: postComments.filter(c => c.approved).length,
        pending: postComments.filter(c => !c.approved).length,
        flagged: postComments.filter(c => c.flagged).length
      };

      return res.status(200).json({
        success: true,
        comments: paginatedComments,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: postComments.length,
          totalPages: Math.ceil(postComments.length / limit)
        }
      });
    }

    // Public: only approved comments
    let approvedComments = comments.filter(c => c.postSlug === postSlug && c.approved);

    // Sort by createdAt ascending (oldest first for conversation flow)
    approvedComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return res.status(200).json({
      success: true,
      comments: approvedComments,
      count: approvedComments.length
    });
  }

  // POST - Submit new comment (public)
  if (req.method === 'POST') {
    try {
      const { postSlug, author, email, content, parentId } = req.body;

      // Validation
      if (!postSlug || !author || !email || !content) {
        return res.status(400).json({
          success: false,
          message: 'Post slug, author, email, and content are required'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address'
        });
      }

      // Author name validation
      if (author.length < 2 || author.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Author name must be between 2 and 100 characters'
        });
      }

      // Content validation
      if (content.length < 5 || content.length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Comment must be between 5 and 2000 characters'
        });
      }

      // Sanitize content
      const sanitizedContent = sanitizeContent(content);

      // Spam check
      const flagged = isSpam(sanitizedContent, email);

      // Rate limiting check (simple: max 5 comments per email in last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentComments = comments.filter(
        c => c.email.toLowerCase() === email.toLowerCase() &&
        new Date(c.createdAt) > oneHourAgo
      );
      if (recentComments.length >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many comments. Please wait before posting again.'
        });
      }

      const newComment = {
        id: generateId(),
        postSlug,
        author: author.trim().substring(0, 100),
        email: email.toLowerCase().trim(),
        content: sanitizedContent,
        parentId: parentId || null,
        approved: !flagged, // Auto-approve if not flagged
        flagged,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      };

      comments.push(newComment);

      return res.status(201).json({
        success: true,
        comment: {
          id: newComment.id,
          author: newComment.author,
          content: newComment.content,
          createdAt: newComment.createdAt,
          approved: newComment.approved
        },
        message: newComment.approved
          ? 'Comment posted successfully'
          : 'Comment submitted for moderation'
      });
    } catch (error) {
      console.error('Create comment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit comment'
      });
    }
  }

  // PUT/PATCH - Moderate comment (admin only)
  if (req.method === 'PUT' || req.method === 'PATCH') {
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      const { id, action } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Comment ID is required'
        });
      }

      const commentIndex = comments.findIndex(c => c.id === id);
      if (commentIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Handle moderation actions
      switch (action) {
        case 'approve':
          comments[commentIndex].approved = true;
          comments[commentIndex].flagged = false;
          break;
        case 'reject':
          comments[commentIndex].approved = false;
          break;
        case 'flag':
          comments[commentIndex].flagged = true;
          comments[commentIndex].approved = false;
          break;
        default:
          // Allow direct updates
          const updates = req.body;
          comments[commentIndex] = {
            ...comments[commentIndex],
            ...updates,
            updatedAt: new Date().toISOString()
          };
      }

      comments[commentIndex].updatedAt = new Date().toISOString();
      comments[commentIndex].moderatedBy = user.email;
      comments[commentIndex].moderatedAt = new Date().toISOString();

      return res.status(200).json({
        success: true,
        comment: comments[commentIndex]
      });
    } catch (error) {
      console.error('Moderate comment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to moderate comment'
      });
    }
  }

  // DELETE - Delete comment (admin only)
  if (req.method === 'DELETE') {
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Comment ID is required'
        });
      }

      const commentIndex = comments.findIndex(c => c.id === id);
      if (commentIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      const deletedComment = comments.splice(commentIndex, 1)[0];

      return res.status(200).json({
        success: true,
        message: 'Comment deleted',
        comment: deletedComment
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete comment'
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}

// Export for use in other modules
export { comments };
