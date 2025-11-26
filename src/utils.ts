/**
 * Shared utility functions
 */

/**
 * Generate unique ID for messages and RPC calls
 * Format: timestamp-randomString
 */
export function generateId(prefix?: string): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  return prefix ? `${prefix}-${id}` : id
}

/**
 * Options for waitForIframe
 */
export interface WaitForIframeOptions {
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number
  /** Delay after load before resolving (default: 100) */
  delay?: number
}

/**
 * Wait for iframe to be ready (loaded and contentWindow available)
 * @param iframe - Target iframe element
 * @param options - Configuration options
 * @returns Promise that resolves when iframe is ready
 */
export function waitForIframe(
  iframe: HTMLIFrameElement,
  options: WaitForIframeOptions = {}
): Promise<void> {
  const { timeout = 10000, delay = 100 } = options

  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error('iframe load timeout'))
    }, timeout)

    const onReady = () => {
      clearTimeout(timeoutHandle)
      // Small delay to ensure iframe content is fully initialized
      setTimeout(resolve, delay)
    }

    // Check if already loaded
    if (iframe.contentWindow) {
      try {
        // Try to access contentDocument to verify same-origin or loaded state
        const _doc = iframe.contentDocument
        onReady()
      } catch {
        // Cross-origin iframe, contentWindow exists so it's loaded
        onReady()
      }
    } else {
      iframe.addEventListener('load', onReady, { once: true })
    }
  })
}
