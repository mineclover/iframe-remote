# iframe-remote

Bidirectional iframe communication protocol implementation in TypeScript.

## Features

- 🔄 **Bidirectional Communication**: Send messages both ways between parent and child iframe
- 📡 **Request-Response Pattern**: Built-in support for async request/response communication
- 🔒 **Security**: Origin validation for cross-origin iframe communication
- ⏱️ **Timeout Handling**: Configurable timeout for requests
- 🎯 **Type-Safe**: Full TypeScript support with type definitions
- 🧪 **Well-Tested**: Comprehensive E2E tests with Playwright

## Installation

```bash
npm install @packages/iframe-remote
```

## Usage

### Parent Page

```typescript
import { ParentCommunicator } from '@packages/iframe-remote/parent'

const iframe = document.getElementById('my-iframe') as HTMLIFrameElement

const communicator = new ParentCommunicator(iframe.contentWindow!, {
  targetOrigin: 'https://child-domain.com', // Or '*' for same-origin
  onMessage: (data) => {
    console.log('Received from child:', data)
  },
  onRequest: async (data) => {
    // Handle requests from child
    return { result: 'data from parent' }
  },
  timeout: 5000,
  debug: true
})

// Send one-way message
communicator.send({ type: 'greeting', message: 'Hello child!' })

// Send request and wait for response
const response = await communicator.request({ type: 'getData' })
console.log('Response from child:', response)
```

### Child Page (Inside iframe)

```typescript
import { ChildCommunicator } from '@packages/iframe-remote/child'

const communicator = new ChildCommunicator({
  targetOrigin: 'https://parent-domain.com', // Or '*' for same-origin
  onMessage: (data) => {
    console.log('Received from parent:', data)
  },
  onRequest: async (data) => {
    // Handle requests from parent
    if (data.type === 'getData') {
      return { status: 'ok', data: { foo: 'bar' } }
    }
  },
  timeout: 5000,
  debug: true
})

// Send one-way message
communicator.send({ type: 'notification', message: 'Something happened!' })

// Send request and wait for response
const response = await communicator.request({ type: 'getConfig' })
console.log('Response from parent:', response)
```

## API

### ParentCommunicator

#### Constructor

```typescript
new ParentCommunicator(targetWindow: Window, options?: CommunicatorOptions)
```

#### Methods

- `send(payload: any): void` - Send one-way message to child
- `request<T>(payload: any, timeout?: number): Promise<T>` - Send request and wait for response
- `destroy(): void` - Clean up and remove event listeners

### ChildCommunicator

#### Constructor

```typescript
new ChildCommunicator(options?: CommunicatorOptions)
```

#### Methods

- `send(payload: any): void` - Send one-way message to parent
- `request<T>(payload: any, timeout?: number): Promise<T>` - Send request and wait for response
- `destroy(): void` - Clean up and remove event listeners

### CommunicatorOptions

```typescript
interface CommunicatorOptions {
  targetOrigin?: string        // Target origin for postMessage
  timeout?: number             // Timeout for requests (default: 5000ms)
  onMessage?: (data: any) => void
  onRequest?: (data: any) => Promise<any> | any
  onError?: (error: Error) => void
  debug?: boolean              // Enable debug logging
}
```

## Development

### Build

```bash
npm run build
```

### Run Tests

```bash
# Install Playwright browsers first
npm run playwright:install

# Run all tests
npm test

# Run E2E tests only
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed
```

### Run Examples

1. Build the project:
```bash
npm run build
```

2. Serve the examples directory:
```bash
npx serve examples -p 3000
```

3. Open http://localhost:3000/parent/index.html in your browser

## Examples

Check the `examples/` directory for working examples:
- `examples/parent/index.html` - Parent page with iframe
- `examples/child/index.html` - Child page to be embedded

## Security Considerations

- Always specify `targetOrigin` in production to prevent messages from unauthorized origins
- Validate message data before processing
- Use HTTPS for cross-origin communication
- Implement proper error handling

## License

MIT
