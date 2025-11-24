/**
 * Tests for metadata validator
 */

import { describe, expect, it } from 'vitest'
import {
  assertValidFunctionMeta,
  assertValidParamMeta,
  isValidFunctionMeta,
  isValidParamMeta,
  validateFunctionMeta,
  validateParamMeta,
} from '../metadata-validator'

describe('metadata-validator', () => {
  describe('validateParamMeta', () => {
    it('should validate basic string parameter', () => {
      const result = validateParamMeta({
        name: 'text',
        type: 'string',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'text',
        type: 'string',
      })
    })

    it('should validate number parameter with min/max', () => {
      const result = validateParamMeta({
        name: 'count',
        type: 'number',
        min: 0,
        max: 100,
        step: 1,
      })

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        name: 'count',
        type: 'number',
        min: 0,
        max: 100,
      })
    })

    it('should fail when number min > max', () => {
      const result = validateParamMeta({
        name: 'count',
        type: 'number',
        min: 100,
        max: 0,
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should validate select parameter with string array', () => {
      const result = validateParamMeta({
        name: 'theme',
        type: 'select',
        options: ['light', 'dark', 'auto'],
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect((result.data as any).options).toEqual(['light', 'dark', 'auto'])
    })

    it('should validate select parameter with label-value pairs', () => {
      const result = validateParamMeta({
        name: 'status',
        type: 'select',
        options: [
          { label: 'Active', value: 1 },
          { label: 'Inactive', value: 0 },
        ],
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect((result.data as any).options).toHaveLength(2)
    })

    it('should fail when select has empty options', () => {
      const result = validateParamMeta({
        name: 'theme',
        type: 'select',
        options: [],
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should validate boolean parameter', () => {
      const result = validateParamMeta({
        name: 'isEnabled',
        type: 'boolean',
        default: true,
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.type).toBe('boolean')
    })

    it('should validate color parameter with valid hex', () => {
      const result = validateParamMeta({
        name: 'backgroundColor',
        type: 'color',
        default: '#667eea',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.default).toBe('#667eea')
    })

    it('should fail when color has invalid format', () => {
      const result = validateParamMeta({
        name: 'backgroundColor',
        type: 'color',
        default: '#fff',
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should validate range parameter', () => {
      const result = validateParamMeta({
        name: 'volume',
        type: 'range',
        min: 0,
        max: 100,
        step: 5,
      })

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        min: 0,
        max: 100,
        step: 5,
      })
    })

    it('should fail when range min >= max', () => {
      const result = validateParamMeta({
        name: 'volume',
        type: 'range',
        min: 100,
        max: 100,
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should validate date parameter with ISO format constraints', () => {
      const result = validateParamMeta({
        name: 'startDate',
        type: 'date',
        min: '2024-01-01',
        max: '2024-12-31',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect((result.data as any).min).toBe('2024-01-01')
    })

    it('should fail when date has invalid format', () => {
      const result = validateParamMeta({
        name: 'startDate',
        type: 'date',
        min: '01/01/2024',
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should validate time parameter with ISO format', () => {
      const result = validateParamMeta({
        name: 'startTime',
        type: 'time',
        min: '09:00',
        max: '17:00',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect((result.data as any).min).toBe('09:00')
    })

    it('should fail when time has invalid format', () => {
      const result = validateParamMeta({
        name: 'startTime',
        type: 'time',
        min: '9:00',
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should validate array parameter', () => {
      const result = validateParamMeta({
        name: 'items',
        type: 'array',
        itemType: 'string',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect((result.data as any).itemType).toBe('string')
    })

    it('should validate parameter without type', () => {
      const result = validateParamMeta({
        name: 'value',
        description: 'Some value',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.name).toBe('value')
    })

    it('should fail when name is missing', () => {
      const result = validateParamMeta({
        type: 'string',
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('validateFunctionMeta', () => {
    it('should validate function metadata with params', () => {
      const result = validateFunctionMeta({
        description: 'Test function',
        params: [
          { name: 'count', type: 'number', min: 0, max: 100 },
          { name: 'theme', type: 'select', options: ['light', 'dark'] },
        ],
        returns: {
          type: 'object',
          description: 'Result object',
        },
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.params).toHaveLength(2)
    })

    it('should validate function metadata without params', () => {
      const result = validateFunctionMeta({
        description: 'Simple function',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.description).toBe('Simple function')
    })

    it('should validate function metadata with examples and tags', () => {
      const result = validateFunctionMeta({
        description: 'API function',
        params: [{ name: 'id', type: 'number' }],
        examples: ['getUser(1)', 'getUser(42)'],
        tags: ['api', 'user'],
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.examples).toHaveLength(2)
      expect(result.data!.tags).toContain('api')
    })

    it('should validate deprecated function', () => {
      const result = validateFunctionMeta({
        description: 'Old function',
        deprecated: true,
        deprecationMessage: 'Use newFunction instead',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.deprecated).toBe(true)
      expect(result.data!.deprecationMessage).toBe('Use newFunction instead')
    })

    it('should fail when params are invalid', () => {
      const result = validateFunctionMeta({
        description: 'Test function',
        params: [
          { name: 'count', type: 'number', min: 100, max: 0 }, // Invalid: min > max
        ],
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('assertValidParamMeta', () => {
    it('should not throw for valid parameter', () => {
      expect(() => {
        assertValidParamMeta({
          name: 'test',
          type: 'string',
        })
      }).not.toThrow()
    })

    it('should throw for invalid parameter', () => {
      expect(() => {
        assertValidParamMeta({
          type: 'string',
          // missing name
        })
      }).toThrow()
    })
  })

  describe('assertValidFunctionMeta', () => {
    it('should not throw for valid metadata', () => {
      expect(() => {
        assertValidFunctionMeta({
          description: 'Test function',
          params: [{ name: 'value', type: 'string' }],
        })
      }).not.toThrow()
    })

    it('should throw for invalid metadata', () => {
      expect(() => {
        assertValidFunctionMeta({
          params: [
            { name: 'range', type: 'range', min: 100, max: 0 }, // Invalid
          ],
        })
      }).toThrow()
    })
  })

  describe('isValidParamMeta', () => {
    it('should return true for valid parameter', () => {
      expect(
        isValidParamMeta({
          name: 'test',
          type: 'boolean',
        }),
      ).toBe(true)
    })

    it('should return false for invalid parameter', () => {
      expect(
        isValidParamMeta({
          type: 'color',
          default: 'invalid',
        }),
      ).toBe(false)
    })
  })

  describe('isValidFunctionMeta', () => {
    it('should return true for valid metadata', () => {
      expect(
        isValidFunctionMeta({
          description: 'Test',
          params: [{ name: 'value', type: 'number' }],
        }),
      ).toBe(true)
    })

    it('should return false for invalid metadata', () => {
      expect(
        isValidFunctionMeta({
          params: [
            { name: 'color', type: 'color', default: '#fff' }, // Invalid hex
          ],
        }),
      ).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle number with only min', () => {
      const result = validateParamMeta({
        name: 'count',
        type: 'number',
        min: 0,
      })

      expect(result.success).toBe(true)
    })

    it('should handle number with only max', () => {
      const result = validateParamMeta({
        name: 'count',
        type: 'number',
        max: 100,
      })

      expect(result.success).toBe(true)
    })

    it('should validate select with number options', () => {
      const result = validateParamMeta({
        name: 'priority',
        type: 'select',
        options: [1, 2, 3, 4, 5],
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect((result.data as any).options).toEqual([1, 2, 3, 4, 5])
    })

    it('should handle optional fields', () => {
      const result = validateParamMeta({
        name: 'value',
        type: 'string',
        description: 'A value',
        default: 'test',
        required: false,
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.required).toBe(false)
    })

    it('should validate empty function metadata', () => {
      const result = validateFunctionMeta({})

      expect(result.success).toBe(true)
    })
  })
})
