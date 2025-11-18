import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ParentRPC, ChildRPC } from '../rpc'
import { RPCError } from '../types-rpc'

describe('ParentRPC', () => {
  let mockWindow: Window
  let rpc: ParentRPC
  let messageListener: ((event: MessageEvent) => void) | null = null

  beforeEach(() => {
    mockWindow = { postMessage: vi.fn() } as unknown as Window

    vi.spyOn(window, 'addEventListener').mockImplementation((event, listener) => {
      if (event === 'message') {
        messageListener = listener as (event: MessageEvent) => void
      }
    })

    vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllTimers()
    if (rpc) {
      rpc.destroy()
      rpc = null as any
    }
  })

  describe('call', () => {
    it('should send RPC call message', () => {
      rpc = new ParentRPC(mockWindow)

      rpc.call('testMethod', 'arg1', 123)

      expect(mockWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rpc-call',
          method: 'testMethod',
          args: ['arg1', 123],
          id: expect.any(String),
        }),
        '*'
      )
    })

    it('should resolve on successful response', async () => {
      rpc = new ParentRPC(mockWindow)
      const resultData = { status: 'ok', value: 42 }

      const callPromise = rpc.call('getData')

      const call = vi.mocked(mockWindow.postMessage).mock.calls[0]
      const callMessage = call[0] as any

      if (messageListener) {
        messageListener(new MessageEvent('message', {
          data: {
            type: 'rpc-response',
            id: callMessage.id,
            success: true,
            result: resultData,
          },
          source: mockWindow,
          origin: window.location.origin,
        }))
      }

      const result = await callPromise
      expect(result).toEqual(resultData)
    })

    it('should reject on error response', async () => {
      rpc = new ParentRPC(mockWindow)

      const callPromise = rpc.call('failMethod')

      const call = vi.mocked(mockWindow.postMessage).mock.calls[0]
      const callMessage = call[0] as any

      if (messageListener) {
        messageListener(new MessageEvent('message', {
          data: {
            type: 'rpc-response',
            id: callMessage.id,
            success: false,
            error: 'Method failed',
          },
          source: mockWindow,
          origin: window.location.origin,
        }))
      }

      await expect(callPromise).rejects.toThrow('Method failed')
    })

    it('should timeout if no response', async () => {
      vi.useFakeTimers()
      rpc = new ParentRPC(mockWindow)

      const callPromise = rpc.callWithOptions('slowMethod', { timeout: 100 })

      vi.advanceTimersByTime(100)

      await expect(callPromise).rejects.toThrow('RPC call timeout')
      vi.useRealTimers()
    })
  })

  describe('register', () => {
    it('should register and handle RPC method', async () => {
      rpc = new ParentRPC(mockWindow)

      const handler = vi.fn().mockResolvedValue({ result: 'success' })
      rpc.register('testMethod', handler)

      if (messageListener) {
        messageListener(new MessageEvent('message', {
          data: {
            type: 'rpc-call',
            id: 'test-call-id',
            method: 'testMethod',
            args: ['arg1', 'arg2'],
          },
          source: mockWindow,
          origin: window.location.origin,
        }))
      }

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2')
      expect(mockWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rpc-response',
          id: 'test-call-id',
          success: true,
          result: { result: 'success' },
        }),
        '*'
      )
    })

    it('should send error response if method not found', async () => {
      rpc = new ParentRPC(mockWindow)

      if (messageListener) {
        messageListener(new MessageEvent('message', {
          data: {
            type: 'rpc-call',
            id: 'unknown-method-id',
            method: 'unknownMethod',
            args: [],
          },
          source: mockWindow,
          origin: window.location.origin,
        }))
      }

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rpc-response',
          id: 'unknown-method-id',
          success: false,
          error: expect.stringContaining('Method not found'),
        }),
        '*'
      )
    })

    it('should handle handler errors', async () => {
      rpc = new ParentRPC(mockWindow)

      const handler = vi.fn().mockRejectedValue(new Error('Handler error'))
      rpc.register('errorMethod', handler)

      if (messageListener) {
        messageListener(new MessageEvent('message', {
          data: {
            type: 'rpc-call',
            id: 'error-call-id',
            method: 'errorMethod',
            args: [],
          },
          source: mockWindow,
          origin: window.location.origin,
        }))
      }

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rpc-response',
          id: 'error-call-id',
          success: false,
          error: 'Handler error',
        }),
        '*'
      )
    })
  })

  describe('registerAll', () => {
    it('should register multiple handlers', async () => {
      rpc = new ParentRPC(mockWindow)

      const handler1 = vi.fn().mockResolvedValue('result1')
      const handler2 = vi.fn().mockResolvedValue('result2')

      rpc.registerAll({
        method1: handler1,
        method2: handler2,
      })

      if (messageListener) {
        messageListener(new MessageEvent('message', {
          data: {
            type: 'rpc-call',
            id: 'call1',
            method: 'method1',
            args: [],
          },
          source: mockWindow,
          origin: window.location.origin,
        }))
      }

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(handler1).toHaveBeenCalled()
    })
  })

  describe('unregister', () => {
    it('should unregister a handler', async () => {
      rpc = new ParentRPC(mockWindow)

      const handler = vi.fn().mockResolvedValue('result')
      rpc.register('testMethod', handler)
      rpc.unregister('testMethod')

      if (messageListener) {
        messageListener(new MessageEvent('message', {
          data: {
            type: 'rpc-call',
            id: 'test-id',
            method: 'testMethod',
            args: [],
          },
          source: mockWindow,
          origin: window.location.origin,
        }))
      }

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('destroy', () => {
    it('should clean up resources', () => {
      rpc = new ParentRPC(mockWindow)

      rpc.destroy()

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      )
    })

    it('should reject pending calls', async () => {
      rpc = new ParentRPC(mockWindow, { timeout: 10000 })

      const callPromise = rpc.call('method').catch(e => e)

      rpc.destroy()
      rpc = null as any

      const error = await callPromise
      expect(error).toBeInstanceOf(RPCError)
      expect(error.message).toBe('RPC destroyed')
    })
  })
})

describe('ChildRPC', () => {
  let mockParentWindow: Window
  let rpc: ChildRPC
  let messageListener: ((event: MessageEvent) => void) | null = null
  let originalParent: Window

  beforeEach(() => {
    originalParent = window.parent

    mockParentWindow = { postMessage: vi.fn() } as unknown as Window

    Object.defineProperty(window, 'parent', {
      writable: true,
      configurable: true,
      value: mockParentWindow,
    })

    vi.spyOn(window, 'addEventListener').mockImplementation((event, listener) => {
      if (event === 'message') {
        messageListener = listener as (event: MessageEvent) => void
      }
    })

    vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    Object.defineProperty(window, 'parent', {
      writable: true,
      configurable: true,
      value: originalParent,
    })
    vi.restoreAllMocks()
    vi.clearAllTimers()
    if (rpc) {
      rpc.destroy()
      rpc = null as any
    }
  })

  it('should throw error if not in iframe', () => {
    Object.defineProperty(window, 'parent', {
      writable: true,
      configurable: true,
      value: window,
    })

    expect(() => new ChildRPC()).toThrow('must be used inside an iframe')
  })

  it('should send RPC call to parent', () => {
    rpc = new ChildRPC()

    rpc.call('parentMethod', 'arg1', 123)

    expect(mockParentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rpc-call',
        method: 'parentMethod',
        args: ['arg1', 123],
      }),
      '*'
    )
  })

  it('should handle RPC calls from parent', async () => {
    rpc = new ChildRPC()

    const handler = vi.fn().mockResolvedValue({ data: 'test' })
    rpc.register('childMethod', handler)

    if (messageListener) {
      messageListener(new MessageEvent('message', {
        data: {
          type: 'rpc-call',
          id: 'parent-call-id',
          method: 'childMethod',
          args: ['test'],
        },
        source: mockParentWindow,
        origin: window.location.origin,
      }))
    }

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(handler).toHaveBeenCalledWith('test')
    expect(mockParentWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rpc-response',
        id: 'parent-call-id',
        success: true,
        result: { data: 'test' },
      }),
      '*'
    )
  })
})
