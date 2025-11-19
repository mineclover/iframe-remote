/**
 * DevTools utilities for remote function execution
 * Automatically discovers and exposes window functions based on naming patterns
 */

import { ChildRPC, ParentRPC } from './rpc'
import type { CommunicatorOptions } from './types'
import type { API } from './types-rpc'

export interface DevToolsOptions extends CommunicatorOptions {
  /** Pattern to match function names (default: starts with '__') */
  functionPattern?: RegExp | ((name: string) => boolean)
  /** Include properties from window object */
  includeWindowProps?: boolean
}

export interface ParamInfo {
  name: string
  type?: string
}

export interface FunctionInfo {
  name: string
  type: 'function' | 'asyncFunction'
  params: ParamInfo[]
  paramCount: number
  description?: string
  paramsMeta?: any[]
  source?: string
}

/**
 * Child-side DevTools
 * Automatically exposes window functions matching the pattern
 */
export class ChildDevTools {
  private rpc: ChildRPC<API, any>
  private exposedFunctions: Map<string, Function> = new Map()
  private options: DevToolsOptions

  constructor(options: DevToolsOptions = {}) {
    this.options = {
      functionPattern: /^__/,
      includeWindowProps: true,
      ...options,
    }

    this.rpc = new ChildRPC({
      ...options,
    })

    // Register DevTools methods
    this.rpc.register('__devtools_list', () => this.listFunctions())
    this.rpc.register('__devtools_call', (name: string, ...args: any[]) =>
      this.callFunction(name, args)
    )
    this.rpc.register('__devtools_refresh', () => this.refreshFunctions())

    // Initial scan
    this.refreshFunctions()
  }

  /**
   * Check if function name matches the pattern
   */
  private matchesPattern(name: string): boolean {
    const pattern = this.options.functionPattern
    if (pattern instanceof RegExp) {
      return pattern.test(name)
    } else if (typeof pattern === 'function') {
      return pattern(name)
    }
    return /^__/.test(name)
  }

  /**
   * Scan window object for matching functions
   */
  private scanWindowFunctions(): Map<string, Function> {
    const functions = new Map<string, Function>()

    try {
      const win = window as any

      // Use Object.getOwnPropertyNames if includeWindowProps, otherwise use for...in
      // This avoids double iteration over enumerable properties
      const keys = this.options.includeWindowProps
        ? Object.getOwnPropertyNames(win)
        : Object.keys(win)

      for (const key of keys) {
        try {
          const value = win[key]
          if (typeof value === 'function' && this.matchesPattern(key)) {
            functions.set(key, value)
          }
        } catch (e) {
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
  private extractParameters(fn: Function): { params: ParamInfo[]; count: number } {
    try {
      const fnStr = fn.toString()
      // Extract parameter list from function signature
      const match = fnStr.match(/\(([^)]*)\)/)
      if (!match) return { params: [], count: 0 }

      const paramsStr = match[1].trim()
      if (!paramsStr) return { params: [], count: 0 }

      // Parse parameters (handle default values, destructuring, etc.)
      const params = paramsStr.split(',').map((p) => {
        // Remove default values and whitespace
        const paramName = p.trim().split('=')[0].trim()
        // Handle destructuring
        if (paramName.startsWith('{') || paramName.startsWith('[')) {
          return { name: paramName, type: 'destructured' }
        }
        return { name: paramName, type: 'any' }
      })

      return { params, count: fn.length }
    } catch (error) {
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
      const meta = (fn as any).__meta || {}

      list.push({
        name,
        type: fn.constructor.name === 'AsyncFunction' ? 'asyncFunction' : 'function',
        params: paramInfo.params,
        paramCount: paramInfo.count,
        description: meta.description,
        paramsMeta: meta.params || [],
        source: this.options.debug ? fn.toString().slice(0, 200) : undefined,
      })
    })

    return list
  }

  /**
   * Call a function by name
   */
  private async callFunction(name: string, args: any[]): Promise<any> {
    const fn = this.exposedFunctions.get(name)

    if (!fn) {
      throw new Error(`Function not found: ${name}`)
    }

    try {
      const result = await fn(...args)
      return result
    } catch (error) {
      throw new Error(`Error calling ${name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Manually expose a function
   */
  public expose(name: string, fn: Function): void {
    if (!this.matchesPattern(name) && this.options.debug) {
      console.warn(`Function name "${name}" doesn't match the pattern, but exposing anyway`)
    }
    this.exposedFunctions.set(name, fn)
    ;(window as any)[name] = fn
  }

  /**
   * Get the underlying RPC instance for custom handlers
   */
  public getRPC(): ChildRPC<API, any> {
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
  private rpc: ParentRPC<any, API>

  constructor(targetWindow: Window, options: CommunicatorOptions = {}) {
    this.rpc = new ParentRPC(targetWindow, options)
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
  public async callFunction<T = any>(name: string, ...args: any[]): Promise<T> {
    return this.rpc.call('__devtools_call', name, ...args) as Promise<T>
  }

  /**
   * Refresh the list of available functions
   */
  public async refreshFunctions(): Promise<FunctionInfo[]> {
    return this.rpc.call('__devtools_refresh') as Promise<FunctionInfo[]>
  }

  /**
   * Get the underlying RPC instance for custom handlers
   */
  public getRPC(): ParentRPC<any, API> {
    return this.rpc
  }

  /**
   * Clean up
   */
  public destroy(): void {
    this.rpc.destroy()
  }
}
