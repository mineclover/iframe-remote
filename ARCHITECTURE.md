# iframe-remote Architecture

## 📦 Package Overview

3개의 주요 통신 시스템을 제공하는 양방향 iframe 통신 라이브러리

---

## 🎯 Core Systems

### 1. **Basic Communication** (기본 통신)
```typescript
import { ParentCommunicator, ChildCommunicator } from '@packages/iframe-remote'
```

**목적:** 간단한 메시지 송수신 및 요청-응답 패턴

**사용 예시:**
```typescript
// Parent
const parent = new ParentCommunicator(iframeWindow, {
  onMessage: (data) => console.log('Received:', data),
});
parent.send({ type: 'update', payload: 'hello' });

// Child
const child = new ChildCommunicator({
  onRequest: async (data) => ({ result: 'ok' })
});
```

**특징:**
- 단순한 postMessage 래핑
- 타임아웃 지원
- 에러 핸들링

---

### 2. **RPC System** (타입 안전 원격 함수 호출)
```typescript
import { ParentRPC, ChildRPC } from '@packages/iframe-remote'
```

**목적:** 타입 안전한 함수 호출 (마치 로컬 함수처럼)

**사용 예시:**
```typescript
// Child: API 정의
const childRPC = new ChildRPC({
  add: (a: number, b: number) => a + b,
  greet: (name: string) => `Hello, ${name}!`
});

// Parent: 타입 안전하게 호출
const parentRPC = new ParentRPC<typeof childRPC.handler>(iframeWindow);
const result = await parentRPC.call('add', 10, 20); // 30
```

**특징:**
- TypeScript 타입 추론
- 자동 직렬화/역직렬화
- 에러 전파 (RPCError)

---

### 3. **DevTools** (메타데이터 기반 개발자 도구)
```typescript
import { ParentDevTools, ChildDevTools } from '@packages/iframe-remote'
```

**목적:** 런타임에 메타데이터를 기반으로 동적 UI 생성

**사용 예시:**
```typescript
// Child: 함수 + 메타데이터 등록
const childDevTools = new ChildDevTools({
  animate: withMeta(
    (duration: number, easing: string) => { /* animate */ },
    {
      params: [
        { name: 'duration', type: 'number', min: 0, max: 5000, default: 1000 },
        { name: 'easing', type: 'select', options: ['linear', 'ease-in', 'ease-out'] }
      ]
    }
  )
});

// Parent: 메타데이터로 UI 자동 생성
const functions = await parentDevTools.getFunctions();
// 각 파라미터 타입에 맞는 input 컨트롤 렌더링
```

**특징:**
- Zod 기반 메타데이터 검증
- 타입 안전성 + 런타임 UI 생성
- 10가지 파라미터 타입 지원 (number, string, boolean, select, color, etc.)

---

## 📚 Export Structure

### Main Entry (`./dist/index.js`)
```typescript
// Classes
export { ParentCommunicator, ChildCommunicator }  // Basic
export { ParentRPC, ChildRPC }                    // RPC
export { ParentDevTools, ChildDevTools }          // DevTools

// Types
export type { Message, CommunicatorOptions, ... } // Basic types
export type { API, RPCCallMessage, ... }          // RPC types
export type { ParamMeta, FunctionMeta, ... }      // DevTools types

// Utilities
export { createFunctionMeta, withMeta }           // DevTools helpers
export { validateParamMeta, ... }                 // Zod validators
export { RPCError }                               // RPC error class
```

### Subpath Exports
```typescript
import { ParentCommunicator } from '@packages/iframe-remote/parent'
import { ChildCommunicator } from '@packages/iframe-remote/child'
```

---

## 🌐 Distribution Formats

### 1. **ES Module** (npm package)
```typescript
import { ParentRPC, ChildRPC } from '@packages/iframe-remote'
```
- TypeScript 타입 정의 포함
- Tree-shaking 지원
- 번들러 통합 (Vite, webpack, etc.)

### 2. **IIFE Bundle** (CDN/standalone)
```html
<script src="./dist/iframe-remote.bundle.js"></script>
<script>
  const { ParentCommunicator } = window.IframeRemote;
</script>
```
- `iframe-remote.bundle.js` (~25KB) - 개발용
- `iframe-remote.bundle.min.js` (~12KB) - 프로덕션용
- 번들러 없이 바로 사용 가능

---

## 🧩 Bonus: Web Component

**위치:** `examples/iframe-preview-component.js` (별도 파일)

```html
<iframe-preview
  id="preview-1"
  url="./child.html"
  width="800"
  height="600">
</iframe-preview>

<script type="module">
  import './iframe-preview-component.js';

  const preview = document.getElementById('preview-1');
  const iframe = preview.getIframe();
  const contentWindow = preview.getContentWindow();
  preview.setMode('click'); // or 'move'
</script>
```

