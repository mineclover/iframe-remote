/**
 * DevTools utilities for remote function execution
 * Automatically discovers and exposes window functions based on naming patterns
 */

import type { DevToolsConfig, FunctionMetadata, ParamMetadata } from '@packages/iframe-action-types'
import { ChildRPC, ParentRPC } from './rpc'
import type { CommunicatorOptions } from './types'
import type { API } from './types-rpc'

// DevTools API definition
interface DevToolsChildAPI extends API {
  __devtools_list: () => FunctionInfo[]
  __devtools_call: (name: string, ...args: unknown[]) => Promise<unknown>
  __devtools_refresh: () => FunctionInfo[]
  __devtools_get_config: () => DevToolsConfig | null
}

interface DevToolsParentAPI extends API {
  [method: string]: (...args: unknown[]) => unknown
}

export interface DevToolsOptions extends CommunicatorOptions {
  /** Pattern to match function names (default: starts with '__') */
  functionPattern?: RegExp | ((name: string) => boolean)
  /** Include properties from window object */
  includeWindowProps?: boolean
}

export interface FunctionInfo {
  name: string
  type: 'function' | 'asyncFunction'
  params: ParamMetadata[]
  paramCount: number
  description?: string
  returns?: string
  examples?: string[]
}

/**
 * Child-side DevTools
 * Automatically exposes window functions matching the pattern
 */
export class ChildDevTools {
  private rpc: ChildRPC<DevToolsParentAPI, DevToolsChildAPI>
  private exposedFunctions: Map<string, (...args: never[]) => unknown> = new Map()
  private options: DevToolsOptions

  constructor(options: DevToolsOptions = {}) {
    this.options = {
      functionPattern: /^__/,
      includeWindowProps: true,
      ...options,
    }

    this.rpc = new ChildRPC<DevToolsParentAPI, DevToolsChildAPI>({
      ...options,
    })

    // Register DevTools methods
    this.rpc.register('__devtools_list', () => this.listFunctions())
    this.rpc.register('__devtools_call', (name: string, ...args: unknown[]) => this.callFunction(name, args))
    this.rpc.register('__devtools_refresh', () => this.refreshFunctions())
    this.rpc.register('__devtools_get_config', () => this.getConfig())

    // Initial scan
    this.refreshFunctions()
  }

  /**
   * Get DevTools config from window.__dev_reserved
   */
  private getConfig(): DevToolsConfig | null {
    if (typeof window === 'undefined') return null
    const config = (window as { __dev_reserved?: DevToolsConfig }).__dev_reserved
    if (!config || typeof config !== 'object') return null
    return config
  }

  /**
   * Check if function name matches the pattern
   */
  private matchesPattern(name: string): boolean {
    const pattern = this.options.functionPattern
    if (pattern instanceof RegExp) {
      return pattern.test(name)
    }
    if (typeof pattern === 'function') {
      return pattern(name)
    }
    return /^__/.test(name)
  }

  /**
   * Scan window object for matching functions
   */
  private scanWindowFunctions(): Map<string, (...args: never[]) => unknown> {
    const functions = new Map<string, (...args: never[]) => unknown>()

    try {
      const win = window as unknown as Record<string, unknown>

      // Use Object.getOwnPropertyNames if includeWindowProps, otherwise use for...in
      // This avoids double iteration over enumerable properties
      const keys = this.options.includeWindowProps ? Object.getOwnPropertyNames(win) : Object.keys(win)

      for (const key of keys) {
        try {
          const value = win[key]
          if (typeof value === 'function' && this.matchesPattern(key)) {
            functions.set(key, value as (...args: never[]) => unknown)
          }
        } catch (_e) {
          // Skip properties that throw errors on access
        }
      }
    } catch (error) {
      console.error('Error scanning window functions:', error)
    }

    return functions
  }

  /**
   * Refresh the list of exposed functions
   */
  private refreshFunctions(): FunctionInfo[] {
    this.exposedFunctions = this.scanWindowFunctions()
    return this.listFunctions()
  }

