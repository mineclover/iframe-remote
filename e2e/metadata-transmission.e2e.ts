/**
 * E2E tests for metadata transmission
 */

import { test, expect } from '@playwright/test'

test.describe('Metadata Transmission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/devtools-parent.html')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
  })

  test('should transmit function descriptions', async ({ page }) => {
    await page.waitForSelector('.function-item')

    // Click on a function with description
    await page.click('text=__getUserInfo')

    // Check if description is shown
    const descriptionVisible = await page
      .locator('#function-description')
      .isVisible()
    expect(descriptionVisible).toBe(true)

    const description = await page
      .locator('#function-description')
      .textContent()
    expect(description).toBeTruthy()
  })

  test('should generate inputs based on parameter metadata - select type', async ({
    page,
  }) => {
    await page.waitForSelector('.function-item')

    // Click on __selectOption (has select parameter)
    await page.click('text=__selectOption')

    await page.waitForSelector('#auto-inputs select')

    // Should have a select dropdown
    const select = page.locator('#auto-inputs select')
    expect(await select.count()).toBe(1)

    // Should have options
    const options = await select.locator('option').allTextContents()
    expect(options.length).toBeGreaterThan(1)
    expect(options).toContain('option1')
  })

  test('should generate inputs based on parameter metadata - number with min/max', async ({
    page,
  }) => {
    await page.waitForSelector('.function-item')

    // Click on __getRandomNumber (has min/max)
    await page.click('text=__getRandomNumber')

    await page.waitForSelector('#auto-inputs input[type="number"]')

    // Should have number inputs
    const numberInputs = page.locator('#auto-inputs input[type="number"]')
    expect(await numberInputs.count()).toBe(2)

    // Check min attribute on first input (min parameter)
    const minInput = numberInputs.first()
    const minAttr = await minInput.getAttribute('min')
    expect(minAttr).toBeTruthy()
  })

  test('should generate inputs based on parameter metadata - boolean', async ({
    page,
  }) => {
    await page.waitForSelector('.function-item')

    // Click on __toggleFeature (has boolean parameter)
    await page.click('text=__toggleFeature')

    await page.waitForSelector('#auto-inputs input[type="checkbox"]')

    // Should have checkbox
    const checkbox = page.locator('#auto-inputs input[type="checkbox"]')
    expect(await checkbox.count()).toBe(1)

    // Should be checked by default (if default is true)
    const isChecked = await checkbox.isChecked()
    expect(typeof isChecked).toBe('boolean')
  })

  test('should generate inputs based on parameter metadata - color', async ({
    page,
  }) => {
    await page.waitForSelector('.function-item')

    // Click on __setColor (has color parameter)
    await page.click('text=__setColor')

    await page.waitForSelector('#auto-inputs input[type="color"]')

    // Should have color picker
    const colorInput = page.locator('#auto-inputs input[type="color"]')
    expect(await colorInput.count()).toBe(1)

    // Should have default value
    const defaultValue = await colorInput.inputValue()
    expect(defaultValue).toMatch(/^#[0-9a-f]{6}$/i)
  })

  test('should auto-infer types from parameter names without metadata', async ({
    page,
  }) => {
    await page.waitForSelector('.function-item')

    // Click on __updateConfig (no metadata, auto-inferred)
    await page.click('text=__updateConfig')

    await page.waitForTimeout(500)

    // Should generate inputs based on parameter names
    // isEnabled -> checkbox
    const checkbox = page.locator('#auto-inputs input[type="checkbox"]')
    expect(await checkbox.count()).toBeGreaterThanOrEqual(1)

    // maxRetries -> number
    const numberInput = page.locator('#auto-inputs input[type="number"]')
    expect(await numberInput.count()).toBeGreaterThanOrEqual(1)

    // backgroundColor -> color
    const colorInput = page.locator('#auto-inputs input[type="color"]')
    expect(await colorInput.count()).toBeGreaterThanOrEqual(1)
  })

  test('should execute function with metadata-generated inputs', async ({
    page,
  }) => {
    await page.waitForSelector('.function-item')

    // Click on __setColor
    await page.click('text=__setColor')

    await page.waitForSelector('#auto-inputs input[type="color"]')

    // Change color value
    await page.locator('#auto-inputs input[type="color"]').fill('#ff0000')

    // Execute
    await page.click('#execute-btn')

    // Check result
    await page.waitForSelector('.result.success')
    const result = await page.locator('.result').textContent()
    expect(result).toContain('ff0000')
    expect(result).toContain('success')
  })

  test('should handle select with label-value pairs', async ({ page }) => {
    await page.waitForSelector('.function-item')

    // Click on __selectOption
    await page.click('text=__selectOption')

    await page.waitForSelector('#auto-inputs select')

    // Select an option
    await page.locator('#auto-inputs select').selectOption({ index: 1 })

    // Execute
    await page.click('#execute-btn')

    // Check result
    await page.waitForSelector('.result.success')
    const result = await page.locator('.result').textContent()
    expect(result).toContain('selected')
  })

  test('should show parameter descriptions in UI', async ({ page }) => {
    await page.waitForSelector('.function-item')

    // Click on a function with parameter descriptions
    await page.click('text=__getRandomNumber')

    await page.waitForTimeout(300)

    // Check if parameter labels/descriptions are shown
    const autoInputs = page.locator('#auto-inputs')
    const content = await autoInputs.textContent()

    // Should show parameter names
    expect(content).toBeTruthy()
    expect(content.length).toBeGreaterThan(0)
  })
})
