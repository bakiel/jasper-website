/**
 * XSS Sanitization Utilities
 * Uses DOMPurify to sanitize user-generated content
 */

import DOMPurify, { Config } from 'dompurify'

// Configure DOMPurify for stricter sanitization
const purifyConfig: Config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span'],
  ALLOWED_ATTR: ['href', 'title', 'class'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Untrusted HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: strip all HTML tags
    return dirty.replace(/<[^>]*>/g, '')
  }
  return DOMPurify.sanitize(dirty, purifyConfig)
}

/**
 * Sanitize plain text (removes all HTML)
 * @param dirty - Untrusted text string
 * @returns Plain text with all HTML removed
 */
export function sanitizeText(dirty: string): string {
  if (typeof window === 'undefined') {
    return dirty.replace(/<[^>]*>/g, '')
  }
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] })
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * @param url - Untrusted URL string
 * @returns Safe URL or empty string
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  const trimmed = url.trim().toLowerCase()

  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return ''
  }

  // Allow safe protocols
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/')
  ) {
    return url
  }

  // Default: assume relative URL
  return url
}

/**
 * Escape HTML entities for safe display
 * @param text - Text to escape
 * @returns Escaped text
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
