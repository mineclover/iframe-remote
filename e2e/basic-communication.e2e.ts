/**
 * E2E tests for basic communication protocol
 */

import { expect, test } from '@playwright/test'

test.describe('Basic Communication Protocol', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/devtools-parent.html')
    await page.waitForLoadState('networkidle')
    // Wait for iframe to load
    await page.waitForTimeout(500)
  })

  test('should establish connection between parent and child', async ({ page }) => {
    // Check if parent page loaded
    await expect(page.locator('h1')).toContainText('DevTools Parent')

    // Check if iframe loaded
    const iframe = page.frameLocator('#child-iframe')
    await expect(iframe.locator('h2')).toContainText('DevTools Child')
  })

  test('should list functions from child', async ({ page }) => {
    // Wait for functions to be loaded
    await page.waitForSelector('.function-item', { timeout: 5000 })

    // Check that functions are listed
    const functionItems = page.locator('.function-item')
    const count = await functionItems.count()
    expect(count).toBeGreaterThan(0)

    // Check for expected functions
    const functionNames = await functionItems.allTextContents()
    expect(functionNames.some((name) => name.includes('__getUserInfo'))).toBe(true)
    expect(functionNames.some((name) => name.includes('__getPageData'))).toBe(true)
  })

  test('should execute function and show result', async ({ page }) => {
    // Wait for functions list
    await page.waitForSelector('.function-item')

    // Click on __getUserInfo
    await page.click('text=__getUserInfo')

    // Click execute button
    await page.click('#execute-btn')

    // Wait for result
    await page.waitForSelector('.result.success')

    // Check result contains expected data
    const result = await page.locator('.result').textContent()
    expect(result).toContain('name')
    expect(result).toContain('role')
    expect(result).toContain('timestamp')
  })

  test('should handle function with parameters', async ({ page }) => {
    await page.waitForSelector('.function-item')

    // Click on __add function
    await page.click('text=__add')

    // Wait for auto-generated inputs
    await page.waitForSelector('#auto-inputs input', { timeout: 2000 })

    // Get input fields
    const inputs = page.locator('#auto-inputs input[type="number"]')
    const inputCount = await inputs.count()
    expect(inputCount).toBe(2)

    // Fill in values
    await inputs.nth(0).fill('5')
    await inputs.nth(1).fill('3')

    // Execute
    await page.click('#execute-btn')

    // Check result
    await page.waitForSelector('.result.success')
    const result = await page.locator('.result').textContent()
    expect(result).toContain('8')
  })

  test('should handle async function', async ({ page }) => {
    await page.waitForSelector('.function-item')

    // Click async function
    await page.click('text=__asyncOperation')

    // Fill delay parameter
    await page.waitForSelector('#auto-inputs input')
    await page.locator('#auto-inputs input').first().fill('100')

    // Execute
    await page.click('#execute-btn')

    // Should show loading state
    const btnText = await page.locator('#execute-btn').textContent()
    expect(btnText).toContain('Executing')

    // Wait for result
    await page.waitForSelector('.result.success', { timeout: 3000 })
    const result = await page.locator('.result').textContent()
    expect(result).toContain('completed')
  })

  test('should refresh function list', async ({ page }) => {
    await page.waitForSelector('.function-item')

    const _initialCount = await page.locator('.function-item').count()

    // Click refresh button
    await page.click('#refresh-btn')

    // Wait for refresh to complete
    await page.waitForTimeout(200)

    // Count should be the same (or potentially different if functions changed)
    const newCount = await page.locator('.function-item').count()
    expect(newCount).toBeGreaterThan(0)
  })

  test('should show connection status', async ({ page }) => {
    // Check for connection indicators
    const logContent = await page.locator('#communication-log').textContent()
    expect(logContent).toBeTruthy()
  })
})
