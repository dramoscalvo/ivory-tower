import { test, expect } from '@playwright/test'

test.describe('Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('export button is enabled for valid diagram', async ({ page }) => {
    await page.goto('/')

    // Default example should be valid
    const exportButton = page.getByRole('button', { name: /Export TOON/i })
    await expect(exportButton).toBeEnabled()
  })

  test('export button is disabled for invalid diagram', async ({ page }) => {
    await page.goto('/')

    const editor = page.getByRole('textbox')
    await editor.fill('{ invalid }')

    const exportButton = page.getByRole('button', { name: /Export TOON/i })
    await expect(exportButton).toBeDisabled()
  })

  test('clicking export downloads a .toon file', async ({ page }) => {
    await page.goto('/')

    // Set a specific diagram
    const diagram = JSON.stringify({
      title: 'My System',
      entities: [{ id: 'a', name: 'A', type: 'class' }],
      relationships: [],
    })
    await page.getByRole('textbox').fill(diagram)

    // Wait for the export button to be enabled
    const exportButton = page.getByRole('button', { name: /Export TOON/i })
    await expect(exportButton).toBeEnabled()

    // Listen for download
    const downloadPromise = page.waitForEvent('download')
    await exportButton.click()
    const download = await downloadPromise

    // Check filename
    expect(download.suggestedFilename()).toBe('my-system.toon')
  })

  test('exported file contains correct TOON content', async ({ page }) => {
    await page.goto('/')

    const diagram = JSON.stringify({
      title: 'Export Test',
      entities: [
        {
          id: 'user',
          name: 'User',
          type: 'class',
          attributes: [{ name: 'id', type: { name: 'string' }, visibility: 'private' }],
        },
      ],
      relationships: [],
    })
    await page.getByRole('textbox').fill(diagram)

    const exportButton = page.getByRole('button', { name: /Export TOON/i })
    await expect(exportButton).toBeEnabled()

    const downloadPromise = page.waitForEvent('download')
    await exportButton.click()
    const download = await downloadPromise

    // Read content
    const content = await (await download.createReadStream()).toArray()
    const text = Buffer.concat(content).toString('utf-8')

    expect(text).toContain('title: Export Test')
    expect(text).toContain('user,User,class')
    expect(text).toContain('id,string,private')
  })
})
