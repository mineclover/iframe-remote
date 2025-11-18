import { test, expect } from '@playwright/test'

test.describe('iframe Communication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to parent page
    await page.goto('http://localhost:3000/examples/parent/index.html')

    // Wait for iframe to load
    await page.waitForSelector('#child-iframe')
    await page.waitForTimeout(500) // Give time for communicator to initialize
  })

  test('should load parent and child pages', async ({ page }) => {
    // Check parent page title
    await expect(page).toHaveTitle(/Parent Page/)

    // Check iframe is present
    const iframe = page.frameLocator('#child-iframe')
    await expect(iframe.locator('h1')).toContainText('Child Page')
  })

  test('should send message from parent to child', async ({ page }) => {
    const iframe = page.frameLocator('#child-iframe')

    // Enter message in parent
    await page.fill('#message-input', 'Test message from parent')
    await page.click('#send-btn')

    // Verify log in parent shows sent message
    await expect(page.locator('#log-content')).toContainText('Sent: Test message from parent')

    // Verify log in child shows received message
    await expect(iframe.locator('#log-content')).toContainText('Received:')
  })

  test('should send message from child to parent', async ({ page }) => {
    const iframe = page.frameLocator('#child-iframe')

    // Enter message in child
    await iframe.locator('#message-input').fill('Test message from child')
    await iframe.locator('#send-btn').click()

    // Verify log in child shows sent message
    await expect(iframe.locator('#log-content')).toContainText('Sent: Test message from child')

    // Verify log in parent shows received message
    await expect(page.locator('#log-content')).toContainText('Received:')
  })

  test('should handle request-response pattern', async ({ page }) => {
    // Click request data button in parent
    await page.click('#request-data-btn')

    // Verify parent log shows request was sent
    await expect(page.locator('#log-content')).toContainText('Requesting data...')

    // Wait for response
    await page.waitForTimeout(1000)

    // Verify parent log shows response
    await expect(page.locator('#log-content')).toContainText('Response:')
    await expect(page.locator('#log-content')).toContainText('status')
  })

  test('should send notification from child', async ({ page }) => {
    const iframe = page.frameLocator('#child-iframe')

    // Click notify button in child
    await iframe.locator('#notify-btn').click()

    // Verify child log shows notification was sent
    await expect(iframe.locator('#log-content')).toContainText('Sent notification')

    // Verify parent log shows received notification
    await page.waitForTimeout(500)
    await expect(page.locator('#log-content')).toContainText('Received:')
  })

  test('should clear logs', async ({ page }) => {
    const iframe = page.frameLocator('#child-iframe')

    // Send some messages first
    await page.click('#send-btn')
    await page.waitForTimeout(300)

    // Clear parent log
    await page.click('#clear-log-btn')
    const parentLog = await page.locator('#log-content').textContent()
    expect(parentLog?.trim()).toBe('')

    // Clear child log
    await iframe.locator('#clear-log-btn').click()
    const childLog = await iframe.locator('#log-content').textContent()
    expect(childLog?.trim()).toBe('')
  })

  test('should show connection status in child', async ({ page }) => {
    const iframe = page.frameLocator('#child-iframe')

    // Check status is connected
    await expect(iframe.locator('#status')).toContainText('Connected')
  })
})