  /**
   * Extract parameters from function
   */
  private extractParameters(fn: (...args: never[]) => unknown): {
    params: ParamMetadata[]
    count: number
  } {
    // Check if function has __meta attached
    const metadata = (fn as { __meta?: FunctionMetadata }).__meta

    if (metadata?.params) {
      return { params: metadata.params, count: fn.length }
    }

    // Fallback to parsing function signature
    try {
      const fnStr = fn.toString()
      // Extract parameter list from function signature
      const match = fnStr.match(/\(([^)]*)\)/)
      if (!match) return { params: [], count: 0 }

      const paramsStr = match[1].trim()
      if (!paramsStr) return { params: [], count: 0 }

      // Parse parameters (handle default values, destructuring, etc.)
      const params: ParamMetadata[] = paramsStr.split(',').map((p) => {
        // Remove default values and whitespace
        const paramName = p.trim().split('=')[0].trim()
        // Handle destructuring
        if (paramName.startsWith('{') || paramName.startsWith('[')) {
          return { name: paramName, type: 'any' as const }
        }
        return { name: paramName, type: 'any' as const }
      })

      return { params, count: fn.length }
    } catch (_error) {
      return { params: [], count: fn.length }
    }
  }

  /**
   * List all available functions
   */
  private listFunctions(): FunctionInfo[] {
    const list: FunctionInfo[] = []

    this.exposedFunctions.forEach((fn, name) => {
      const paramInfo = this.extractParameters(fn)

      // Check for metadata
      const meta = (fn as { __meta?: FunctionMetadata }).__meta || {}

      list.push({
        name,
        type: fn.constructor.name === 'AsyncFunction' ? 'asyncFunction' : 'function',
        params: paramInfo.params,
        paramCount: paramInfo.count,
        description: meta.description,
        returns: meta.returns,
        examples: meta.examples,
      })
    })

    return list
  }

  /**
   * Call a function by name
   */
  private async callFunction(name: string, args: unknown[]): Promise<unknown> {
    const fn = this.exposedFunctions.get(name)

    if (!fn) {
      throw new Error(`Function not found: ${name}`)
    }

    try {
      const result = await fn(...(args as never[]))
      return result
    } catch (error) {
      throw new Error(`Error calling ${name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Manually expose a function
   */
  public expose(name: string, fn: (...args: never[]) => unknown): void {
    if (!this.matchesPattern(name) && this.options.debug) {
      console.warn(`Function name "${name}" doesn't match the pattern, but exposing anyway`)
    }
    this.exposedFunctions.set(name, fn)
    ;(window as unknown as Record<string, unknown>)[name] = fn
  }

  /**
   * Get the underlying RPC instance for custom handlers
   */
  public getRPC(): ChildRPC<DevToolsParentAPI, DevToolsChildAPI> {
    return this.rpc
  }

  /**
   * Clean up
   */
  public destroy(): void {
    this.exposedFunctions.clear()
    this.rpc.destroy()
  }
}

/**
 * Parent-side DevTools
 * Provides interface to call remote functions
 */
export class ParentDevTools {
  private rpc: ParentRPC<DevToolsChildAPI, DevToolsParentAPI>

  constructor(targetWindow: Window, options: CommunicatorOptions = {}) {
    this.rpc = new ParentRPC<DevToolsChildAPI, DevToolsParentAPI>(targetWindow, options)
  }

  /**
   * List all available functions on child
   */
  public async listFunctions(): Promise<FunctionInfo[]> {
    return this.rpc.call('__devtools_list') as Promise<FunctionInfo[]>
  }

  /**
   * Call a function on child window
   */
  public async callFunction<T = unknown>(name: string, ...args: unknown[]): Promise<T> {
    return this.rpc.call('__devtools_call', name, ...args) as Promise<T>
  }

  /**
   * Refresh the list of available functions
   */
  public async refreshFunctions(): Promise<FunctionInfo[]> {
    return this.rpc.call('__devtools_refresh') as Promise<FunctionInfo[]>
  }

  /**
   * Get DevTools config from child window
   */
  public async getConfig(): Promise<DevToolsConfig | null> {
    return this.rpc.call('__devtools_get_config') as Promise<DevToolsConfig | null>
  }

  /**
   * Get the underlying RPC instance for custom handlers
   */
  public getRPC(): ParentRPC<DevToolsChildAPI, DevToolsParentAPI> {
    return this.rpc
  }

  /**
   * Clean up
   */
  public destroy(): void {
    this.rpc.destroy()
  }
}
