/**
 * Runtime schema validator for metadata using Zod
 */

import { z } from 'zod'

// Parameter type enum
export const ParamTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'select',
  'array',
  'color',
  'time',
  'date',
  'range',
])

// Base parameter metadata schema
const ParamMetaBaseSchema = z.object({
  name: z.string().min(1, 'Parameter name is required'),
  type: ParamTypeSchema.optional(),
  description: z.string().optional(),
  default: z.any().optional(),
  required: z.boolean().optional(),
})

// Number parameter schema
const NumberParamMetaSchema = ParamMetaBaseSchema.extend({
  type: z.literal('number'),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
}).refine(
  (data) => {
    if (data.min !== undefined && data.max !== undefined) {
      return data.min <= data.max
    }
    return true
  },
  {
    message: 'min must be less than or equal to max',
  }
)

// Select parameter schema
const SelectParamMetaSchema = ParamMetaBaseSchema.extend({
  type: z.literal('select'),
  options: z
    .union([
      z.array(z.string()).min(1, 'At least one option is required'),
      z.array(z.number()).min(1, 'At least one option is required'),
      z
        .array(
          z.object({
            label: z.string(),
            value: z.any(),
          })
        )
        .min(1, 'At least one option is required'),
    ])
    .refine((opts) => opts.length > 0, 'Options array cannot be empty'),
})

// String parameter schema
const StringParamMetaSchema = ParamMetaBaseSchema.extend({
  type: z.literal('string'),
  pattern: z.string().optional(),
})

// Boolean parameter schema
const BooleanParamMetaSchema = ParamMetaBaseSchema.extend({
  type: z.literal('boolean'),
})

// Color parameter schema
const ColorParamMetaSchema = ParamMetaBaseSchema.extend({
  type: z.literal('color'),
  default: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be in hex format (#RRGGBB)')
    .optional(),
})

// Range parameter schema
const RangeParamMetaSchema = ParamMetaBaseSchema.extend({
  type: z.literal('range'),
  min: z.number(),
  max: z.number(),
  step: z.number().positive().optional(),
}).refine((data) => data.min < data.max, {
  message: 'min must be less than max for range',
})

// Date parameter schema
const DateParamMetaSchema = ParamMetaBaseSchema.extend({
  type: z.literal('date'),
  min: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in ISO format (YYYY-MM-DD)')
    .optional(),
  max: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in ISO format (YYYY-MM-DD)')
    .optional(),
})

// Time parameter schema
const TimeParamMetaSchema = ParamMetaBaseSchema.extend({
  type: z.literal('time'),
  min: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be in ISO format (HH:MM)')
    .optional(),
  max: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be in ISO format (HH:MM)')
    .optional(),
})

// Array parameter schema
const ArrayParamMetaSchema = ParamMetaBaseSchema.extend({
  type: z.literal('array'),
  itemType: ParamTypeSchema.optional(),
})

// Union of all parameter schemas
export const ParamMetaSchema = z.discriminatedUnion('type', [
  NumberParamMetaSchema,
  SelectParamMetaSchema,
  StringParamMetaSchema,
  BooleanParamMetaSchema,
  ColorParamMetaSchema,
  RangeParamMetaSchema,
  DateParamMetaSchema,
  TimeParamMetaSchema,
  ArrayParamMetaSchema,
  ParamMetaBaseSchema.extend({ type: z.undefined() }), // No type specified
])

// Function metadata schema
export const FunctionMetaSchema = z.object({
  description: z.string().optional(),
  params: z.array(ParamMetaSchema).optional(),
  returns: z
    .object({
      type: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  examples: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  deprecated: z.boolean().optional(),
  deprecationMessage: z.string().optional(),
})

/**
 * Validate parameter metadata
 */
export function validateParamMeta(param: unknown): {
  success: boolean
  data?: any
  errors?: string[]
} {
  try {
    const result = ParamMetaSchema.safeParse(param)
    if (result.success) {
      return { success: true, data: result.data }
    }
    return {
      success: false,
      errors: result.error?.errors?.map((e) => `${e.path.join('.')}: ${e.message}`) || ['Validation error'],
    }
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
    }
  }
}

/**
 * Validate function metadata
 */
export function validateFunctionMeta(meta: unknown): {
  success: boolean
  data?: any
  errors?: string[]
} {
  try {
    const result = FunctionMetaSchema.safeParse(meta)
    if (result.success) {
      return { success: true, data: result.data }
    }
    return {
      success: false,
      errors: result.error?.errors?.map((e) => `${e.path.join('.')}: ${e.message}`) || ['Validation error'],
    }
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
    }
  }
}

/**
 * Assert valid parameter metadata (throws on error)
 */
export function assertValidParamMeta(param: unknown): asserts param is z.infer<
  typeof ParamMetaSchema
> {
  ParamMetaSchema.parse(param)
}

/**
 * Assert valid function metadata (throws on error)
 */
export function assertValidFunctionMeta(
  meta: unknown
): asserts meta is z.infer<typeof FunctionMetaSchema> {
  FunctionMetaSchema.parse(meta)
}

/**
 * Type guard for parameter metadata
 */
export function isValidParamMeta(param: unknown): param is z.infer<
  typeof ParamMetaSchema
> {
  return ParamMetaSchema.safeParse(param).success
}

/**
 * Type guard for function metadata
 */
export function isValidFunctionMeta(meta: unknown): meta is z.infer<
  typeof FunctionMetaSchema
> {
  return FunctionMetaSchema.safeParse(meta).success
}
