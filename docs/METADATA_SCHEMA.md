# DevTools Metadata Schema

입력 UI 구성에 필요한 핵심 정보를 제공하는 메타데이터 스키마입니다.

## 설계 철학

**필수만 제공**: UI 구성에 필요한 최소한의 정보만 포함
- 입력 타입 선택을 위한 `type`
- 값의 유효 범위를 정의하는 `min/max`, `options`
- 입력 포맷이 중요한 `date`, `file` 등의 제약 조건

**불필요한 것 제외**: placeholder, helpText, disabled 등 런타임 UI 상태는 제외

## 기본 구조

```typescript
interface ParamMetaBase {
  name: string           // 파라미터 이름 (필수)
  type?: ParamType      // 입력 타입 (input widget 결정)
  description?: string  // 설명
  default?: any        // 기본값
  required?: boolean   // 필수 여부
}
```

## 입력 타입별 메타데이터

### 1. Select (Enum) - 선택지가 정해진 경우

**가장 중요**: 입력하기 어려운 enum 값들을 제공

```typescript
{
  name: 'theme',
  type: 'select',
  options: ['light', 'dark', 'auto'],  // 선택 가능한 값들
  default: 'auto'
}
```

**Label-Value 쌍으로 제공:**
```typescript
{
  name: 'speed',
  type: 'select',
  options: [
    { label: 'Slow (0.5x)', value: 0.5 },
    { label: 'Normal (1x)', value: 1 },
    { label: 'Fast (2x)', value: 2 }
  ],
  default: 1
}
```

### 2. Range - 슬라이더로 범위 조절

```typescript
{
  name: 'opacity',
  type: 'range',
  min: 0,        // 최소값
  max: 1,        // 최대값
  step: 0.1,     // 증감 단위
  default: 1
}
```

### 3. Number - 숫자 입력

```typescript
{
  name: 'count',
  type: 'number',
  min: 1,        // 최소값
  max: 100,      // 최대값
  step: 1,       // 증감 단위
  default: 10
}
```

### 4. Date/Time - 날짜/시간 포맷

**중요**: 입력 포맷을 정확히 전달

```typescript
// Date
{
  name: 'startDate',
  type: 'date',
  min: '2024-01-01',  // ISO format
  max: '2024-12-31'
}

// Time
{
  name: 'reminderTime',
  type: 'time',
  default: '09:00'    // HH:MM format
}

// DateTime
{
  name: 'scheduledAt',
  type: 'datetime',
  min: '2024-01-01T00:00'  // ISO datetime format
}
```

### 5. File - 파일 업로드 제약

```typescript
{
  name: 'image',
  type: 'file',
  accept: 'image/*',              // MIME type or extensions
  maxSize: 5 * 1024 * 1024,      // bytes (5MB)
  multiple: false                 // 다중 파일 허용 여부
}

// Multiple files with extensions
{
  name: 'documents',
  type: 'file',
  accept: '.pdf,.doc,.docx',
  multiple: true,
  maxSize: 10 * 1024 * 1024      // per file
}
```

### 6. Color - 색상 선택

```typescript
{
  name: 'backgroundColor',
  type: 'color',
  default: '#667eea'   // hex color
}
```

### 7. Boolean - 체크박스

```typescript
{
  name: 'enabled',
  type: 'boolean',
  default: true
}
```

### 8. Textarea - 여러 줄 텍스트

```typescript
{
  name: 'script',
  type: 'textarea',
  rows: 8          // 표시할 줄 수
}
```

### 9. String - 문자열 입력

```typescript
// Basic text
{
  name: 'username',
  type: 'string'
}

// Email with validation
{
  name: 'email',
  type: 'email',
  pattern: '^[^@]+@[^@]+\\.[^@]+$'  // regex
}

// URL
{
  name: 'website',
  type: 'url'
}

// Phone
{
  name: 'phone',
  type: 'tel'
}
```

### 10. JSON - 복잡한 객체

```typescript
{
  name: 'config',
  type: 'json',
  default: {
    host: 'localhost',
    port: 3000,
    ssl: false
  }
}
```

### 11. Array - 배열 입력

```typescript
{
  name: 'tags',
  type: 'array',
  itemType: 'string',  // 배열 요소 타입
  default: ['tag1', 'tag2']
}
```

## 실전 예제

### 예제 1: 테마 설정

```typescript
window.__setTheme = function(theme) {
  document.body.className = `theme-${theme}`
  return { applied: theme }
}

window.__setTheme.__meta = createFunctionMeta({
  description: '테마 변경',
  params: [{
    name: 'theme',
    type: 'select',
    options: ['light', 'dark', 'auto', 'high-contrast'],
    default: 'auto',
    required: true
  }]
})
```

### 예제 2: 그라데이션 설정

