import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
    onUnhandledRejection: (rejection) => {
      // Ignore cleanup rejections in tests
      if (rejection?.message?.includes('Communicator destroyed') ||
          rejection?.message?.includes('RPC destroyed')) {
        return
      }
      throw rejection
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'dist/',
        'e2e/',
      ],
    },
  },
})
