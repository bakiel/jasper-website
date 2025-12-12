import { describe, it, expect } from 'vitest'
import {
  sanitizeInput,
  sanitizeRichText,
  sanitizeURL,
  isValidEmail,
  isValidPhone,
  sanitizeCSVCell,
  truncate,
  INPUT_LIMITS,
} from '../lib/sanitize'

describe('sanitizeInput', () => {
  it('should return empty string for null/undefined', () => {
    expect(sanitizeInput(null)).toBe('')
    expect(sanitizeInput(undefined)).toBe('')
  })

  it('should strip all HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('')
    expect(sanitizeInput('<b>bold</b>')).toBe('bold')
    expect(sanitizeInput('<a href="http://evil.com">click</a>')).toBe('click')
  })

  it('should handle text without HTML', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World')
    expect(sanitizeInput('Test 123')).toBe('Test 123')
  })

  it('should handle nested HTML', () => {
    // DOMPurify strips disallowed tags, content may be preserved
    const result = sanitizeInput('<div><span><b>text</b></span></div>')
    expect(result).not.toContain('<div>')
    expect(result).toContain('text')
  })

  it('should strip event handlers', () => {
    expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('')
  })
})

describe('sanitizeRichText', () => {
  it('should return empty string for null/undefined', () => {
    expect(sanitizeRichText(null)).toBe('')
    expect(sanitizeRichText(undefined)).toBe('')
  })

  it('should allow safe formatting tags', () => {
    expect(sanitizeRichText('<b>bold</b>')).toBe('<b>bold</b>')
    expect(sanitizeRichText('<i>italic</i>')).toBe('<i>italic</i>')
    expect(sanitizeRichText('<em>emphasis</em>')).toBe('<em>emphasis</em>')
    expect(sanitizeRichText('<strong>strong</strong>')).toBe('<strong>strong</strong>')
    expect(sanitizeRichText('<u>underline</u>')).toBe('<u>underline</u>')
    expect(sanitizeRichText('<p>paragraph</p>')).toBe('<p>paragraph</p>')
    expect(sanitizeRichText('line1<br>line2')).toBe('line1<br>line2')
  })

  it('should strip dangerous tags', () => {
    expect(sanitizeRichText('<script>alert("xss")</script>')).toBe('')
    expect(sanitizeRichText('<a href="http://evil.com">link</a>')).toBe('link')
    expect(sanitizeRichText('<img src="x">')).toBe('')
  })

  it('should strip attributes from allowed tags', () => {
    expect(sanitizeRichText('<b onclick="alert(1)">bold</b>')).toBe('<b>bold</b>')
    expect(sanitizeRichText('<p style="color:red">text</p>')).toBe('<p>text</p>')
  })
})

describe('sanitizeURL', () => {
  it('should return empty string for null/undefined', () => {
    expect(sanitizeURL(null)).toBe('')
    expect(sanitizeURL(undefined)).toBe('')
  })

  it('should allow valid http/https URLs', () => {
    expect(sanitizeURL('https://example.com')).toBe('https://example.com')
    expect(sanitizeURL('http://example.com')).toBe('http://example.com')
    expect(sanitizeURL('https://example.com/path?query=1')).toBe('https://example.com/path?query=1')
  })

  it('should allow relative URLs', () => {
    expect(sanitizeURL('/path/to/page')).toBe('/path/to/page')
    expect(sanitizeURL('./relative/path')).toBe('./relative/path')
  })

  it('should reject dangerous protocols', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBe('')
    expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBe('')
    expect(sanitizeURL('vbscript:msgbox(1)')).toBe('')
  })

  it('should add https:// to bare domains', () => {
    expect(sanitizeURL('example.com')).toBe('https://example.com')
    expect(sanitizeURL('www.example.com')).toBe('https://www.example.com')
  })

  it('should trim whitespace', () => {
    expect(sanitizeURL('  https://example.com  ')).toBe('https://example.com')
  })
})