```typescript
window.__setGradient = function(startColor, endColor, angle, opacity) {
  const gradient = `linear-gradient(${angle}deg, ${startColor}, ${endColor})`
  return { gradient, opacity }
}

window.__setGradient.__meta = createFunctionMeta({
  description: '그라데이션 배경 설정',
  params: [
    {
      name: 'startColor',
      type: 'color',
      default: '#667eea'
    },
    {
      name: 'endColor',
      type: 'color',
      default: '#764ba2'
    },
    {
      name: 'angle',
      type: 'range',
      min: 0,
      max: 360,
      step: 15,
      default: 135
    },
    {
      name: 'opacity',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.05,
      default: 1
    }
  ]
})
```

### 예제 3: 작업 예약

```typescript
window.__scheduleTask = function(scheduledDate, reminderTime) {
  return { task: 'scheduled', date: scheduledDate, reminder: reminderTime }
}

window.__scheduleTask.__meta = createFunctionMeta({
  description: '작업 예약',
  params: [
    {
      name: 'scheduledDate',
      type: 'date',
      min: new Date().toISOString().split('T')[0]  // Today
    },
    {
      name: 'reminderTime',
      type: 'time',
      default: '09:00'
    }
  ]
})
```

### 예제 4: 파일 업로드

```typescript
window.__uploadAsset = function(imageFile) {
  return { uploaded: true, name: imageFile.name, size: imageFile.size }
}

window.__uploadAsset.__meta = createFunctionMeta({
  description: '이미지 업로드',
  params: [{
    name: 'imageFile',
    type: 'file',
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024  // 5MB
  }]
})
```

### 예제 5: 복합 필터

```typescript
window.__filterData = function(
  category, dateFrom, dateTo, minScore, includeArchived, sortBy
) {
  return { filters: { category, dateFrom, dateTo, minScore, includeArchived, sortBy } }
}

window.__filterData.__meta = createFunctionMeta({
  description: '데이터 필터링',
  params: [
    {
      name: 'category',
      type: 'select',
      options: ['all', 'posts', 'comments', 'users'],
      default: 'all'
    },
    {
      name: 'dateFrom',
      type: 'date'
    },
    {
      name: 'dateTo',
      type: 'date'
    },
    {
      name: 'minScore',
      type: 'number',
      min: 0,
      max: 100,
      default: 0
    },
    {
      name: 'includeArchived',
      type: 'boolean',
      default: false
    },
    {
      name: 'sortBy',
      type: 'select',
      options: [
        { label: 'Date (Newest)', value: 'date_desc' },
        { label: 'Date (Oldest)', value: 'date_asc' },
        { label: 'Score (High)', value: 'score_desc' }
      ],
      default: 'date_desc'
    }
  ]
})
```

## 핵심 원칙

### 1. Type - 입력 위젯 결정
- `select` → dropdown
- `range` → slider
- `date` → date picker
- `file` → file input
- `color` → color picker
- `boolean` → checkbox
- `number` → number input
- `textarea` → multi-line text

### 2. Options - Enum 값 제공
- 하드코딩된 선택지를 명시적으로 제공
- Label-Value 쌍으로 사용자 친화적 표시

### 3. Min/Max - 유효 범위 제한
- Number, Range: 숫자 범위
- Date/Time: 날짜/시간 범위
- File: 파일 크기

### 4. Format - 입력 포맷 명시
- Date: ISO format (YYYY-MM-DD)
- Time: HH:MM format
- DateTime: ISO datetime format
- File: MIME types or extensions

## 메타데이터 없이 자동 추론

DevTools는 메타데이터가 없어도 파라미터 이름으로 타입 추론:

```typescript
// 메타데이터 없이 작성
window.__updateConfig = function(isEnabled, maxRetries, backgroundColor) {
  // isEnabled → boolean (checkbox)
  // maxRetries → number (number input)
  // backgroundColor → color (color picker)
}

// 정밀 제어가 필요하면 메타데이터 추가
window.__updateConfig.__meta = createFunctionMeta({
  params: [
    { name: 'isEnabled', type: 'boolean', default: true },
    { name: 'maxRetries', type: 'number', min: 1, max: 10, default: 3 },
    { name: 'backgroundColor', type: 'color', default: '#667eea' }
  ]
})
```

## 언제 메타데이터를 사용할까?

**필수인 경우:**
- ✅ Select/Enum: 선택 가능한 옵션 명시
- ✅ Range: 슬라이더 범위 지정
- ✅ File: 파일 타입, 크기 제한
- ✅ Date: 날짜 범위, 포맷
- ✅ Number: 정확한 min/max 제약

**선택 사항:**
- 🤔 Boolean, String, Color: 이름으로 추론 가능
- 🤔 Description: 문서화 목적

## 참고

- 전체 예제: [practical-examples.ts](../examples/practical-examples.ts)
- 타입 정의: [types-devtools.ts](../src/types-devtools.ts)
