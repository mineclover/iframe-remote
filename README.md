# iframe-remote

Type-safe bidirectional iframe communication library with 3 progressive systems.

## 📦 Three Systems

1. **Basic Communication** - Simple message send/receive & request/response
2. **RPC System** - Type-safe remote function calls
3. **DevTools** - Metadata-driven dynamic UI generation

📖 **[Architecture Guide](./ARCHITECTURE.md)** - Detailed system comparison and structure

## Features

- 🔄 **Bidirectional Communication** - Parent ↔ Child iframe messaging
- 🎯 **Type-Safe RPC** - Remote procedure calls with TypeScript type safety
- 🛠️ **DevTools Integration** - Automatic function discovery and remote execution
- 📋 **Metadata Schema** - Rich parameter metadata for UI generation (Zod-validated)
- 🧠 **Auto Type Inference** - Infers parameter types from naming patterns
- 🧩 **Web Component** - Reusable iframe preview component
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
- Development: `iframe-remote.bundle.js` (~25KB)
- Production: `iframe-remote.bundle.min.js` (~12KB minified)

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
- `standalone-child-bundle.html` - Bundle version demo (no module imports!)
- `web-component-demo.html` - Web Component + Bundle demo
- `iframe-preview-component.js` - Reusable Web Component
- `practical-examples.ts` - Real-world use cases
- `typed-metadata-example.ts` - Type-safe metadata
- `iframe-previewer.html` - Multi-frame previewer with zoom/pan/resize controls

### Iframe Previewer

A powerful iframe previewer with multiple frame support and interactive controls:

**Features:**
- 🔍 **Zoom Control** - Zoom in/out (10-300%) with mouse wheel or buttons
- 🖐️ **Pan Control** - Drag to pan the iframe viewport
- 📏 **Resize Control** - Adjust iframe dimensions (100x100 to 3840x2160)
- 🎯 **Multi-Frame** - Add multiple previews to the same screen
- 🔄 **Dynamic URLs** - Load different URLs in each iframe
- 📊 **Real-time Indicators** - Display current zoom level and pan position

**Usage:**
```bash
npm run serve
# Open http://localhost:3000/examples/iframe-previewer.html
```

**Controls per frame:**
- **Move/Click Mode** - Toggle between move mode (pan enabled) and click mode (interact with iframe)
- `+/-` buttons or zoom input to adjust zoom level (10-300%)
- Drag viewport to pan (in move mode)
- Corner handles to resize iframe by dragging
- Width/Height inputs to resize iframe dimensions
- URL input to load different pages
- `⌖` button to reset position
- `✕` button to remove preview
- `+ Add Preview` to add new frames

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
