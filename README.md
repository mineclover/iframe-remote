# iframe-remote

Type-safe bidirectional iframe communication library with DevTools support.

## Features

- 🔄 **Bidirectional Communication** - Parent ↔ Child iframe messaging
- 🎯 **Type-Safe RPC** - Remote procedure calls with TypeScript type safety
- 🛠️ **DevTools Integration** - Automatic function discovery and remote execution
- 📋 **Metadata Schema** - Rich parameter metadata for UI generation
- 🧠 **Auto Type Inference** - Infers parameter types from naming patterns
- ✅ **Fully Tested** - Unit tests and E2E tests with Playwright

## Installation

```bash
npm install iframe-remote
# or
pnpm add iframe-remote
```

## Quick Start

### DevTools (Recommended)

**Child Window:**
```typescript
import { ChildDevTools, createFunctionMeta } from 'iframe-remote'

// Define functions with __ prefix
window.__getUserInfo = function() {
  return { name: 'Alice', role: 'admin' }
}

window.__setTheme = function(theme: string) {
  document.body.className = `theme-${theme}`
  return { applied: theme }
}

// Add metadata for UI generation
window.__setTheme.__meta = createFunctionMeta({
  description: 'Change theme',
  params: [{
    name: 'theme',
    type: 'select',
    options: ['light', 'dark', 'auto'],
    default: 'auto'
  }]
})

// Initialize
new ChildDevTools({ functionPattern: /^__/ })
```

**Parent Window:**
```typescript
import { ParentDevTools } from 'iframe-remote'

const devtools = new ParentDevTools(iframe.contentWindow!)

// List functions
const functions = await devtools.listFunctions()

// Call function
const result = await devtools.callFunction('__setTheme', 'dark')
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

## Parameter Types

| Type | UI Widget | Metadata |
|------|-----------|----------|
| `string` | Text input (auto-expanding) | `pattern?: string` |
| `number` | Number input | `min?, max?, step?` |
| `boolean` | Checkbox | - |
| `select` | Dropdown | `options: string[] \| {label, value}[]` |
| `array` | Array input | `itemType?: ParamType` |
| `color` | Color picker | - |
| `time` | Time picker (HH:MM) | `min?, max?` |
| `date` | Date picker (YYYY-MM-DD) | `min?, max?` |
| `range` | Slider | `min, max, step?` |

### Metadata Example

```typescript
window.__processData.__meta = createFunctionMeta({
  description: 'Process data with filters',
  params: [
    {
      name: 'category',
      type: 'select',
      options: ['all', 'posts', 'users'],
      default: 'all'
    },
    {
      name: 'minScore',
      type: 'number',
      min: 0,
      max: 100,
      default: 50
    },
    {
      name: 'backgroundColor',
      type: 'color',
      default: '#667eea'
    }
  ]
})
```

### Auto Type Inference

Without metadata, types are inferred from parameter names:

```typescript
window.__updateConfig = function(isEnabled, maxRetries, backgroundColor) {
  // isEnabled → boolean
  // maxRetries → number
  // backgroundColor → color
}
```

**Patterns:**
- `is*`, `has*`, `should*` → `boolean`
- `min*`, `max*`, `*Count` → `number`
- `*Color`, `*Colour` → `color`

## Examples

See `/examples` directory:
- `devtools-parent.html` / `devtools-child.html` - DevTools demo
- `standalone-devtools-parent.html` / `standalone-devtools-child.html` - file:// compatible
- `practical-examples.ts` - Real-world use cases
- `typed-metadata-example.ts` - Type-safe metadata

## Documentation

- [Metadata Schema Guide](./docs/METADATA_SCHEMA.md) - Complete reference
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