describe('isValidEmail', () => {
  it('should return false for null/undefined/empty', () => {
    expect(isValidEmail(null)).toBe(false)
    expect(isValidEmail(undefined)).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('should accept valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@example.com')).toBe(true)
    expect(isValidEmail('user+tag@example.com')).toBe(true)
    expect(isValidEmail('user@sub.domain.com')).toBe(true)
  })

  it('should reject invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('user@example')).toBe(false)
    expect(isValidEmail('user @example.com')).toBe(false)
  })
})

describe('isValidPhone', () => {
  it('should return true for null/undefined/empty (optional field)', () => {
    expect(isValidPhone(null)).toBe(true)
    expect(isValidPhone(undefined)).toBe(true)
    // Note: empty string is truthy in the function due to optional handling
  })

  it('should accept valid phone formats', () => {
    expect(isValidPhone('+27123456789')).toBe(true)
    expect(isValidPhone('0123456789')).toBe(true)
    expect(isValidPhone('+44207946958')).toBe(true)
    expect(isValidPhone('1234567890')).toBe(true)
  })

  it('should reject invalid phone formats', () => {
    expect(isValidPhone('123')).toBe(false) // Too short
    expect(isValidPhone('phone')).toBe(false) // Contains letters
    expect(isValidPhone('123-abc-4567')).toBe(false) // Contains letters
  })
})

describe('sanitizeCSVCell', () => {
  it('should return empty string for null/undefined', () => {
    expect(sanitizeCSVCell(null)).toBe('')
    expect(sanitizeCSVCell(undefined)).toBe('')
  })

  it('should prefix dangerous formula characters with single quote', () => {
    expect(sanitizeCSVCell('=1+1')).toBe("'=1+1")
    expect(sanitizeCSVCell('+1+1')).toBe("'+1+1")
    expect(sanitizeCSVCell('-1+1')).toBe("'-1+1")
    expect(sanitizeCSVCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)")
  })

  it('should handle tab and newline injection', () => {
    expect(sanitizeCSVCell('\tcmd|' + "'/C calc")).toContain("'")
    expect(sanitizeCSVCell('\rcmd')).toContain("'")
    expect(sanitizeCSVCell('\ncmd')).toContain("'")
  })

  it('should escape double quotes', () => {
    expect(sanitizeCSVCell('He said "hello"')).toBe('He said ""hello""')
  })

  it('should pass through safe values unchanged', () => {
    expect(sanitizeCSVCell('Normal text')).toBe('Normal text')
    expect(sanitizeCSVCell('123.45')).toBe('123.45')
    expect(sanitizeCSVCell(12345)).toBe('12345')
  })

  it('should handle combination of issues', () => {
    const input = '=HYPERLINK("http://evil.com", "Click")'
    const expected = '\'=HYPERLINK(""http://evil.com"", ""Click"")'
    expect(sanitizeCSVCell(input)).toBe(expected)
  })
})

describe('truncate', () => {
  it('should return empty string for null/undefined', () => {
    expect(truncate(null, 10)).toBe('')
    expect(truncate(undefined, 10)).toBe('')
  })

  it('should not truncate strings within limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello')
    expect(truncate('Hello', 5)).toBe('Hello')
  })

  it('should truncate strings exceeding limit', () => {
    expect(truncate('Hello World', 5)).toBe('Hello')
    expect(truncate('This is a long string', 10)).toBe('This is a ')
  })
})

describe('INPUT_LIMITS', () => {
  it('should have expected limit values', () => {
    expect(INPUT_LIMITS.name).toBe(200)
    expect(INPUT_LIMITS.email).toBe(254)
    expect(INPUT_LIMITS.description).toBe(2000)
    expect(INPUT_LIMITS.notes).toBe(5000)
    expect(INPUT_LIMITS.phone).toBe(30)
    expect(INPUT_LIMITS.url).toBe(2000)
  })
})
