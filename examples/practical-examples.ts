/**
 * Practical Real-World Examples
 *
 * 입력 구성에 필요한 핵심 메타데이터 활용 예제
 */

import { createFunctionMeta } from '../src/types-devtools'

declare global {
  interface Window {
    // Animation controls
    __playAnimation: typeof playAnimation
    __setAnimationSpeed: typeof setAnimationSpeed

    // UI configuration
    __setTheme: typeof setTheme
    __updateLayout: typeof updateLayout

    // Data operations
    __filterData: typeof filterData
    __scheduleTask: typeof scheduleTask

    // File operations
    __uploadAsset: typeof uploadAsset
    __exportData: typeof exportData

    // Advanced inputs
    __configureServer: typeof configureServer
    __setGradient: typeof setGradient
  }
}

// ========================================
// 1. Enum/Select - 선택 옵션이 정해진 경우
// ========================================

function setTheme(theme: string) {
  document.body.className = `theme-${theme}`
  return { applied: theme }
}

setTheme.__meta = createFunctionMeta({
  description: '테마 변경',
  params: [
    {
      name: 'theme',
      type: 'select',
      options: ['light', 'dark', 'auto', 'high-contrast'],
      default: 'auto',
      required: true,
    },
  ],
})

// Label-Value 쌍으로 옵션 제공
function setAnimationSpeed(speed: number) {
  return { speed }
}

setAnimationSpeed.__meta = createFunctionMeta({
  description: '애니메이션 속도 설정',
  params: [
    {
      name: 'speed',
      type: 'select',
      options: [
        { label: 'Slow (0.5x)', value: 0.5 },
        { label: 'Normal (1x)', value: 1 },
        { label: 'Fast (2x)', value: 2 },
        { label: 'Very Fast (4x)', value: 4 },
      ],
      default: 1,
    },
  ],
})

// ========================================
// 2. Range - 슬라이더로 범위 조절
// ========================================

function updateLayout(opacity: number, scale: number) {
  return { opacity, scale }
}

updateLayout.__meta = createFunctionMeta({
  description: 'UI 레이아웃 조정',
  params: [
    {
      name: 'opacity',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.1,
      default: 1,
      description: '투명도 (0-1)',
    },
    {
      name: 'scale',
      type: 'range',
      min: 0.5,
      max: 2,
      step: 0.1,
      default: 1,
      description: '크기 배율',
    },
  ],
})

// ========================================
// 3. Date/Time - 날짜/시간 입력 포맷
// ========================================

function scheduleTask(scheduledDate: string, reminderTime: string) {
  return {
    task: 'scheduled',
    date: scheduledDate,
    reminder: reminderTime,
  }
}

scheduleTask.__meta = createFunctionMeta({
  description: '작업 예약',
  params: [
    {
      name: 'scheduledDate',
      type: 'date',
      min: new Date().toISOString().split('T')[0], // Today
      description: '실행 날짜',
    },
    {
      name: 'reminderTime',
      type: 'time',
      default: '09:00',
      description: '알림 시간',
    },
  ],
})

// ========================================
// 4. File Upload - 파일 타입 제한
// ========================================

function uploadAsset(imageFile: File) {
  return {
    uploaded: true,
    name: imageFile.name,
    size: imageFile.size,
  }
}

uploadAsset.__meta = createFunctionMeta({
  description: '이미지 업로드',
  params: [
    {
      name: 'imageFile',
      type: 'file',
      accept: 'image/*',
      maxSize: 5 * 1024 * 1024, // 5MB
      description: '이미지 파일 (최대 5MB)',
    },
  ],
})

function exportData(format: string, files: FileList) {
  return { format, fileCount: files.length }
}

exportData.__meta = createFunctionMeta({
  description: '데이터 내보내기',
  params: [
    {
      name: 'format',
      type: 'select',
      options: ['json', 'csv', 'xml'],
      default: 'json',
    },
    {
      name: 'files',
      type: 'file',
      accept: '.json,.csv,.xml',
      multiple: true,
      maxSize: 10 * 1024 * 1024, // 10MB per file
    },
  ],
})

// ========================================
// 5. Textarea - 여러 줄 텍스트 입력
// ========================================

