/**
 * JASPER Blog Images API
 * Handles image generation and storage for blog posts
 * Supports: Unsplash (free), Pexels (free), Pixabay (free), and placeholder fallbacks
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

// Category to search term mapping for relevant images
const CATEGORY_KEYWORDS = {
  'DFI Insights': 'finance business office professional',
  'Financial Modelling': 'spreadsheet data analytics charts',
  'Sector Analysis': 'industry business growth',
  'Case Studies': 'success business teamwork',
  'Industry News': 'business news technology'
};

// Tag-based refinements
const TAG_KEYWORDS = {
  'renewable-energy': 'solar panels wind turbines green energy',
  'solar': 'solar farm photovoltaic',
  'wind': 'wind turbine farm',
  'data-centres': 'data center server room technology',
  'technology': 'technology digital innovation',
  'africa': 'africa business skyline',
  'south-africa': 'johannesburg cape town business',
  'idc': 'corporate finance meeting',
  'agriculture': 'farming agriculture green fields',
  'manufacturing': 'factory industrial production'
};

// Fetch from Unsplash
async function fetchUnsplashImage(query, orientation = 'landscape') {
  if (!UNSPLASH_ACCESS_KEY) {
    console.log('Unsplash API key not configured');
    return null;
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=5`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (!response.ok) {
      console.error('Unsplash API error:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      // Pick a random image from top 5
      const image = data.results[Math.floor(Math.random() * Math.min(5, data.results.length))];
      return {
        url: image.urls.regular,
        thumb: image.urls.thumb,
        credit: {
          name: image.user.name,
          link: image.user.links.html,
          source: 'Unsplash'
        },
        width: image.width,
        height: image.height,
        color: image.color
      };
    }
  } catch (error) {
    console.error('Unsplash fetch error:', error);
  }
  return null;
}

// Fetch from Pexels
async function fetchPexelsImage(query, orientation = 'landscape') {
  if (!PEXELS_API_KEY) {
    console.log('Pexels API key not configured');
    return null;
  }

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=5`;
    const response = await fetch(url, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });

    if (!response.ok) {
      console.error('Pexels API error:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[Math.floor(Math.random() * Math.min(5, data.photos.length))];
      return {
        url: photo.src.large2x,
        thumb: photo.src.medium,
        credit: {
          name: photo.photographer,
          link: photo.photographer_url,
          source: 'Pexels'
        },
        width: photo.width,
        height: photo.height,
        color: photo.avg_color
      };
    }
  } catch (error) {
    console.error('Pexels fetch error:', error);
  }
  return null;
}

// Fetch from Pixabay (no attribution required!)
async function fetchPixabayImage(query, orientation = 'horizontal') {
  if (!PIXABAY_API_KEY) {
    console.log('Pixabay API key not configured');
    return null;
  }

  try {
    const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&orientation=${orientation}&image_type=photo&per_page=5&safesearch=true`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Pixabay API error:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.hits && data.hits.length > 0) {
      const image = data.hits[Math.floor(Math.random() * Math.min(5, data.hits.length))];
      return {
        url: image.largeImageURL,
        thumb: image.previewURL,
        credit: {
          name: image.user,
          link: `https://pixabay.com/users/${image.user}-${image.user_id}/`,
          source: 'Pixabay'
        },
        width: image.imageWidth,
        height: image.imageHeight,
        // Pixabay doesn't require attribution but we include it anyway
        attributionRequired: false
      };
    }
  } catch (error) {
    console.error('Pixabay fetch error:', error);
  }
  return null;
}

// Generate placeholder gradient image URL (fallback)
function generatePlaceholderImage(title, category) {
  // Use a gradient placeholder service or generate SVG
  const colors = {
    'DFI Insights': ['0f2a3c', '10b981'],
    'Financial Modelling': ['1e3a5f', '3b82f6'],
    'Sector Analysis': ['0d4f3c', '22c55e'],
    'Case Studies': ['3730a3', '8b5cf6'],
    'Industry News': ['1f2937', '6b7280']
  };

  const [color1, color2] = colors[category] || ['0f2a3c', '10b981'];

  // Create an SVG placeholder with gradient
  const encodedTitle = encodeURIComponent(title.substring(0, 50));

  return {
    url: `https://via.placeholder.com/1200x630/${color1}/${color2}?text=${encodedTitle}`,
    thumb: `https://via.placeholder.com/400x210/${color1}/${color2}?text=${encodedTitle}`,
    credit: null,
    placeholder: true
  };
}

// Build search query from post metadata
function buildSearchQuery(title, category, tags = []) {
  const parts = [];

  // Add category keywords
  if (CATEGORY_KEYWORDS[category]) {
    parts.push(CATEGORY_KEYWORDS[category]);
  }

  // Add relevant tag keywords
  tags.forEach(tag => {
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, '-');
    if (TAG_KEYWORDS[normalizedTag]) {
      parts.push(TAG_KEYWORDS[normalizedTag]);
    }
  });

  // If we have enough keywords, use them; otherwise extract from title
  if (parts.length === 0) {
    // Extract key nouns from title
    const words = title.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4 && !['should', 'could', 'would', 'their', 'about', 'which', 'there'].includes(w));
    parts.push(words.slice(0, 3).join(' '));
  }

  return parts.join(' ').substring(0, 100);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-AI-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Search for images
  if (req.method === 'GET') {
    const { query, category, tags, source = 'auto' } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
    }

    let image = null;
    const searchQuery = buildSearchQuery(query, category, tags ? tags.split(',') : []);

    // Try sources based on preference
    if (source === 'auto' || source === 'unsplash') {
      image = await fetchUnsplashImage(searchQuery);
    }

    if (!image && (source === 'auto' || source === 'pexels')) {
      image = await fetchPexelsImage(searchQuery);
    }

    if (!image && (source === 'auto' || source === 'pixabay')) {
      image = await fetchPixabayImage(searchQuery);
    }

    // Fallback to placeholder
    if (!image) {
      image = generatePlaceholderImage(query, category);
    }

    return res.status(200).json({
      success: true,
      image,
      searchQuery
    });
  }

  // POST - Generate image for a blog post
  if (req.method === 'POST') {
    try {
      const { title, category, tags = [], preferredSource = 'auto' } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }

      const searchQuery = buildSearchQuery(title, category, tags);
      let image = null;

      // Try Unsplash first (higher quality)
      if (preferredSource === 'auto' || preferredSource === 'unsplash') {
        image = await fetchUnsplashImage(searchQuery);
      }

      // Try Pexels
      if (!image && (preferredSource === 'auto' || preferredSource === 'pexels')) {
        image = await fetchPexelsImage(searchQuery);
      }

      // Try Pixabay (no attribution required)
      if (!image && (preferredSource === 'auto' || preferredSource === 'pixabay')) {
        image = await fetchPixabayImage(searchQuery);
      }

      // Fallback to placeholder
      if (!image) {
        image = generatePlaceholderImage(title, category);
      }

      return res.status(200).json({
        success: true,
        image,
        searchQuery,
        message: image.placeholder
          ? 'Using placeholder image (configure API keys for stock photos)'
          : `Image sourced from ${image.credit?.source}`
      });

    } catch (error) {
      console.error('Image generation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate image'
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}

// Export functions for use in auto-post
export { fetchUnsplashImage, fetchPexelsImage, fetchPixabayImage, generatePlaceholderImage, buildSearchQuery };
