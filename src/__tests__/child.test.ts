import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChildCommunicator } from '../child'

describe('ChildCommunicator', () => {
  let mockParentWindow: Window
  let communicator: ChildCommunicator
  let messageListener: ((event: MessageEvent) => void) | null = null
  let originalParent: Window

  beforeEach(() => {
    // Save original parent
    originalParent = window.parent

    // Create mock parent window
    mockParentWindow = {
      postMessage: vi.fn(),
    } as unknown as Window

    // Mock window.parent
    Object.defineProperty(window, 'parent', {
      writable: true,
      configurable: true,
      value: mockParentWindow,
    })

    // Capture message listener
    vi.spyOn(window, 'addEventListener').mockImplementation((event, listener) => {
      if (event === 'message') {
        messageListener = listener as (event: MessageEvent) => void
      }
    })

    vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    if (communicator) {
      communicator.destroy()
    }
    Object.defineProperty(window, 'parent', {
      writable: true,
      configurable: true,
      value: originalParent,
    })
    vi.restoreAllMocks()
    vi.clearAllTimers()
  })

  describe('constructor', () => {
    it('should create instance with default options', () => {
      communicator = new ChildCommunicator()
      expect(communicator).toBeDefined()
    })

    it('should throw error if not in iframe', () => {
      Object.defineProperty(window, 'parent', {
        writable: true,
        configurable: true,
        value: window,
      })

      expect(() => new ChildCommunicator()).toThrow('ChildCommunicator must be used inside an iframe')
    })

    it('should set up message listener', () => {
      communicator = new ChildCommunicator()
      expect(window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })

    it('should accept custom options', () => {
      const onMessage = vi.fn()
      const onRequest = vi.fn()
      const onError = vi.fn()

      communicator = new ChildCommunicator({
        targetOrigin: 'https://example.com',
        timeout: 10000,
        debug: true,
        onMessage,
        onRequest,
        onError,
      })

      expect(communicator).toBeDefined()
    })
  })

  describe('send', () => {
    it('should send one-way message to parent window', () => {
      communicator = new ChildCommunicator()
      const payload = { type: 'notification', data: 'hello' }

      communicator.send(payload)

      expect(mockParentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'message',
          payload,
          timestamp: expect.any(Number),
        }),
        '*',
      )
    })

    it('should respect targetOrigin setting', () => {
      communicator = new ChildCommunicator({
        targetOrigin: 'https://example.com',
      })

      communicator.send({ test: 'data' })

      expect(mockParentWindow.postMessage).toHaveBeenCalledWith(expect.any(Object), 'https://example.com')
    })
  })

  describe('request', () => {
    it('should send request with unique ID', () => {
      communicator = new ChildCommunicator()
      const payload = { type: 'getConfig' }

      communicator.request(payload)

      expect(mockParentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'request',
          id: expect.any(String),
          payload,
          timestamp: expect.any(Number),
        }),
        '*',
      )
    })

    it('should resolve on successful response', async () => {
      communicator = new ChildCommunicator()
      const payload = { type: 'getConfig' }
      const responseData = { config: { theme: 'dark' } }

      const requestPromise = communicator.request(payload)

      const call = vi.mocked(mockParentWindow.postMessage).mock.calls[0]
      const requestMessage = call[0] as any
      const requestId = requestMessage.id

      if (messageListener) {
        messageListener(
          new MessageEvent('message', {
            data: {
              type: 'response',
              id: requestId,
              success: true,
              payload: responseData,
            },
            source: mockParentWindow,
            origin: window.location.origin,
          }),
        )
      }

      const result = await requestPromise
      expect(result).toEqual(responseData)
    })

    it('should reject on timeout', async () => {
      vi.useFakeTimers()
      communicator = new ChildCommunicator({
        timeout: 100,
      })

      const promise = communicator.request({ type: 'getConfig' })

      vi.advanceTimersByTime(100)

      await expect(promise).rejects.toThrow('Request timeout')
      vi.useRealTimers()
    })
  })

  describe('message handling', () => {
    it('should call onMessage callback for regular messages', () => {
      const onMessage = vi.fn()
      communicator = new ChildCommunicator({ onMessage })

      if (messageListener) {
        messageListener(
          new MessageEvent('message', {
            data: {
              type: 'message',
              payload: { command: 'update' },
            },
            source: mockParentWindow,
            origin: window.location.origin,
          }),
        )
      }

      expect(onMessage).toHaveBeenCalledWith({ command: 'update' })
    })

    it('should ignore messages from unauthorized origin', () => {
      const onMessage = vi.fn()
      communicator = new ChildCommunicator({
        targetOrigin: 'https://example.com',
        onMessage,
      })

      if (messageListener) {
        messageListener(
          new MessageEvent('message', {
            data: { type: 'message', payload: {} },
            source: mockParentWindow,
            origin: 'https://malicious.com',
          }),
        )
      }

      expect(onMessage).not.toHaveBeenCalled()
    })

    it('should handle incoming requests', async () => {
      const onRequest = vi.fn().mockResolvedValue({ status: 'ok', data: { foo: 'bar' } })
      communicator = new ChildCommunicator({ onRequest })

      if (messageListener) {
        messageListener(
          new MessageEvent('message', {
            data: {
              type: 'request',
              id: 'test-req-id',
              payload: { type: 'getData' },
            },
            source: mockParentWindow,
            origin: window.location.origin,
          }),
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(onRequest).toHaveBeenCalledWith({ type: 'getData' })
      expect(mockParentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'response',
          id: 'test-req-id',
          success: true,
          payload: { status: 'ok', data: { foo: 'bar' } },
        }),
        '*',
      )
    })

    it('should send error response when request handler throws', async () => {
      const onRequest = vi.fn().mockRejectedValue(new Error('Handler failed'))
      communicator = new ChildCommunicator({ onRequest })

      if (messageListener) {
        messageListener(
          new MessageEvent('message', {
            data: {
              type: 'request',
              id: 'error-req-id',
              payload: { type: 'getData' },
            },
            source: mockParentWindow,
            origin: window.location.origin,
          }),
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockParentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'response',
          id: 'error-req-id',
          success: false,
          error: 'Handler failed',
        }),
        '*',
      )
    })
  })

  describe('destroy', () => {
    it('should remove event listeners', () => {
      communicator = new ChildCommunicator()
      communicator.destroy()

      expect(window.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })

    it('should reject pending requests', async () => {
      communicator = new ChildCommunicator({ timeout: 10000 })
      const requestPromise = communicator.request({ type: 'getConfig' }).catch((e) => e)

      communicator.destroy()
      communicator = null as any // Prevent double destroy in afterEach

      const error = await requestPromise
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Communicator destroyed')
    })
  })
})
