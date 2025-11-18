/**
 * RPC (Remote Procedure Call) Type System
 *
 * Define type-safe method calls between parent and child iframes
 */

/**
 * Extract function parameter types
 */
export type ExtractParameters<T> = T extends (...args: infer P) => any ? P : never

/**
 * Extract function return type (unwrap Promise)
 */
export type ExtractReturnType<T> = T extends (...args: any[]) => infer R
  ? R extends Promise<infer U>
    ? U
    : R
  : never

/**
 * API definition - maps method names to their function signatures
 */
export type API = {
  [method: string]: (...args: any[]) => any | Promise<any>
}

/**
 * Method names from API
 */
export type MethodName<T extends API> = keyof T & string

/**
 * Method handler function type
 */
export type MethodHandler<T extends API, M extends MethodName<T>> = T[M]

/**
 * RPC call message
 */
export interface RPCCallMessage<T extends API = API, M extends MethodName<T> = MethodName<T>> {
  type: 'rpc-call'
  id: string
  method: M
  args: ExtractParameters<T[M]>
  timestamp: number
}

/**
 * RPC response message
 */
export interface RPCResponseMessage<T = any> {
  type: 'rpc-response'
  id: string
  success: boolean
  result?: T
  error?: string
  timestamp: number
}

/**
 * RPC error
 */
export class RPCError extends Error {
  constructor(
    message: string,
    public code?: string,
    public data?: any
  ) {
    super(message)
    this.name = 'RPCError'
  }
}

/**
 * RPC handler map
 */
export type RPCHandlerMap<T extends API> = {
  [M in MethodName<T>]?: MethodHandler<T, M>
}

/**
 * RPC call options
 */
export interface RPCCallOptions {
  timeout?: number
  signal?: AbortSignal
}

/**
 * Type-safe RPC caller interface
 */
export type RPCCaller<T extends API> = {
  call<M extends MethodName<T>>(
    method: M,
    ...args: ExtractParameters<T[M]>
  ): Promise<ExtractReturnType<T[M]>>

  callWithOptions<M extends MethodName<T>>(
    method: M,
    options: RPCCallOptions,
    ...args: ExtractParameters<T[M]>
  ): Promise<ExtractReturnType<T[M]>>
}

/**
 * Type-safe RPC handler interface
 */
export type RPCHandler<T extends API> = {
  register<M extends MethodName<T>>(
    method: M,
    handler: MethodHandler<T, M>
  ): void

  registerAll(handlers: Partial<RPCHandlerMap<T>>): void

  unregister<M extends MethodName<T>>(method: M): void

  unregisterAll(): void
}

/**
 * Example API definitions for documentation
 */
export interface ExampleParentAPI {
  // Parent methods that child can call
  updateConfig: (config: { theme: string; lang: string }) => void
  requestData: (id: string) => Promise<{ name: string; value: number }>
  notify: (message: string, level: 'info' | 'warn' | 'error') => void
}

export interface ExampleChildAPI {
  // Child methods that parent can call
  initialize: (options: { width: number; height: number }) => Promise<void>
  getData: () => Promise<{ status: string; items: any[] }>
  render: (data: { content: string; style?: any }) => void
  destroy: () => Promise<void>
}
