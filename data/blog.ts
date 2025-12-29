/**
 * JASPER Insights Blog Types
 * All content fetched dynamically from API - no hardcoded articles
 *
 * API Endpoint: https://api.jasperfinance.org/api/v1/blog/posts
 */

export interface BlogAuthor {
  name: string;
  role: string;
  avatar?: string;
}

export type PostStatus = 'draft' | 'scheduled' | 'published';

// Content block types for structured article content
export interface ContentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'image' | 'gallery' | 'quote' | 'callout' | 'list' | 'divider' | 'infographic' | 'table';
  content?: string;
  level?: number;
  image_url?: string;
  alt_text?: string;
  caption?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  alignment?: 'left' | 'center' | 'right';
  images?: Array<{
    id?: string;
    url: string;
    alt?: string;
    caption?: string;
  }>;
  columns?: number;
  style?: 'info' | 'warning' | 'success' | 'tip';
  items?: string[];
  listType?: 'bullet' | 'numbered' | 'checklist';
  attribution?: string;
  rows?: string[][];
  headers?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  content_blocks?: ContentBlock[];  // Structured block content
  category: 'DFI Insights' | 'Financial Modelling' | 'Sector Analysis' | 'Case Studies' | 'Industry News' | 'Climate Finance';
  tags: string[];
  author: BlogAuthor;
  publishedAt: string;
  scheduledAt?: string;
  updatedAt?: string;
  readTime: number;
  featured?: boolean;
  heroImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  status: PostStatus;
  seo?: {
    title?: string;
    description?: string;
    score?: number;
    keywords?: string[];
  };
}

export interface Comment {
  id: string;
  postSlug: string;
  author: string;
  email: string;
  content: string;
  createdAt: string;
  approved: boolean;
}

// NO HARDCODED ARTICLES - All content from API
export const BLOG_POSTS: BlogPost[] = [];

// Blog metadata
export const BLOG_METADATA = {
  title: 'JASPER Insights',
  description: 'Expert insights on DFI funding, financial modelling, and African infrastructure investment',
  categories: ['DFI Insights', 'Financial Modelling', 'Sector Analysis', 'Case Studies', 'Industry News', 'Climate Finance'] as const,
  defaultAuthor: {
    name: 'JASPER Research Team',
    role: 'Content Team'
  }
};

// Helper functions (work with empty array, API data comes via blogApi.ts)
export const getPublishedPosts = (): BlogPost[] => {
  return BLOG_POSTS.filter(post => post.status === 'published')
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
};

export const getFeaturedPost = (): BlogPost | undefined => {
  return getPublishedPosts().find(post => post.featured);
};

export const getAllCategories = (): BlogPost['category'][] => {
  return BLOG_METADATA.categories as unknown as BlogPost['category'][];
};

export const getPostBySlug = (slug: string): BlogPost | undefined => {
  return BLOG_POSTS.find(post => post.slug === slug);
};

export const getRelatedPosts = (currentSlug: string, limit = 3): BlogPost[] => {
  const currentPost = getPostBySlug(currentSlug);
  if (!currentPost) return getPublishedPosts().slice(0, limit);

  return getPublishedPosts()
    .filter(post => post.slug !== currentSlug && post.category === currentPost.category)
    .slice(0, limit);
};

export const getPostsByCategory = (category: BlogPost['category']): BlogPost[] => {
  return getPublishedPosts().filter(post => post.category === category);
};

export const searchPosts = (query: string): BlogPost[] => {
  const normalizedQuery = query.toLowerCase();
  return getPublishedPosts().filter(post =>
    post.title.toLowerCase().includes(normalizedQuery) ||
    post.excerpt.toLowerCase().includes(normalizedQuery) ||
    post.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
  );
};
