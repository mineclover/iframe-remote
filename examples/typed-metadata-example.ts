/**
 * Example: Using typed metadata for DevTools functions
 *
 * This example demonstrates how to use the type-safe metadata API
 * to define functions with rich parameter information.
 */

import { createFunctionMeta, validateFunctionMeta, withMeta } from '../src/types-devtools'

// ========================================
// Example 1: Using createFunctionMeta helper
// ========================================

declare global {
  interface Window {
    __updateSettings: typeof updateSettings
    __fetchUserData: typeof fetchUserData
    __setTheme: typeof setTheme
    __configureNotifications: typeof configureNotifications
  }
}

// Simple function with basic metadata
function updateSettings(username: string, email: string, age: number) {
  console.log('Updating settings:', { username, email, age })
  return { success: true, updated: { username, email, age } }
}

// Type-safe metadata using createFunctionMeta
updateSettings.__meta = createFunctionMeta({
  description: '사용자 설정을 업데이트합니다',
  params: [
    {
      name: 'username',
      type: 'string',
      description: '사용자 이름',
      minLength: 3,
      maxLength: 20,
      required: true,
    },
    {
      name: 'email',
      type: 'string',
      description: '이메일 주소',
      pattern: '^[^@]+@[^@]+\\.[^@]+$',
      required: true,
    },
    {
      name: 'age',
      type: 'number',
      description: '나이',
      min: 13,
      max: 120,
      default: 18,
    },
  ],
  returns: {
    type: 'object',
    description: '업데이트 결과',
  },
  examples: ['updateSettings("john", "john@example.com", 25)', 'updateSettings("alice", "alice@test.com")'],
  tags: ['settings', 'user'],
})

// ========================================
// Example 2: Function with select parameter
// ========================================

function setTheme(theme: string, autoSwitch: boolean) {
  console.log('Setting theme:', theme, autoSwitch)
  return { theme, autoSwitch, applied: true }
}

setTheme.__meta = createFunctionMeta({
  description: '테마를 변경합니다',
  params: [
    {
      name: 'theme',
      type: 'select',
      description: '테마 선택',
      options: ['light', 'dark', 'auto', 'high-contrast'],
      default: 'auto',
      required: true,
    },
    {
      name: 'autoSwitch',
      type: 'boolean',
      description: '시간에 따라 자동 전환',
      default: false,
    },
  ],
  tags: ['ui', 'theme'],
})

// ========================================
// Example 3: Async function with rich metadata
// ========================================

async function fetchUserData(userId: string, includePrivate: boolean, fieldsArray: string[]) {
  console.log('Fetching user data:', { userId, includePrivate, fieldsArray })
  await new Promise((resolve) => setTimeout(resolve, 500))
  return {
    userId,
    name: 'Test User',
    fields: fieldsArray,
    private: includePrivate,
  }
}

fetchUserData.__meta = createFunctionMeta({
  description: '사용자 데이터를 가져옵니다 (비동기)',
  params: [
    {
      name: 'userId',
      type: 'string',
      description: '사용자 ID',
      required: true,
      placeholder: 'user-12345',
    },
    {
      name: 'includePrivate',
      type: 'boolean',
      description: '비공개 정보 포함 여부',
      default: false,
    },
    {
      name: 'fieldsArray',
      type: 'array',
      description: '가져올 필드 목록',
      itemType: 'string',
      default: ['name', 'email'],
    },
  ],
  returns: {
    type: 'Promise<object>',
    description: '사용자 데이터 객체',
  },
  examples: [
    'await fetchUserData("user-123", false, ["name", "email"])',
    'await fetchUserData("user-456", true, ["name", "email", "phone"])',
  ],
  tags: ['api', 'user', 'async'],
})

// ========================================
// Example 4: Function with object parameter
// ========================================

function configureNotifications(enabled: boolean, volumeLevel: number, categoriesArray: string[]) {
  console.log('Configuring notifications:', {
    enabled,
    volumeLevel,
    categoriesArray,
  })
  return { success: true, config: { enabled, volumeLevel, categoriesArray } }
}

configureNotifications.__meta = createFunctionMeta({
  description: '알림 설정을 구성합니다',
  params: [
    {
      name: 'enabled',
      type: 'boolean',
      description: '알림 활성화',
      default: true,
    },
    {
      name: 'volumeLevel',
      type: 'number',
      description: '볼륨 레벨 (0-100)',
      min: 0,
      max: 100,
      step: 5,
      default: 50,
    },
    {
      name: 'categoriesArray',
      type: 'array',
      description: '알림 카테고리',
      itemType: 'string',
      default: ['messages', 'updates'],
    },
  ],
  tags: ['notifications', 'settings'],
})

// ========================================
// Example 5: Validation
// ========================================

// Validate metadata before use
const metadata = createFunctionMeta({
  description: 'Test function',
  params: [
    {
      name: 'range',
      type: 'number',
      min: 100,
      max: 10, // Invalid: min > max
    },
  ],
})

const errors = validateFunctionMeta(metadata)
if (errors.length > 0) {
  console.error('Metadata validation errors:', errors)
  // Output: ["Param[0]: Parameter "range": min cannot be greater than max"]
}

// ========================================
// Example 6: Using withMeta helper
// ========================================

const add = withMeta(
  (a: number, b: number) => a + b,
  createFunctionMeta({
    description: '두 숫자를 더합니다',
    params: [
      { name: 'a', type: 'number', description: '첫 번째 숫자', required: true },
      { name: 'b', type: 'number', description: '두 번째 숫자', required: true },
    ],
    returns: {
      type: 'number',
      description: '합계',
    },
  }),
)

// Now add has __meta property with full type safety
console.log(add(5, 3)) // 8
console.log(add.__meta?.description) // "두 숫자를 더합니다"

// ========================================
// Export for global registration
// ========================================

if (typeof window !== 'undefined') {
  window.__updateSettings = updateSettings
  window.__fetchUserData = fetchUserData
  window.__setTheme = setTheme
  window.__configureNotifications = configureNotifications
}

export { updateSettings, fetchUserData, setTheme, configureNotifications, add }
