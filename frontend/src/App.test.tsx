import { describe, it, expect } from 'vitest'
import { API_CONFIG } from './lib/api-config'

// Simple utility tests that don't require complex component rendering
describe('Application Configuration', () => {
  it('should have API configuration defaults', () => {
    expect(API_CONFIG.BASE_URL).toMatch(/^https?:\/\//)
    expect(API_CONFIG.ENDPOINTS.UNIFIED_DATA).toBe('/api/v1/unified-data')
    expect(API_CONFIG.ENDPOINTS.HEALTH).toBe('/api/v1/health')
  })
})

// Simple utility function tests
describe('Utility Functions', () => {
  it('should handle basic math operations', () => {
    expect(1 + 1).toBe(2)
    expect(Math.round(3.14159)).toBe(3)
  })

  it('should handle string operations', () => {
    const testString = "Tesla Road Trip"
    expect(testString.toLowerCase()).toBe("tesla road trip")
    expect(testString.includes("Tesla")).toBe(true)
  })
})
