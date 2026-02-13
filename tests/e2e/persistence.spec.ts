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

test.describe('Persistence', () => {
  test('diagram persists after page reload', async ({ page }) => {
    await page.goto('/');

    // Set custom diagram via localStorage
    const customDiagram = JSON.stringify({
      title: 'Persisted Diagram',
      entities: [{ id: 'test', name: 'TestEntity', type: 'class' }],
      relationships: [],
    });
    await setDiagram(page, customDiagram);

    // Editor should show the custom diagram
    await expect(page.locator('.cm-content')).toContainText('Persisted Diagram');

    // Reload the page — diagram should still be there
    await page.reload();
    await expect(page.locator('.cm-content')).toContainText('Persisted Diagram');
  });

  test('new diagram overwrites previous', async ({ page }) => {
    await page.goto('/');

    // Set first diagram
    const firstDiagram = JSON.stringify({
      title: 'First Diagram',
      entities: [],
      relationships: [],
    });
    await setDiagram(page, firstDiagram);
    await expect(page.locator('.cm-content')).toContainText('First Diagram');

    // Set second diagram
    const secondDiagram = JSON.stringify({
      title: 'Second Diagram',
      entities: [],
      relationships: [],
    });
    await setDiagram(page, secondDiagram);

    // Verify second overwrites first
    await expect(page.locator('.cm-content')).toContainText('Second Diagram');
    await expect(page.locator('.cm-content')).not.toContainText('First Diagram');
  });

  test('Load Example button resets to default after confirmation', async ({ page }) => {
    await page.goto('/');

    // Start with custom diagram
    const customDiagram = JSON.stringify({
      title: 'Custom',
      entities: [],
      relationships: [],
    });
    await setDiagram(page, customDiagram);

    // Click Load Example and confirm
    await page.getByRole('button', { name: /Load Example/i }).click();
    await page.getByRole('button', { name: /Confirm/i }).click();

    // Should have example diagram
    await expect(page.locator('.cm-content')).toContainText('Example System');

    // localStorage should also be updated
    const saved = await page.evaluate(
      (key) => localStorage.getItem(key),
      'uml-architecture-json',
    );
    expect(saved).toContain('Example System');
  });

  test('Load Example cancellation preserves current work', async ({ page }) => {
    await page.goto('/');

    // Start with custom diagram
    const customDiagram = JSON.stringify({
      title: 'Custom',
      entities: [],
      relationships: [],
    });
    await setDiagram(page, customDiagram);

    // Click Load Example then cancel
    await page.getByRole('button', { name: /Load Example/i }).click();
    await page.getByRole('button', { name: /Cancel/i }).click();

    // Should still have custom diagram
    await expect(page.locator('.cm-content')).toContainText('Custom');
    await expect(page.locator('.cm-content')).not.toContainText('Example System');
  });
});
