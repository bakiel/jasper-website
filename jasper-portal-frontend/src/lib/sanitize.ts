import DOMPurify from 'dompurify'

/**
 * Sanitize user input to prevent XSS attacks
 * Strips all HTML tags and attributes
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return ''

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  })
}

/**
 * Sanitize HTML content but allow safe formatting tags
 * Use for rich text content that needs basic formatting
 */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return ''

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    ALLOWED_ATTR: [],
  })
}

/**
 * Validate and sanitize URL
 * Only allows http and https protocols
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (!url) return ''

  const trimmed = url.trim()

  // Only allow http and https protocols
  try {
    const parsed = new URL(trimmed)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }
    return trimmed
  } catch {
    // If URL parsing fails, check if it's a relative URL or missing protocol
    if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
      return trimmed
    }
    // Try adding https://
    try {
      const withProtocol = 'https://' + trimmed
      new URL(withProtocol)
      return withProtocol
    } catch {
      return ''
    }
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email.trim())
}

/**
 * Validate phone number format (basic validation)
 * Allows digits, spaces, dashes, parentheses, and + prefix
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return true // Phone is often optional

  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/
  return phoneRegex.test(phone.trim()) && phone.replace(/\D/g, '').length >= 7
}

/**
 * Sanitize CSV cell to prevent formula injection
 */
export function sanitizeCSVCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''

  const stringValue = String(value)

  // Dangerous formula prefixes that could execute code in Excel/Sheets
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r', '\n']

  let sanitized = stringValue

  // If starts with dangerous character, prefix with single quote
  if (dangerousPrefixes.some(prefix => sanitized.startsWith(prefix))) {
    sanitized = "'" + sanitized
  }

  // Escape double quotes
  sanitized = sanitized.replace(/"/g, '""')

  return sanitized
}

/**
 * Input length limits for different field types
 */
export const INPUT_LIMITS = {
  name: 200,
  title: 200,
  description: 2000,
  notes: 5000,
  email: 254,
  phone: 30,
  url: 2000,
  address: 500,
  shortText: 100,
  mediumText: 500,
  longText: 2000,
}

/**
 * Truncate string to max length
 */
export function truncate(input: string | null | undefined, maxLength: number): string {
  if (!input) return ''
  return input.length > maxLength ? input.substring(0, maxLength) : input
}
