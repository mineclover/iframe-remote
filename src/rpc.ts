/**
 * Type-safe RPC (Remote Procedure Call) implementation
 * for iframe communication
 */

import { ParentCommunicator } from './parent'
import { ChildCommunicator } from './child'
import type { CommunicatorOptions } from './types'
import {
  RPCError,
} from './types-rpc'

import type {
  API,
  MethodName,
  MethodHandler,
  RPCCallMessage,
  RPCResponseMessage,
  RPCHandlerMap,
  RPCCallOptions,
  RPCCaller,
  RPCHandler,
  ExtractParameters,
  ExtractReturnType,
} from './types-rpc'

/**
 * Parent-side RPC communicator
 * Allows parent to call methods on child iframe
 */
export class ParentRPC<
  ChildAPI extends API = API,
  ParentAPI extends API = API
> implements RPCCaller<ChildAPI>, RPCHandler<ParentAPI> {
  private communicator: ParentCommunicator
  private handlers: Map<string, MethodHandler<ParentAPI, any>>
  private pendingCalls: Map<string, {
    resolve: (value: any) => void
    reject: (reason: any) => void
    timeout: ReturnType<typeof setTimeout>
  }>

  constructor(
    targetWindow: Window,
    options: CommunicatorOptions = {}
  ) {
    this.handlers = new Map()
    this.pendingCalls = new Map()

    this.communicator = new ParentCommunicator(targetWindow, {
      ...options,
      onMessage: (data) => {
        this.handleMessage(data)
        options.onMessage?.(data)
      },
    })
  }

  /**
   * Call a method on child iframe
   */
  public call<M extends MethodName<ChildAPI>>(
    method: M,
    ...args: ExtractParameters<ChildAPI[M]>
  ): Promise<ExtractReturnType<ChildAPI[M]>> {
    return this.callWithOptions(method, {}, ...args)
  }

  /**
   * Call a method with options
   */
  public callWithOptions<M extends MethodName<ChildAPI>>(
    method: M,
    options: RPCCallOptions,
    ...args: ExtractParameters<ChildAPI[M]>
  ): Promise<ExtractReturnType<ChildAPI[M]>> {
    return new Promise((resolve, reject) => {
      const id = this.generateId()
      const timeout = options.timeout || 5000

      const timeoutHandle = setTimeout(() => {
        this.pendingCalls.delete(id)
        reject(new RPCError('RPC call timeout', 'TIMEOUT'))
      }, timeout)

      // Handle AbortSignal
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          clearTimeout(timeoutHandle)
          this.pendingCalls.delete(id)
          reject(new RPCError('RPC call aborted', 'ABORTED'))
        })
      }

      this.pendingCalls.set(id, {
        resolve,
        reject,
        timeout: timeoutHandle,
      })

      const message: RPCCallMessage<ChildAPI, M> = {
        type: 'rpc-call',
        id,
        method,
        args: args as any,
        timestamp: Date.now(),
      }

      this.communicator.send(message)
    })
  }

  /**
   * Register a method handler that child can call
   */
  public register<M extends MethodName<ParentAPI>>(
    method: M,
    handler: MethodHandler<ParentAPI, M>
  ): void {
    this.handlers.set(method as string, handler)
  }

  /**
   * Register multiple handlers at once
   */
  public registerAll(handlers: Partial<RPCHandlerMap<ParentAPI>>): void {
    Object.entries(handlers).forEach(([method, handler]) => {
      if (handler) {
        this.handlers.set(method, handler)
      }
    })
  }

  /**
   * Unregister a method handler
   */
  public unregister<M extends MethodName<ParentAPI>>(method: M): void {
    this.handlers.delete(method as string)
  }

  /**
   * Unregister all handlers
   */
  public unregisterAll(): void {
    this.handlers.clear()
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: any): void {
    if (data.type === 'rpc-response') {
      this.handleResponse(data as RPCResponseMessage)
    } else if (data.type === 'rpc-call') {
      this.handleCall(data as RPCCallMessage)
    }
  }

  /**
   * Handle RPC response
   */
  private handleResponse(response: RPCResponseMessage): void {
    const pending = this.pendingCalls.get(response.id)
    if (!pending) return

    clearTimeout(pending.timeout)
    this.pendingCalls.delete(response.id)

    if (response.success) {
      pending.resolve(response.result)
    } else {
      pending.reject(new RPCError(response.error || 'RPC call failed'))
    }
  }

  /**
   * Handle incoming RPC call from child
   */
  private async handleCall(call: RPCCallMessage): Promise<void> {
    const handler = this.handlers.get(call.method)

    if (!handler) {
      this.sendResponse(call.id, false, undefined, `Method not found: ${call.method}`)
      return
    }

    try {
      const result = await handler(...call.args)
      this.sendResponse(call.id, true, result)
    } catch (error) {
      this.sendResponse(
        call.id,
        false,
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  /**
   * Send RPC response
   */
  private sendResponse(
    id: string,
    success: boolean,
    result?: any,
    error?: string
  ): void {
    const response: RPCResponseMessage = {
      type: 'rpc-response',
      id,
      success,
      result,
      error,
      timestamp: Date.now(),
    }

    this.communicator.send(response)
  }

  /**
   * Generate unique call ID
   */
  private generateId(): string {
    return `rpc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clean up
   */
  public destroy(): void {
    this.handlers.clear()
    this.pendingCalls.forEach((pending) => {
      clearTimeout(pending.timeout)
      pending.reject(new RPCError('RPC destroyed'))
    })
    this.pendingCalls.clear()
    this.communicator.destroy()
  }
}

/**
 * Child-side RPC communicator
 * Allows child to call methods on parent window
 */
export class ChildRPC<
  ParentAPI extends API = API,
  ChildAPI extends API = API
> implements RPCCaller<ParentAPI>, RPCHandler<ChildAPI> {
  private communicator: ChildCommunicator
  private handlers: Map<string, MethodHandler<ChildAPI, any>>
  private pendingCalls: Map<string, {
    resolve: (value: any) => void
    reject: (reason: any) => void
    timeout: ReturnType<typeof setTimeout>
  }>

  constructor(options: CommunicatorOptions = {}) {
    this.handlers = new Map()
    this.pendingCalls = new Map()

    this.communicator = new ChildCommunicator({
      ...options,
      onMessage: (data) => {
        this.handleMessage(data)
        options.onMessage?.(data)
      },
    })
  }

  /**
   * Call a method on parent window
   */
  public call<M extends MethodName<ParentAPI>>(
    method: M,
    ...args: ExtractParameters<ParentAPI[M]>
  ): Promise<ExtractReturnType<ParentAPI[M]>> {
    return this.callWithOptions(method, {}, ...args)
  }

  /**
   * Call a method with options
   */
  public callWithOptions<M extends MethodName<ParentAPI>>(
    method: M,
    options: RPCCallOptions,
    ...args: ExtractParameters<ParentAPI[M]>
  ): Promise<ExtractReturnType<ParentAPI[M]>> {
    return new Promise((resolve, reject) => {
      const id = this.generateId()
      const timeout = options.timeout || 5000

      const timeoutHandle = setTimeout(() => {
        this.pendingCalls.delete(id)
        reject(new RPCError('RPC call timeout', 'TIMEOUT'))
      }, timeout)

      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          clearTimeout(timeoutHandle)
          this.pendingCalls.delete(id)
          reject(new RPCError('RPC call aborted', 'ABORTED'))
        })
      }

      this.pendingCalls.set(id, {
        resolve,
        reject,
        timeout: timeoutHandle,
      })

      const message: RPCCallMessage<ParentAPI, M> = {
        type: 'rpc-call',
        id,
        method,
        args: args as any,
        timestamp: Date.now(),
      }

      this.communicator.send(message)
    })
  }

  /**
   * Register a method handler that parent can call
   */
  public register<M extends MethodName<ChildAPI>>(
    method: M,
    handler: MethodHandler<ChildAPI, M>
  ): void {
    this.handlers.set(method as string, handler)
  }

  /**
   * Register multiple handlers at once
   */
  public registerAll(handlers: Partial<RPCHandlerMap<ChildAPI>>): void {
    Object.entries(handlers).forEach(([method, handler]) => {
      if (handler) {
        this.handlers.set(method, handler)
      }
    })
  }

  /**
   * Unregister a method handler
   */
  public unregister<M extends MethodName<ChildAPI>>(method: M): void {
    this.handlers.delete(method as string)
  }

  /**
   * Unregister all handlers
   */
  public unregisterAll(): void {
    this.handlers.clear()
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: any): void {
    if (data.type === 'rpc-response') {
      this.handleResponse(data as RPCResponseMessage)
    } else if (data.type === 'rpc-call') {
      this.handleCall(data as RPCCallMessage)
    }
  }

  /**
   * Handle RPC response
   */
  private handleResponse(response: RPCResponseMessage): void {
    const pending = this.pendingCalls.get(response.id)
    if (!pending) return

    clearTimeout(pending.timeout)
    this.pendingCalls.delete(response.id)

    if (response.success) {
      pending.resolve(response.result)
    } else {
      pending.reject(new RPCError(response.error || 'RPC call failed'))
    }
  }

  /**
   * Handle incoming RPC call from parent
   */
  private async handleCall(call: RPCCallMessage): Promise<void> {
    const handler = this.handlers.get(call.method)

    if (!handler) {
      this.sendResponse(call.id, false, undefined, `Method not found: ${call.method}`)
      return
    }

    try {
      const result = await handler(...call.args)
      this.sendResponse(call.id, true, result)
    } catch (error) {
      this.sendResponse(
        call.id,
        false,
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  /**
   * Send RPC response
   */
  private sendResponse(
    id: string,
    success: boolean,
    result?: any,
    error?: string
  ): void {
    const response: RPCResponseMessage = {
      type: 'rpc-response',
      id,
      success,
      result,
      error,
      timestamp: Date.now(),
    }

    this.communicator.send(response)
  }

  /**
   * Generate unique call ID
   */
  private generateId(): string {
    return `rpc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clean up
   */
  public destroy(): void {
    this.handlers.clear()
    this.pendingCalls.forEach((pending) => {
      clearTimeout(pending.timeout)
      pending.reject(new RPCError('RPC destroyed'))
    })
    this.pendingCalls.clear()
    this.communicator.destroy()
  }
}
