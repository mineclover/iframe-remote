/**
 * Type definitions for DevTools metadata
 * Use these types to add type-safe __meta properties to your functions
 */

/**
 * Parameter type options - 핵심 타입만 정의
 */
export type ParamType =
  // 필수 기본 타입
  | 'string'     // 문자열 입력 (자동으로 늘어남, 3줄 이상 스크롤)
  | 'number'     // 숫자 입력 (스크롤로 조절 가능)
  | 'boolean'    // 체크박스
  | 'select'     // 드롭다운 (enum - 필수)
  | 'array'      // 배열 입력 (필수)

  // 특수 입력 위젯 (특색 명확)
  | 'color'      // 색상 선택기
  | 'time'       // 시간 선택기 (ISO format)
  | 'date'       // 날짜 선택기 (ISO format)
  | 'range'      // 슬라이더 (number와 다른 UX)

/**
 * Base parameter metadata
 */
export interface ParamMetaBase {
  /** Parameter name (must match function parameter) */
  name: string
  /** Parameter type - determines input widget */
  type?: ParamType
  /** Human-readable description */
  description?: string
  /** Default value */
  default?: any
  /** Whether this parameter is required */
  required?: boolean
}

/**
 * Number parameter metadata with constraints
 */
export interface NumberParamMeta extends ParamMetaBase {
  type: 'number'
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Step increment */
  step?: number
}

/**
 * Select parameter metadata with options
 */
export interface SelectParamMeta extends ParamMetaBase {
  type: 'select'
  /** Available options */
  options: string[] | number[] | { label: string; value: any }[]
}

/**
 * String parameter metadata
 */
export interface StringParamMeta extends ParamMetaBase {
  type: 'string'
  /** Pattern validation (regex) */
  pattern?: string
}

/**
 * Boolean parameter metadata
 */
export interface BooleanParamMeta extends ParamMetaBase {
  type: 'boolean'
}

/**
 * Color parameter metadata
 */
export interface ColorParamMeta extends ParamMetaBase {
  type: 'color'
}

/**
 * Range slider parameter metadata
 */
export interface RangeParamMeta extends ParamMetaBase {
  type: 'range'
  /** Minimum value */
  min: number
  /** Maximum value */
  max: number
  /** Step increment */
  step?: number
}

/**
 * Date parameter metadata
 */
export interface DateParamMeta extends ParamMetaBase {
  type: 'date'
  /** Minimum date (ISO format: YYYY-MM-DD) */
  min?: string
  /** Maximum date (ISO format: YYYY-MM-DD) */
  max?: string
}

/**
 * Time parameter metadata
 */
export interface TimeParamMeta extends ParamMetaBase {
  type: 'time'
  /** Minimum time (ISO format: HH:MM) */
  min?: string
  /** Maximum time (ISO format: HH:MM) */
  max?: string
}

/**
 * Array parameter metadata
 */
export interface ArrayParamMeta extends ParamMetaBase {
  type: 'array'
  /** Item type for array elements */
  itemType?: ParamType
}

/**
 * Union of all parameter metadata types
 */
export type ParamMeta =
  | ParamMetaBase
  | SelectParamMeta
  | NumberParamMeta
  | StringParamMeta
  | BooleanParamMeta
  | ArrayParamMeta
  | ColorParamMeta
  | TimeParamMeta
  | DateParamMeta
  | RangeParamMeta

/**
 * Function metadata
 */
export interface FunctionMeta {
  /** Human-readable description of what the function does */
  description?: string
  /** Parameter metadata array */
  params?: ParamMeta[]
  /** Return type description */
  returns?: {
    type?: string
    description?: string
  }
  /** Example usage */
  examples?: string[]
  /** Tags for categorization */
  tags?: string[]
  /** Whether this function is deprecated */
  deprecated?: boolean
  /** Deprecation message */
  deprecationMessage?: string
}

/**
 * Type augmentation for functions with metadata
 */
export interface FunctionWithMeta<T extends (...args: any[]) => any = any> {
  (...args: Parameters<T>): ReturnType<T>
  __meta?: FunctionMeta
}

/**
 * Helper to create type-safe function metadata
 */
export function createFunctionMeta(meta: FunctionMeta): FunctionMeta {
  return meta
}

/**
 * Helper to attach metadata to a function
 */
export function withMeta<T extends (...args: any[]) => any>(
  fn: T,
  meta: FunctionMeta
): FunctionWithMeta<T> {
  const fnWithMeta = fn as FunctionWithMeta<T>
  fnWithMeta.__meta = meta
  return fnWithMeta
}
