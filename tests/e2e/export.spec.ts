import { test, expect } from '@playwright/test';

const ARCH_KEY = 'uml-architecture-json';

/** Set editor content via localStorage and reload. */
async function setDiagram(page: import('@playwright/test').Page, json: string) {
  await page.evaluate(
    ([arch, uc]) => {
      localStorage.setItem('uml-architecture-json', arch);
      localStorage.setItem('uml-usecases-json', uc);
    },
    [json, '[]'] as const,
  );
  await page.reload();
  await page.locator('.cm-editor').waitFor();
}

test.describe('Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('export dropdown is enabled for valid diagram', async ({ page }) => {
    await page.goto('/');

    // Default example should be valid — Export trigger should be enabled
    const exportTrigger = page.getByRole('button', { name: 'Export' });
    await expect(exportTrigger).toBeEnabled();
  });

  test('export dropdown is disabled for invalid diagram', async ({ page }) => {
    await page.goto('/');

    // Set invalid diagram
    await setDiagram(page, '{ invalid }');

    const exportTrigger = page.getByRole('button', { name: 'Export' });
    await expect(exportTrigger).toBeDisabled();
  });

  test('clicking export downloads a .toon file', async ({ page }) => {
    await page.goto('/');

    // Set a specific diagram
    const diagram = JSON.stringify({
      title: 'My System',
      entities: [{ id: 'a', name: 'A', type: 'class' }],
      relationships: [],
    });
    await setDiagram(page, diagram);

    // Open Export dropdown and click Export TOON
    await page.getByRole('button', { name: 'Export' }).click();
    const exportToon = page.getByRole('menuitem', { name: /Export TOON/i });
    await expect(exportToon).toBeVisible();

    // Listen for download
    const downloadPromise = page.waitForEvent('download');
    await exportToon.click();
    const download = await downloadPromise;

    // Check filename
    expect(download.suggestedFilename()).toBe('my-system.toon');
  });

  test('exported file contains correct TOON content', async ({ page }) => {
    await page.goto('/');

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
    });
    await setDiagram(page, diagram);

    // Open Export dropdown and click Export TOON
    await page.getByRole('button', { name: 'Export' }).click();
    const exportToon = page.getByRole('menuitem', { name: /Export TOON/i });
    await expect(exportToon).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportToon.click();
    const download = await downloadPromise;

    // Read content
    const content = await (await download.createReadStream()).toArray();
    const text = Buffer.concat(content).toString('utf-8');

    expect(text).toContain('title: Export Test');
    expect(text).toContain('user,User,class');
    expect(text).toContain('id,string,private');
  });
});
