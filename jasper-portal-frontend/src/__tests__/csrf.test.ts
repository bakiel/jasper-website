import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCSRFToken,
  clearCSRFToken,
  getCSRFHeaders,
  requiresCSRFProtection,
  refreshCSRFToken,
} from '../lib/csrf'

describe('CSRF Protection', () => {
  beforeEach(() => {
    // Clear sessionStorage and cookies before each test
    sessionStorage.clear()
    document.cookie = 'csrf_token=; Max-Age=0'
  })

  describe('getCSRFToken', () => {
    it('should generate a token if none exists', () => {
      const token = getCSRFToken()
      expect(token).toBeTruthy()
      expect(token.length).toBe(64) // 32 bytes = 64 hex chars
    })

    it('should return the same token on subsequent calls', () => {
      const token1 = getCSRFToken()
      const token2 = getCSRFToken()
      expect(token1).toBe(token2)
    })

    it('should store token in sessionStorage', () => {
      const token = getCSRFToken()
      expect(sessionStorage.getItem('csrf_token')).toBe(token)
    })
  })

  describe('clearCSRFToken', () => {
    it('should remove token from sessionStorage', () => {
      getCSRFToken() // Generate a token first
      clearCSRFToken()
      expect(sessionStorage.getItem('csrf_token')).toBeNull()
    })
  })

  describe('getCSRFHeaders', () => {
    it('should return headers with CSRF token', () => {
      const headers = getCSRFHeaders()
      expect(headers['X-CSRF-Token']).toBeTruthy()
    })
  })

  describe('requiresCSRFProtection', () => {
    it('should return false for safe methods', () => {
      expect(requiresCSRFProtection('GET')).toBe(false)
      expect(requiresCSRFProtection('HEAD')).toBe(false)
      expect(requiresCSRFProtection('OPTIONS')).toBe(false)
      expect(requiresCSRFProtection('get')).toBe(false) // lowercase
    })

    it('should return true for unsafe methods', () => {
      expect(requiresCSRFProtection('POST')).toBe(true)
      expect(requiresCSRFProtection('PUT')).toBe(true)
      expect(requiresCSRFProtection('PATCH')).toBe(true)
      expect(requiresCSRFProtection('DELETE')).toBe(true)
      expect(requiresCSRFProtection('post')).toBe(true) // lowercase
    })
  })

  describe('refreshCSRFToken', () => {
    it('should generate a new token', () => {
      const token1 = getCSRFToken()
      const token2 = refreshCSRFToken()
      expect(token2).not.toBe(token1)
      expect(token2.length).toBe(64)
    })

    it('should update sessionStorage', () => {
      getCSRFToken()
      const newToken = refreshCSRFToken()
      expect(sessionStorage.getItem('csrf_token')).toBe(newToken)
    })
  })
})
