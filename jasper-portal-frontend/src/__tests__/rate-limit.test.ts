import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  canMakeRequest,
  recordRequest,
  handle429Response,
  getTimeUntilReset,
  getRemainingRequests,
  clearRateLimitState,
  RateLimitError,
} from '../lib/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    clearRateLimitState()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('canMakeRequest', () => {
    it('should allow requests when under limit', () => {
      expect(canMakeRequest('/api/test')).toBe(true)
    })

    it('should deny requests when limit exceeded', () => {
      // Default limit is 60 requests per minute
      for (let i = 0; i < 60; i++) {
        recordRequest('/api/test')
      }
      expect(canMakeRequest('/api/test')).toBe(false)
    })

    it('should reset after window expires', () => {
      // Exhaust the limit
      for (let i = 0; i < 60; i++) {
        recordRequest('/api/test')
      }
      expect(canMakeRequest('/api/test')).toBe(false)

      // Advance time past the window (60 seconds)
      vi.advanceTimersByTime(61000)

      expect(canMakeRequest('/api/test')).toBe(true)
    })

    it('should use different limits for auth endpoints', () => {
      // Auth limit is 5 requests per minute
      for (let i = 0; i < 5; i++) {
        recordRequest('/api/auth/login')
      }
      expect(canMakeRequest('/api/auth/login')).toBe(false)
    })
  })

  describe('handle429Response', () => {
    it('should set retry-after period', () => {
      handle429Response('/api/test', '10')
      expect(canMakeRequest('/api/test')).toBe(false)
    })

    it('should parse Retry-After header', () => {
      const waitTime = handle429Response('/api/test', '30')
      expect(waitTime).toBe(30000) // 30 seconds in ms
    })

    it('should use default retry time if no header', () => {
      const waitTime = handle429Response('/api/test', null)
      expect(waitTime).toBe(5000) // default 5 seconds
    })

    it('should allow requests after retry period', () => {
      handle429Response('/api/test', '5')
      expect(canMakeRequest('/api/test')).toBe(false)

      vi.advanceTimersByTime(6000)
      expect(canMakeRequest('/api/test')).toBe(true)
    })
  })

  describe('getTimeUntilReset', () => {
    it('should return 0 when not rate limited', () => {
      expect(getTimeUntilReset('/api/test')).toBe(0)
    })

    it('should return remaining time when rate limited', () => {
      handle429Response('/api/test', '10')
      const remaining = getTimeUntilReset('/api/test')
      expect(remaining).toBeGreaterThan(0)
      expect(remaining).toBeLessThanOrEqual(10000)
    })
  })

  describe('getRemainingRequests', () => {
    it('should return max requests when no requests made', () => {
      expect(getRemainingRequests('/api/test')).toBe(60)
    })

    it('should decrement as requests are made', () => {
      recordRequest('/api/test')
      expect(getRemainingRequests('/api/test')).toBe(59)

      recordRequest('/api/test')
      expect(getRemainingRequests('/api/test')).toBe(58)
    })

    it('should reset after window expires', () => {
      for (let i = 0; i < 30; i++) {
        recordRequest('/api/test')
      }
      expect(getRemainingRequests('/api/test')).toBe(30)

      vi.advanceTimersByTime(61000)
      expect(getRemainingRequests('/api/test')).toBe(60)
    })
  })

  describe('RateLimitError', () => {
    it('should have correct properties', () => {
      const error = new RateLimitError('Rate limited', 5000)
      expect(error.message).toBe('Rate limited')
      expect(error.retryAfterMs).toBe(5000)
      expect(error.name).toBe('RateLimitError')
    })

    it('should be an instance of Error', () => {
      const error = new RateLimitError('Test', 1000)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('clearRateLimitState', () => {
    it('should reset all trackers', () => {
      // Make some requests
      for (let i = 0; i < 30; i++) {
        recordRequest('/api/test')
      }
      expect(getRemainingRequests('/api/test')).toBe(30)

      clearRateLimitState()
      expect(getRemainingRequests('/api/test')).toBe(60)
    })
  })
})