function playAnimation(script: string, loop: boolean) {
  return { script, loop }
}

playAnimation.__meta = createFunctionMeta({
  description: '애니메이션 스크립트 실행',
  params: [
    {
      name: 'script',
      type: 'textarea',
      rows: 8,
      description: '애니메이션 스크립트 (GSAP 코드)',
    },
    {
      name: 'loop',
      type: 'boolean',
      default: false,
      description: '반복 재생',
    },
  ],
})

// ========================================
// 6. JSON - 복잡한 설정 객체
// ========================================

function configureServer(config: any) {
  return { configured: true, config }
}

configureServer.__meta = createFunctionMeta({
  description: '서버 설정',
  params: [
    {
      name: 'config',
      type: 'json',
      default: {
        host: 'localhost',
        port: 3000,
        ssl: false,
        timeout: 5000,
      },
      description: '서버 설정 JSON',
    },
  ],
})

// ========================================
// 7. Color + Number - 그라데이션 설정
// ========================================

function setGradient(startColor: string, endColor: string, angle: number, opacity: number) {
  const gradient = `linear-gradient(${angle}deg, ${startColor}, ${endColor})`
  return { gradient, opacity }
}

setGradient.__meta = createFunctionMeta({
  description: '그라데이션 배경 설정',
  params: [
    {
      name: 'startColor',
      type: 'color',
      default: '#667eea',
      description: '시작 색상',
    },
    {
      name: 'endColor',
      type: 'color',
      default: '#764ba2',
      description: '끝 색상',
    },
    {
      name: 'angle',
      type: 'range',
      min: 0,
      max: 360,
      step: 15,
      default: 135,
      description: '그라데이션 각도 (0-360°)',
    },
    {
      name: 'opacity',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.05,
      default: 1,
      description: '투명도',
    },
  ],
})

// ========================================
// 8. 복합 예제 - 데이터 필터링
// ========================================

function filterData(
  category: string,
  dateFrom: string,
  dateTo: string,
  minScore: number,
  includeArchived: boolean,
  sortBy: string,
) {
  return {
    filters: { category, dateFrom, dateTo, minScore, includeArchived, sortBy },
    results: [],
  }
}

filterData.__meta = createFunctionMeta({
  description: '데이터 필터링',
  params: [
    {
      name: 'category',
      type: 'select',
      options: ['all', 'posts', 'comments', 'users', 'media'],
      default: 'all',
      description: '카테고리',
    },
    {
      name: 'dateFrom',
      type: 'date',
      description: '시작 날짜',
    },
    {
      name: 'dateTo',
      type: 'date',
      description: '종료 날짜',
    },
    {
      name: 'minScore',
      type: 'number',
      min: 0,
      max: 100,
      default: 0,
      description: '최소 점수',
    },
    {
      name: 'includeArchived',
      type: 'boolean',
      default: false,
      description: '보관된 항목 포함',
    },
    {
      name: 'sortBy',
      type: 'select',
      options: [
        { label: 'Date (Newest)', value: 'date_desc' },
        { label: 'Date (Oldest)', value: 'date_asc' },
        { label: 'Score (High to Low)', value: 'score_desc' },
        { label: 'Score (Low to High)', value: 'score_asc' },
        { label: 'Title (A-Z)', value: 'title_asc' },
      ],
      default: 'date_desc',
      description: '정렬 기준',
    },
  ],
  tags: ['data', 'filter', 'search'],
})

// ========================================
// Export for window registration
// ========================================

if (typeof window !== 'undefined') {
  window.__setTheme = setTheme
  window.__setAnimationSpeed = setAnimationSpeed
  window.__updateLayout = updateLayout
  window.__scheduleTask = scheduleTask
  window.__uploadAsset = uploadAsset
  window.__exportData = exportData
  window.__playAnimation = playAnimation
  window.__configureServer = configureServer
  window.__setGradient = setGradient
  window.__filterData = filterData
}

export {
  setTheme,
  setAnimationSpeed,
  updateLayout,
  scheduleTask,
  uploadAsset,
  exportData,
  playAnimation,
  configureServer,
  setGradient,
  filterData,
}
