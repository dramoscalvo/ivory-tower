import { test, expect } from '@playwright/test';

test.describe('Persistence', () => {
  test('diagram persists after page reload', async ({ page }) => {
    await page.goto('/');

    // Clear any existing data and reload
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Enter a custom diagram
    const customDiagram = JSON.stringify({
      title: 'Persisted Diagram',
      entities: [{ id: 'test', name: 'TestEntity', type: 'class' }],
      relationships: [],
    });

    const editor = page.getByRole('textbox');
    await editor.fill(customDiagram);

    // Verify it's saved
    const saved = await page.evaluate(() => localStorage.getItem('uml-diagram-json'));
    expect(saved).toContain('Persisted Diagram');

    // Reload the page
    await page.reload();

    // Should still have the custom diagram
    const editorAfterReload = page.getByRole('textbox');
    await expect(editorAfterReload).toContainText('Persisted Diagram');
  });

  test('new diagram overwrites previous', async ({ page }) => {
    await page.goto('/');

    // Set first diagram
    const firstDiagram = JSON.stringify({
      title: 'First Diagram',
      entities: [],
      relationships: [],
    });
    await page.getByRole('textbox').fill(firstDiagram);

    // Verify first is saved
    let saved = await page.evaluate(() => localStorage.getItem('uml-diagram-json'));
    expect(saved).toContain('First Diagram');

    // Set second diagram
    const secondDiagram = JSON.stringify({
      title: 'Second Diagram',
      entities: [],
      relationships: [],
    });
    await page.getByRole('textbox').fill(secondDiagram);

    // Verify second overwrites first
    saved = await page.evaluate(() => localStorage.getItem('uml-diagram-json'));
    expect(saved).toContain('Second Diagram');
    expect(saved).not.toContain('First Diagram');
  });

  test('Load Example button resets to default', async ({ page }) => {
    await page.goto('/');

    // Start with custom diagram
    const customDiagram = JSON.stringify({
      title: 'Custom',
      entities: [],
      relationships: [],
    });
    await page.getByRole('textbox').fill(customDiagram);

    // Click Load Example
    await page.getByRole('button', { name: /Load Example/i }).click();

    // Should have example diagram
    const editor = page.getByRole('textbox');
    await expect(editor).toContainText('Example System');

    // localStorage should also be updated
    const saved = await page.evaluate(() => localStorage.getItem('uml-diagram-json'));
    expect(saved).toContain('Example System');
  });
});
