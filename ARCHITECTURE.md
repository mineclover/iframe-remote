# iframe-remote Architecture

## 📦 Package Overview

2개의 주요 통신 시스템을 제공하는 양방향 iframe 통신 라이브러리

> **Note:** DevTools는 [@packages/web-components](../web-components/)로 마이그레이션되었습니다

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

## 📚 Export Structure

### Main Entry (`./dist/index.js`)
```typescript
// Classes
export { ParentCommunicator, ChildCommunicator }  // Basic
export { ParentRPC, ChildRPC }                    // RPC

// Types
export type { Message, CommunicatorOptions, ... } // Basic types
export type { API, RPCCallMessage, ... }          // RPC types

// Utilities
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
- `iframe-remote.bundle.js` (~20KB) - 개발용
- `iframe-remote.bundle.min.js` (~10KB) - 프로덕션용
- 번들러 없이 바로 사용 가능

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
├── metadata-validator.ts     # Zod schemas
│
└── __tests__/                # Unit tests

examples/
├── standalone-*.html         # Basic demos
└── rpc-*.html                # RPC demos
```

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

### 3. IIFE Bundle
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

| Feature | Basic | RPC |
|---------|-------|-----|
| 타입 안전성 | ⚠️ Partial | ✅ Full |
| 사용 복잡도 | ⭐ Simple | ⭐⭐ Medium |
| 코드 크기 | 🔹 Small | 🔹 Small |
| Use Case | 간단한 통신 | API 호출 |

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

**2개의 시스템:**
1. **Basic** - 기본 메시지 통신
2. **RPC** - 타입 안전 함수 호출

**2개의 배포 형태:**
1. **ESM** - npm 패키지 (TypeScript 지원)
2. **IIFE** - 스크립트 태그용 번들
