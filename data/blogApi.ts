/**
 * Blog API Client
 * Fetches posts from the live Blog API and merges with static data
 */

import { BlogPost, BLOG_POSTS, getPublishedPosts as getStaticPublishedPosts } from './blog';

const BLOG_API_URL = 'https://api.jasperfinance.org/api/v1/blog';

/**
 * Fetch posts from the live Blog API
 * API returns an array of posts directly: [{...}, {...}]
 */
export async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${BLOG_API_URL}/posts`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Don't cache - always get fresh data
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Blog API returned ${response.status}, falling back to static data`);
      return [];
    }

    const data = await response.json();

    // API returns array directly, not wrapped in { success, posts }
    if (Array.isArray(data)) {
      return data as BlogPost[];
    }

    // Fallback for legacy format
    if (data.success && Array.isArray(data.posts)) {
      return data.posts;
    }

    return [];
  } catch (error) {
    console.warn('Failed to fetch from Blog API, using static data:', error);
    return [];
  }
}

/**
 * Get all published posts - merges API posts with static posts
 * API posts take precedence (by slug) for updates
 */
export async function getPublishedPostsAsync(): Promise<BlogPost[]> {
  const [apiPosts, staticPosts] = await Promise.all([
    fetchBlogPosts(),
    Promise.resolve(getStaticPublishedPosts()),
  ]);

  // Create a map of posts by slug, with API posts taking precedence
  const postsMap = new Map<string, BlogPost>();

  // Add static posts first
  for (const post of staticPosts) {
    postsMap.set(post.slug, post);
  }

  // Override/add with API posts (more recent data)
  for (const post of apiPosts) {
    if (post.status === 'published') {
      postsMap.set(post.slug, post);
    }
  }

  // Convert back to array and sort by publishedAt (newest first)
  const allPosts = Array.from(postsMap.values());
  return allPosts.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/**
 * Get featured post - checks API first, then static
 */
export async function getFeaturedPostAsync(): Promise<BlogPost | undefined> {
  const posts = await getPublishedPostsAsync();
  return posts.find(post => post.featured);
}

/**
 * Get all categories from combined posts
 */
export async function getAllCategoriesAsync(): Promise<BlogPost['category'][]> {
  const posts = await getPublishedPostsAsync();
  const categories = [...new Set(posts.map(post => post.category))];
  return categories;
}

/**
 * Get post by slug from combined sources
 */
export async function getPostBySlugAsync(slug: string): Promise<BlogPost | undefined> {
  const posts = await getPublishedPostsAsync();
  return posts.find(post => post.slug === slug);
}

/**
 * Get recent posts
 */
export async function getRecentPostsAsync(limit: number = 3): Promise<BlogPost[]> {
  const posts = await getPublishedPostsAsync();
  return posts.slice(0, limit);
}

/**
 * Get related posts by category
 */
export async function getRelatedPostsAsync(currentSlug: string, limit: number = 3): Promise<BlogPost[]> {
  const posts = await getPublishedPostsAsync();
  const currentPost = posts.find(p => p.slug === currentSlug);

  if (!currentPost) return posts.slice(0, limit);

  // Find posts in same category, excluding current
  const related = posts
    .filter(p => p.slug !== currentSlug && p.category === currentPost.category)
    .slice(0, limit);

  // If not enough related posts, fill with other posts
  if (related.length < limit) {
    const others = posts
      .filter(p => p.slug !== currentSlug && !related.includes(p))
      .slice(0, limit - related.length);
    return [...related, ...others];
  }

  return related;
}
