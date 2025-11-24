# iframe-remote

Type-safe bidirectional iframe communication library with 2 progressive systems.

## 📦 Two Systems

1. **Basic Communication** - Simple message send/receive & request/response
2. **RPC System** - Type-safe remote function calls

📖 **[Architecture Guide](./ARCHITECTURE.md)** - Detailed system comparison and structure

> **Note:** DevTools functionality has been migrated to [@packages/web-components](../web-components/)

## Features

- 🔄 **Bidirectional Communication** - Parent ↔ Child iframe messaging
- 🎯 **Type-Safe RPC** - Remote procedure calls with TypeScript type safety
- 📋 **Metadata Validation** - Parameter metadata validation with Zod schemas
- ✅ **Fully Tested** - Unit tests and E2E tests with Playwright

## Installation

### NPM Package

```bash
npm install iframe-remote
# or
pnpm add iframe-remote
```

### CDN / Standalone Bundle

For quick prototyping or non-module environments, use the standalone bundle:

```html
<!-- Load from local build -->
<script src="./dist/iframe-remote.bundle.min.js"></script>

<script>
  // Access from global namespace
  const { ParentCommunicator, ChildCommunicator, ParentRPC, ChildRPC } = window.IframeRemote;

  // Use directly - no imports needed!
  const comm = new ParentCommunicator(iframe.contentWindow);
</script>
```

**Bundle sizes:**
- Development: `iframe-remote.bundle.js` (~20KB)
- Production: `iframe-remote.bundle.min.js` (~10KB minified)

## Quick Start

### Basic Communication

**Child:**
```typescript
import { ChildCommunicator } from 'iframe-remote'

const comm = new ChildCommunicator({
  onRequest: async (data) => {
    if (data.type === 'getData') {
      return { result: 'Hello from child!' }
    }
  }
})

// Send message to parent
comm.send({ type: 'ready' })
```

**Parent:**
```typescript
import { ParentCommunicator } from 'iframe-remote'

const comm = new ParentCommunicator(iframe.contentWindow!, {
  onMessage: (data) => {
    console.log('Received:', data)
  }
})

// Request data from child
const response = await comm.request({ type: 'getData' })
```

### RPC (Remote Procedure Call)

**Child:**
```typescript
import { ChildRPC } from 'iframe-remote'

const rpc = new ChildRPC()
rpc.register('add', (a: number, b: number) => a + b)
```

**Parent:**
```typescript
import { ParentRPC } from 'iframe-remote'

const rpc = new ParentRPC(iframe.contentWindow!)
const result = await rpc.call('add', 5, 3) // 8
```

## Examples

See `/examples` directory:
- `rpc-parent.html` / `rpc-child.html` - RPC communication demo
- `standalone-parent.html` / `standalone-child.html` - Basic communication
- `standalone-child-bundle.html` - Bundle version demo (no module imports!)

## Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - Complete system overview and comparison
- [Metadata Schema Guide](./docs/METADATA_SCHEMA.md) - Parameter types reference
- [API Documentation](./src/index.ts) - TypeScript definitions

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# E2E tests with browser
pnpm test:e2e:headed
```

## License

MIT
