import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ParentCommunicator } from '../parent'

describe('ParentCommunicator', () => {
  let mockWindow: Window
  let communicator: ParentCommunicator
  let messageListener: ((event: MessageEvent) => void) | null = null

  beforeEach(() => {
    // Create a mock child window
    mockWindow = {
      postMessage: vi.fn(),
    } as unknown as Window

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
    vi.restoreAllMocks()
    vi.clearAllTimers()
  })

  describe('constructor', () => {
    it('should create instance with default options', () => {
      communicator = new ParentCommunicator(mockWindow)
      expect(communicator).toBeDefined()
    })

    it('should set up message listener', () => {
      communicator = new ParentCommunicator(mockWindow)
      expect(window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })

    it('should accept custom options', () => {
      const onMessage = vi.fn()
      const onError = vi.fn()

      communicator = new ParentCommunicator(mockWindow, {
        targetOrigin: 'https://example.com',
        timeout: 10000,
        debug: true,
        onMessage,
        onError,
      })

      expect(communicator).toBeDefined()
    })
  })

  describe('send', () => {
    it('should send one-way message to child window', () => {
      communicator = new ParentCommunicator(mockWindow)
      const payload = { type: 'test', data: 'hello' }

      communicator.send(payload)

      expect(mockWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'message',
          payload,
          timestamp: expect.any(Number),
        }),
        '*',
      )
    })

    it('should respect targetOrigin setting', () => {
      communicator = new ParentCommunicator(mockWindow, {
        targetOrigin: 'https://example.com',
      })

      communicator.send({ test: 'data' })

      expect(mockWindow.postMessage).toHaveBeenCalledWith(expect.any(Object), 'https://example.com')
    })
  })

  describe('request', () => {
    it('should send request with unique ID', () => {
      communicator = new ParentCommunicator(mockWindow)
      const payload = { type: 'getData' }

      communicator.request(payload)

      expect(mockWindow.postMessage).toHaveBeenCalledWith(
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
      communicator = new ParentCommunicator(mockWindow)
      const payload = { type: 'getData' }
      const responseData = { result: 'success' }

      const requestPromise = communicator.request(payload)

      // Get the request ID from the postMessage call
      const call = vi.mocked(mockWindow.postMessage).mock.calls[0]
      const requestMessage = call[0] as any
      const requestId = requestMessage.id

      // Simulate response from child
      if (messageListener) {
        messageListener(
          new MessageEvent('message', {
            data: {
              type: 'response',
              id: requestId,
              success: true,
              payload: responseData,
            },
            source: mockWindow,
            origin: window.location.origin,
          }),
        )
      }

      const result = await requestPromise
      expect(result).toEqual(responseData)
    })

    it('should reject on timeout', async () => {
      vi.useFakeTimers()
      communicator = new ParentCommunicator(mockWindow, {
        timeout: 100,
      })

      const promise = communicator.request({ type: 'getData' })

      vi.advanceTimersByTime(100)

      await expect(promise).rejects.toThrow('Request timeout')
      vi.useRealTimers()
    })

    it('should reject on error response', async () => {
      communicator = new ParentCommunicator(mockWindow)
      const requestPromise = communicator.request({ type: 'getData' })

      const call = vi.mocked(mockWindow.postMessage).mock.calls[0]
      const requestMessage = call[0] as any
      const requestId = requestMessage.id

      if (messageListener) {
        messageListener(
          new MessageEvent('message', {
            data: {
              type: 'response',
              id: requestId,
              success: false,
              error: 'Something went wrong',
            },
            source: mockWindow,
            origin: window.location.origin,
          }),
        )
      }

      await expect(requestPromise).rejects.toThrow('Something went wrong')
    })
  })

  describe('message handling', () => {
    it('should call onMessage callback for regular messages', () => {
      const onMessage = vi.fn()
      communicator = new ParentCommunicator(mockWindow, { onMessage })

      if (messageListener) {
        messageListener(
          new MessageEvent('message', {
            data: {
              type: 'message',
              payload: { test: 'data' },
            },
            source: mockWindow,
            origin: window.location.origin,
          }),
        )
      }

      expect(onMessage).toHaveBeenCalledWith({ test: 'data' })
    })

    it('should ignore messages from unauthorized origin', () => {
      const onMessage = vi.fn()
      communicator = new ParentCommunicator(mockWindow, {
        targetOrigin: 'https://example.com',
        onMessage,
      })

      if (messageListener) {
        messageListener(
          new MessageEvent('message', {
            data: { type: 'message', payload: {} },
            source: mockWindow,
            origin: 'https://malicious.com',
          }),
        )
      }

      expect(onMessage).not.toHaveBeenCalled()
    })

    it('should handle incoming requests', async () => {
      const onRequest = vi.fn().mockResolvedValue({ result: 'ok' })
      communicator = new ParentCommunicator(mockWindow, { onRequest })

      if (messageListener) {
        messageListener(
          new MessageEvent('message', {
            data: {
              type: 'request',
              id: 'test-id',
              payload: { action: 'getData' },
            },
            source: mockWindow,
            origin: window.location.origin,
          }),
        )
      }

      // Wait for async handler
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(onRequest).toHaveBeenCalledWith({ action: 'getData' })
      expect(mockWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'response',
          id: 'test-id',
          success: true,
          payload: { result: 'ok' },
        }),
        '*',
      )
    })
  })

  describe('destroy', () => {
    it('should remove event listeners', () => {
      communicator = new ParentCommunicator(mockWindow)
      communicator.destroy()

      expect(window.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })

    it('should reject pending requests', async () => {
      communicator = new ParentCommunicator(mockWindow, { timeout: 10000 })
      const requestPromise = communicator.request({ type: 'getData' }).catch((e) => e)

      communicator.destroy()
      communicator = null as any // Prevent double destroy in afterEach

      const error = await requestPromise
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Communicator destroyed')
    })
  })
})
