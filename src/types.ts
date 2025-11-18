/**
 * Message types for iframe communication
 */
export type MessageType = 'message' | 'request' | 'response' | 'error'

/**
 * Base message structure
 */
export interface Message<T = any> {
  id?: string
  type: MessageType
  payload: T
  timestamp?: number
}

/**
 * Request message with unique ID for response matching
 */
export interface RequestMessage<T = any> extends Message<T> {
  type: 'request'
  id: string
  requestType?: string
}

/**
 * Response message matching request ID
 */
export interface ResponseMessage<T = any> extends Message<T> {
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
  onMessage?: (data: any) => void

  /**
   * Callback for handling requests (should return response)
   */
  onRequest?: (data: any) => Promise<any> | any

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
export interface PendingRequest {
  resolve: (value: any) => void
  reject: (reason?: any) => void
  timeout: ReturnType<typeof setTimeout>
}
