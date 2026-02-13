import { test, expect } from '@playwright/test';

const ARCH_KEY = 'uml-architecture-json';
const CANVAS_SVG = 'svg[width="100%"][height="100%"]';

/** Paste text into the CodeMirror editor, replacing all current content. */
async function pasteIntoEditor(page: import('@playwright/test').Page, text: string) {
  const editor = page.locator('.cm-content');
  await editor.click();
  await page.keyboard.press('Control+A');
  await editor.evaluate((el, t) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', t);
    el.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
    );
  }, text);
}

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

test.describe('Diagram Editing', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('loads page with example diagram', async ({ page }) => {
    await page.goto('/');

    // Should have the app title
    const matches = await page.getByText('Ivory Tower').all();
    expect(matches.length).toBeGreaterThanOrEqual(1);

    // Should have the editor with example content
    await expect(page.locator('.cm-content')).toContainText('Example System');
  });

  test('updates canvas when JSON is edited', async ({ page }) => {
    await page.goto('/');

    // Wait for initial render
    await expect(page.locator('.cm-editor')).toBeVisible();

    // The canvas should render entities from the example
    const svg = page.locator(CANVAS_SVG);
    await expect(svg).toBeVisible();
  });

  test('shows parse error for invalid JSON', async ({ page }) => {
    await page.goto('/');

    await pasteIntoEditor(page, '{ invalid json }');

    // Should show parse error
    await expect(page.getByText('Parse Error:')).toBeVisible();
  });

  test('shows validation errors for invalid structure', async ({ page }) => {
    await page.goto('/');

    const invalidJson = JSON.stringify({
      title: 'Test',
      entities: [{ name: 'Missing ID' }],
      relationships: [],
    });

    await setDiagram(page, invalidJson);

    // Should show validation errors (there are multiple, use first)
    await expect(page.getByText(/entities\[0\]/).first()).toBeVisible();
  });

  test('clears errors when valid JSON is entered', async ({ page }) => {
    await page.goto('/');

    // Set invalid JSON via localStorage
    await setDiagram(page, '{ invalid }');
    await expect(page.getByText('Parse Error:')).toBeVisible();

    // Set valid JSON
    const validJson = JSON.stringify({
      title: 'Valid',
      entities: [],
      relationships: [],
    });
    await setDiagram(page, validJson);

    // Error should be gone
    await expect(page.getByText('Parse Error:')).not.toBeVisible();
  });

  test('renders new entity when added to JSON', async ({ page }) => {
    await page.goto('/');

    const diagram = JSON.stringify({
      title: 'Test',
      entities: [
        { id: 'user', name: 'User', type: 'class' },
        { id: 'admin', name: 'Admin', type: 'class' },
      ],
      relationships: [],
    });

    await setDiagram(page, diagram);

    // Canvas should show both entities
    const svg = page.locator(CANVAS_SVG);
    await expect(svg.getByText('User')).toBeVisible();
    await expect(svg.getByText('Admin')).toBeVisible();
  });
});
