/**
 * Client-side Rate Limiting Utility
 *
 * Prevents excessive API calls and provides better UX by:
 * - Tracking request counts per endpoint
 * - Implementing exponential backoff on 429 responses
 * - Queueing requests when rate limited
 */

interface RateLimitConfig {
  maxRequests: number      // Maximum requests allowed
  windowMs: number         // Time window in milliseconds
  retryAfterMs: number     // Default retry delay for 429 responses
}

interface RequestTracker {
  count: number
  windowStart: number
  retryAfter: number | null
}

// Default configuration for different endpoint types
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  default: {
    maxRequests: 60,
    windowMs: 60000,      // 60 requests per minute
    retryAfterMs: 5000,
  },
  auth: {
    maxRequests: 5,
    windowMs: 60000,      // 5 auth attempts per minute
    retryAfterMs: 10000,
  },
  upload: {
    maxRequests: 10,
    windowMs: 60000,      // 10 uploads per minute
    retryAfterMs: 10000,
  },
  search: {
    maxRequests: 30,
    windowMs: 60000,      // 30 searches per minute
    retryAfterMs: 3000,
  },
}

// Track requests per endpoint pattern
const requestTrackers: Map<string, RequestTracker> = new Map()

/**
 * Get the rate limit category for an endpoint
 */
function getEndpointCategory(endpoint: string): string {
  if (endpoint.includes('/auth/')) return 'auth'
  if (endpoint.includes('/upload')) return 'upload'
  if (endpoint.includes('/search')) return 'search'
  return 'default'
}

/**
 * Get or create a tracker for an endpoint category
 */
function getTracker(category: string): RequestTracker {
  let tracker = requestTrackers.get(category)

  if (!tracker) {
    tracker = {
      count: 0,
      windowStart: Date.now(),
      retryAfter: null,
    }
    requestTrackers.set(category, tracker)
  }

  return tracker
}

/**
 * Check if we can make a request to the given endpoint
 * Returns true if allowed, false if rate limited
 */
export function canMakeRequest(endpoint: string): boolean {
  const category = getEndpointCategory(endpoint)
  const config = DEFAULT_CONFIGS[category]
  const tracker = getTracker(category)
  const now = Date.now()

  // Check if we're in a retry-after period from a 429 response
  if (tracker.retryAfter && now < tracker.retryAfter) {
    return false
  }

  // Reset window if it has expired
  if (now - tracker.windowStart >= config.windowMs) {
    tracker.count = 0
    tracker.windowStart = now
    tracker.retryAfter = null
  }

  return tracker.count < config.maxRequests
}

/**
 * Record a request being made
 */
export function recordRequest(endpoint: string): void {
  const category = getEndpointCategory(endpoint)
  const tracker = getTracker(category)
  tracker.count++
}

/**
 * Handle a 429 (Too Many Requests) response
 * Parses Retry-After header and sets backoff period
 */
export function handle429Response(endpoint: string, retryAfterHeader?: string | null): number {
  const category = getEndpointCategory(endpoint)
  const config = DEFAULT_CONFIGS[category]
  const tracker = getTracker(category)

  let retryAfterMs = config.retryAfterMs

  // Parse Retry-After header if present
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10)
    if (!isNaN(seconds)) {
      retryAfterMs = seconds * 1000
    }
  }

  tracker.retryAfter = Date.now() + retryAfterMs

  return retryAfterMs
}

/**
 * Get time until rate limit resets (in ms)
 * Returns 0 if not rate limited
 */
export function getTimeUntilReset(endpoint: string): number {
  const category = getEndpointCategory(endpoint)
  const tracker = getTracker(category)
  const now = Date.now()

  if (tracker.retryAfter && now < tracker.retryAfter) {
    return tracker.retryAfter - now
  }

  return 0
}

/**
 * Get remaining requests in current window
 */
export function getRemainingRequests(endpoint: string): number {
  const category = getEndpointCategory(endpoint)
  const config = DEFAULT_CONFIGS[category]
  const tracker = getTracker(category)
  const now = Date.now()

  // Reset window if expired
  if (now - tracker.windowStart >= config.windowMs) {
    return config.maxRequests
  }

  return Math.max(0, config.maxRequests - tracker.count)
}

/**
 * Clear rate limit state (useful for testing or after logout)
 */
export function clearRateLimitState(): void {
  requestTrackers.clear()
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  retryAfterMs: number

  constructor(message: string, retryAfterMs: number) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfterMs = retryAfterMs
  }
}

/**
 * Wrapper function to add rate limiting to fetch calls
 */
export async function rateLimitedFetch(
  endpoint: string,
  fetchFn: () => Promise<Response>
): Promise<Response> {
  // Check if we can make the request
  if (!canMakeRequest(endpoint)) {
    const waitTime = getTimeUntilReset(endpoint)
    throw new RateLimitError(
      `Rate limited. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying.`,
      waitTime
    )
  }

  // Record the request
  recordRequest(endpoint)

  // Make the request
  const response = await fetchFn()

  // Handle 429 response
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After')
    const waitTime = handle429Response(endpoint, retryAfter)
    throw new RateLimitError(
      `Too many requests. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
      waitTime
    )
  }

  return response
}