**특징:**
- Borderless Segmented Toolbar 디자인
- Zoom, Pan, Resize 기능
- 마우스 + 터치 드래그 지원
- Shadow DOM 미사용 (iframe 접근 용이)

---

## 📂 Source Structure

```
src/
├── index.ts                  # Main entry point
├── bundle-entry.ts           # IIFE bundle entry
│
├── parent.ts                 # ParentCommunicator
├── child.ts                  # ChildCommunicator
├── types.ts                  # Basic types
│
├── rpc.ts                    # ParentRPC, ChildRPC
├── types-rpc.ts              # RPC types
│
├── devtools.ts               # ParentDevTools, ChildDevTools
├── types-devtools.ts         # DevTools types & helpers
├── metadata-validator.ts     # Zod schemas
│
└── __tests__/                # Unit tests

examples/
├── iframe-preview-component.js  # Web Component
├── web-component-demo.html      # Component demo
├── iframe-previewer.html        # Multi-preview demo
├── standalone-*.html            # Basic demos
├── rpc-*.html                   # RPC demos
└── devtools-*.html              # DevTools demos
```

---

## 🎨 Design Pattern: Borderless Segmented Toolbar

웹 컴포넌트와 예제에서 사용하는 디자인 컨셉:
- **Zero padding** - 모든 요소의 padding을 0으로
- **Border separators** - `border-right: 1px solid` 로 구분
- **Flexbox stretch** - `align-items: stretch` 로 높이 통일
- **Fixed heights** - 일관된 높이 (header: 32px, controls: 28px)
- **VS Code 스타일** - 어두운 테마, flat 디자인

---

## 🚀 Quick Start

### 1. Basic Communication
```bash
npm install @packages/iframe-remote
```

```typescript
// Parent
import { ParentCommunicator } from '@packages/iframe-remote/parent';
const comm = new ParentCommunicator(iframe.contentWindow);
comm.send({ type: 'hello' });

// Child
import { ChildCommunicator } from '@packages/iframe-remote/child';
const comm = new ChildCommunicator({
  onMessage: (data) => console.log(data)
});
```

### 2. RPC System
```typescript
// Child
import { ChildRPC } from '@packages/iframe-remote';
const rpc = new ChildRPC({
  add: (a: number, b: number) => a + b
});

// Parent
import { ParentRPC } from '@packages/iframe-remote';
const rpc = new ParentRPC<{ add: (a: number, b: number) => number }>(
  iframe.contentWindow
);
const result = await rpc.call('add', 10, 20);
```

### 3. DevTools
```typescript
// Child
import { ChildDevTools, withMeta } from '@packages/iframe-remote';
const devtools = new ChildDevTools({
  setColor: withMeta(
    (color: string) => document.body.style.background = color,
    { params: [{ name: 'color', type: 'color', default: '#ffffff' }] }
  )
});

// Parent
import { ParentDevTools } from '@packages/iframe-remote';
const devtools = new ParentDevTools(iframe.contentWindow);
const functions = await devtools.getFunctions();
// UI 생성 로직...
```

### 4. IIFE Bundle
```html
<!-- Child -->
<script src="./dist/iframe-remote.bundle.js"></script>
<script>
  const { ChildCommunicator } = window.IframeRemote;
  const comm = new ChildCommunicator({
    onMessage: (data) => console.log(data)
  });
</script>

<!-- Parent -->
<script src="./dist/iframe-remote.bundle.js"></script>
<script>
  const { ParentCommunicator } = window.IframeRemote;
  const comm = new ParentCommunicator(iframe.contentWindow);
</script>
```

---

## 📊 Comparison Matrix

| Feature | Basic | RPC | DevTools |
|---------|-------|-----|----------|
| 타입 안전성 | ⚠️ Partial | ✅ Full | ✅ Full |
| 사용 복잡도 | ⭐ Simple | ⭐⭐ Medium | ⭐⭐⭐ Advanced |
| 런타임 UI | ❌ | ❌ | ✅ |
| 코드 크기 | 🔹 Small | 🔹 Small | 🔸 Medium |
| 메타데이터 | ❌ | ❌ | ✅ Zod schema |
| Use Case | 간단한 통신 | API 호출 | 개발자 도구 |

---

## 🧪 Testing

```bash
# Unit tests (vitest)
npm run test:unit

# E2E tests (playwright)
npm run test:e2e

# All tests
npm test

# Watch mode
npm run test:watch
```

---

## 📝 Summary

**3개의 시스템:**
1. **Basic** - 기본 메시지 통신
2. **RPC** - 타입 안전 함수 호출
3. **DevTools** - 메타데이터 기반 동적 UI

**2개의 배포 형태:**
1. **ESM** - npm 패키지 (TypeScript 지원)
2. **IIFE** - 스크립트 태그용 번들

**보너스:**
- **Web Component** - iframe 프리뷰 컴포넌트 (예제용)
