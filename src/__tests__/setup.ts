/**
 * Test setup for vitest
 */

// Mock window.postMessage for testing
Object.defineProperty(window, 'postMessage', {
  writable: true,
  value: vi.fn(),
})
