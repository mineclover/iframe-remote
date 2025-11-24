/**
 * Message types for iframe communication
 */
export type MessageType = 'message' | 'request' | 'response' | 'error'

/**
 * Base message structure
 */
export interface Message<T = unknown> {
  id?: string
  type: MessageType
  payload: T
  timestamp?: number
}

/**
 * Request message with unique ID for response matching
 */
export interface RequestMessage<T = unknown> extends Message<T> {
  type: 'request'
  id: string
  requestType?: string
}

/**
 * Response message matching request ID
 */
export interface ResponseMessage<T = unknown> extends Message<T> {
  type: 'response'
  id: string
  success: boolean
  error?: string
}

/**
 * Configuration options for communicator
 */
export interface CommunicatorOptions {
  /**
   * Target origin for postMessage (security)
   * Use '*' for development only
   */
  targetOrigin?: string

  /**
   * Timeout for request-response pattern (ms)
   * @default 5000
   */
  timeout?: number

  /**
   * Callback for received messages
   */
  onMessage?: (data: unknown) => void

  /**
   * Callback for handling requests (should return response)
   */
  onRequest?: (data: unknown) => Promise<unknown> | unknown

  /**
   * Error handler
   */
  onError?: (error: Error) => void

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean
}

/**
 * Pending request tracking
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PendingRequest<T = any> {
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
  timeout: ReturnType<typeof setTimeout>
}
