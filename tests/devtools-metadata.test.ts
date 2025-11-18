/**
 * Tests for DevTools metadata transmission
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ChildDevTools, ParentDevTools, createFunctionMeta } from '../src/index'

describe('DevTools Metadata', () => {
  let childDevTools: ChildDevTools
  let parentDevTools: ParentDevTools
  let iframe: HTMLIFrameElement

  beforeEach(() => {
    // Create iframe
    iframe = document.createElement('iframe')
    document.body.appendChild(iframe)

    // Setup child in iframe
    const iframeWindow = iframe.contentWindow!
    ;(iframeWindow as any).window = iframeWindow

    // Define test function with metadata in iframe
    ;(iframeWindow as any).__testFunction = function (
      name: string,
      age: number,
      isActive: boolean
    ) {
      return { name, age, isActive }
    }
    ;(iframeWindow as any).__testFunction.__meta = createFunctionMeta({
      description: 'Test function with metadata',
      params: [
        {
          name: 'name',
          type: 'string',
          description: 'User name',
          required: true,
        },
        {
          name: 'age',
          type: 'number',
          description: 'User age',
          min: 0,
          max: 120,
          default: 18,
        },
        {
          name: 'isActive',
          type: 'boolean',
          description: 'Active status',
          default: true,
        },
      ],
      returns: {
        type: 'object',
        description: 'User data',
      },
      tags: ['user', 'test'],
    })

    // Define function with select parameter
    ;(iframeWindow as any).__selectTheme = function (theme: string) {
      return { theme }
    }
    ;(iframeWindow as any).__selectTheme.__meta = createFunctionMeta({
      description: 'Select theme',
      params: [
        {
          name: 'theme',
          type: 'select',
          options: ['light', 'dark', 'auto'],
          default: 'auto',
        },
      ],
    })

    // Define function WITHOUT metadata (for auto-inference testing)
    ;(iframeWindow as any).__autoInferred = function (
      isEnabled: boolean,
      maxRetries: number,
      backgroundColor: string
    ) {
      return { isEnabled, maxRetries, backgroundColor }
    }

    // Initialize child DevTools in iframe context
    const ChildDevToolsClass = ChildDevTools as any
    childDevTools = new ChildDevToolsClass({
      functionPattern: /^__/,
      debug: true,
    })

    // Initialize parent DevTools
    parentDevTools = new ParentDevTools(iframeWindow, {
      targetOrigin: '*',
    })
  })

  afterEach(() => {
    childDevTools?.destroy()
    parentDevTools?.destroy()
    document.body.removeChild(iframe)
  })

  it('should transmit function metadata from child to parent', async () => {
    // Get function list from child
    const functions = await parentDevTools.listFunctions()

    // Find the test function
    const testFunc = functions.find((f) => f.name === '__testFunction')
    expect(testFunc).toBeDefined()

    // Verify basic info
    expect(testFunc?.name).toBe('__testFunction')
    expect(testFunc?.type).toBe('function')
    expect(testFunc?.description).toBe('Test function with metadata')

    // Verify parameter metadata is transmitted
    expect(testFunc?.paramsMeta).toBeDefined()
    expect(testFunc?.paramsMeta?.length).toBe(3)

    // Verify first parameter (name)
    const nameParam = testFunc?.paramsMeta?.[0]
    expect(nameParam?.name).toBe('name')
    expect(nameParam?.type).toBe('string')
    expect(nameParam?.description).toBe('User name')
    expect(nameParam?.required).toBe(true)

    // Verify second parameter (age)
    const ageParam = testFunc?.paramsMeta?.[1]
    expect(ageParam?.name).toBe('age')
    expect(ageParam?.type).toBe('number')
    expect(ageParam?.description).toBe('User age')
    expect(ageParam?.min).toBe(0)
    expect(ageParam?.max).toBe(120)
    expect(ageParam?.default).toBe(18)

    // Verify third parameter (isActive)
    const isActiveParam = testFunc?.paramsMeta?.[2]
    expect(isActiveParam?.name).toBe('isActive')
    expect(isActiveParam?.type).toBe('boolean')
    expect(isActiveParam?.description).toBe('Active status')
    expect(isActiveParam?.default).toBe(true)
  })

  it('should transmit select parameter options', async () => {
    const functions = await parentDevTools.listFunctions()
    const selectFunc = functions.find((f) => f.name === '__selectTheme')

    expect(selectFunc?.paramsMeta).toBeDefined()
    expect(selectFunc?.paramsMeta?.length).toBe(1)

    const themeParam = selectFunc?.paramsMeta?.[0]
    expect(themeParam?.name).toBe('theme')
    expect(themeParam?.type).toBe('select')
    expect(themeParam?.options).toEqual(['light', 'dark', 'auto'])
    expect(themeParam?.default).toBe('auto')
  })

  it('should extract parameters even without metadata', async () => {
    const functions = await parentDevTools.listFunctions()
    const autoFunc = functions.find((f) => f.name === '__autoInferred')

    expect(autoFunc).toBeDefined()
    expect(autoFunc?.params).toBeDefined()
    expect(autoFunc?.params.length).toBe(3)

    // Verify parameter names are extracted from source
    expect(autoFunc?.params[0].name).toBe('isEnabled')
    expect(autoFunc?.params[1].name).toBe('maxRetries')
    expect(autoFunc?.params[2].name).toBe('backgroundColor')

    // Verify paramsMeta is empty (no metadata provided)
    expect(autoFunc?.paramsMeta).toEqual([])
  })

  it('should include both params and paramsMeta', async () => {
    const functions = await parentDevTools.listFunctions()
    const testFunc = functions.find((f) => f.name === '__testFunction')

    // Should have both extracted params AND metadata params
    expect(testFunc?.params).toBeDefined()
    expect(testFunc?.params.length).toBe(3)
    expect(testFunc?.paramsMeta).toBeDefined()
    expect(testFunc?.paramsMeta?.length).toBe(3)

    // params should have basic info (name)
    expect(testFunc?.params[0].name).toBe('name')
    expect(testFunc?.params[1].name).toBe('age')
    expect(testFunc?.params[2].name).toBe('isActive')

    // paramsMeta should have rich info (type, description, etc)
    expect(testFunc?.paramsMeta?.[0].type).toBe('string')
    expect(testFunc?.paramsMeta?.[0].description).toBe('User name')
  })

  it('should execute function with metadata', async () => {
    // Call the function with proper arguments
    const result = await parentDevTools.callFunction('__testFunction', 'Alice', 25, true)

    expect(result).toEqual({
      name: 'Alice',
      age: 25,
      isActive: true,
    })
  })
})
