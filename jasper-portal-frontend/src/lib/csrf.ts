/**
 * CSRF Protection Utility
 *
 * Implements double-submit cookie pattern for CSRF protection.
 * - Generates a random token stored in both a cookie and sent in request headers
 * - Server validates that both values match
 */

const CSRF_TOKEN_KEY = 'csrf_token'
const CSRF_HEADER_NAME = 'X-CSRF-Token'
const CSRF_COOKIE_NAME = 'csrf_token'

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Get or create CSRF token
 * Uses sessionStorage for the token value and sets a matching cookie
 */
export function getCSRFToken(): string {
  if (typeof window === 'undefined') return ''

  // Check if we already have a token in sessionStorage
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY)

  if (!token) {
    // Generate new token
    token = generateToken()
    sessionStorage.setItem(CSRF_TOKEN_KEY, token)
  }

  // Ensure cookie is set (for double-submit validation)
  setCSRFCookie(token)

  return token
}

/**
 * Set CSRF token cookie
 * Cookie is HttpOnly: false so JavaScript can read it for validation
 * SameSite: Strict to prevent CSRF from other sites
 */
function setCSRFCookie(token: string): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict${secure}`
}

/**
 * Clear CSRF token (call on logout)
 */
export function clearCSRFToken(): void {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem(CSRF_TOKEN_KEY)
  document.cookie = `${CSRF_COOKIE_NAME}=; Path=/; Max-Age=0`
}

/**
 * Get CSRF headers to include in requests
 */
export function getCSRFHeaders(): Record<string, string> {
  const token = getCSRFToken()
  return token ? { [CSRF_HEADER_NAME]: token } : {}
}

/**
 * Check if a request method requires CSRF protection
 */
export function requiresCSRFProtection(method: string): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  return !safeMethods.includes(method.toUpperCase())
}

/**
 * Refresh CSRF token (call periodically or after sensitive operations)
 */
export function refreshCSRFToken(): string {
  if (typeof window === 'undefined') return ''

  const newToken = generateToken()
  sessionStorage.setItem(CSRF_TOKEN_KEY, newToken)
  setCSRFCookie(newToken)

  return newToken
}
