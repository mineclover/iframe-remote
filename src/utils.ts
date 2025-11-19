/**
 * Shared utility functions
 */

/**
 * Generate unique ID for messages and RPC calls
 * Format: timestamp-randomString
 */
export function generateId(prefix?: string): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  return prefix ? `${prefix}-${id}` : id
}
