import type {
  Message,
  RequestMessage,
  ResponseMessage,
  CommunicatorOptions,
  PendingRequest,
} from './types'

/**
 * Parent-side communicator for iframe communication
 * Manages bidirectional communication with child iframe
 */
export class ParentCommunicator {
  private targetWindow: Window
  private targetOrigin: string
  private options: CommunicatorOptions
  private pendingRequests: Map<string, PendingRequest>
  private messageHandler: ((event: MessageEvent) => void) | null = null

  constructor(
    targetWindow: Window,
    options: CommunicatorOptions = {}
  ) {
    this.targetWindow = targetWindow
    this.targetOrigin = options.targetOrigin || '*'
    this.options = {
      timeout: 5000,
      debug: false,
      ...options,
    }
    this.pendingRequests = new Map()

    this.setupMessageListener()
  }

  /**
   * Set up message listener for receiving messages from child
   */
  private setupMessageListener(): void {
    this.messageHandler = (event: MessageEvent) => {
      // Verify origin if specified
      if (this.targetOrigin !== '*' && event.origin !== this.targetOrigin) {
        this.log('Rejected message from unauthorized origin:', event.origin)
        return
      }

      // Verify source window
      if (event.source !== this.targetWindow) {
        return
      }

      this.handleMessage(event.data)
    }

    window.addEventListener('message', this.messageHandler)
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: Message): void {
    try {
      this.log('Received message:', data)

      if (data.type === 'response') {
        this.handleResponse(data as ResponseMessage)
      } else if (data.type === 'request') {
        this.handleRequest(data as RequestMessage)
      } else {
        // Regular message
        this.options.onMessage?.(data.payload)
      }
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * Handle response to pending request
   */
  private handleResponse(response: ResponseMessage): void {
    const pending = this.pendingRequests.get(response.id)
    if (!pending) {
      this.log('Received response for unknown request:', response.id)
      return
    }

    clearTimeout(pending.timeout)
    this.pendingRequests.delete(response.id)

    if (response.success) {
      pending.resolve(response.payload)
    } else {
      pending.reject(new Error(response.error || 'Request failed'))
    }
  }

  /**
   * Handle incoming request from child
   */
  private async handleRequest(request: RequestMessage): Promise<void> {
    if (!this.options.onRequest) {
      this.sendResponse(request.id, false, undefined, 'No request handler configured')
      return
    }

    try {
      const result = await this.options.onRequest(request.payload)
      this.sendResponse(request.id, true, result)
    } catch (error) {
      this.sendResponse(
        request.id,
        false,
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  /**
   * Send response to child's request
   */
  private sendResponse(
    id: string,
    success: boolean,
    payload?: any,
    error?: string
  ): void {
    const response: ResponseMessage = {
      type: 'response',
      id,
      success,
      payload,
      error,
      timestamp: Date.now(),
    }

    this.postMessage(response)
  }

  /**
   * Send a one-way message to child
   */
  public send(payload: any): void {
    const message: Message = {
      type: 'message',
      payload,
      timestamp: Date.now(),
    }

    this.postMessage(message)
  }

  /**
   * Send a request and wait for response
   */
  public request<T = any>(payload: any, timeout?: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this.generateId()
      const timeoutMs = timeout || this.options.timeout || 5000

      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error('Request timeout'))
      }, timeoutMs)

      this.pendingRequests.set(id, {
        resolve,
        reject,
        timeout: timeoutHandle,
      })

      const request: RequestMessage = {
        type: 'request',
        id,
        payload,
        timestamp: Date.now(),
      }

      this.postMessage(request)
    })
  }

  /**
   * Post message to child window
   */
  private postMessage(message: Message): void {
    try {
      this.log('Sending message:', message)
      this.targetWindow.postMessage(message, this.targetOrigin)
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[ParentCommunicator]', ...args)
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    this.log('Error:', error)
    this.options.onError?.(error)
  }

  /**
   * Clean up and remove event listeners
   */
  public destroy(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler)
      this.messageHandler = null
    }

    // Reject all pending requests
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout)
      pending.reject(new Error('Communicator destroyed'))
    })
    this.pendingRequests.clear()
  }
}
