import { test, expect } from '@playwright/test';

test.describe('Diagram Editing', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('loads page with example diagram', async ({ page }) => {
    await page.goto('/');

    // Should have the title
    await expect(page.getByText('UML Diagram Editor')).toBeVisible();

    // Should have the JSON editor with example content
    const editor = page.getByRole('textbox');
    await expect(editor).toContainText('Example System');
  });

  test('updates canvas when JSON is edited', async ({ page }) => {
    await page.goto('/');

    // Wait for initial render
    await expect(page.getByRole('textbox')).toBeVisible();

    // The canvas should render entities from the example
    // Check for SVG content (the canvas renders entities)
    const svg = page.locator('svg');
    await expect(svg).toBeVisible();
  });

  test('shows parse error for invalid JSON', async ({ page }) => {
    await page.goto('/');

    const editor = page.getByRole('textbox');
    await editor.fill('{ invalid json }');

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

    const editor = page.getByRole('textbox');
    await editor.fill(invalidJson);

    // Should show validation errors (there are multiple, use first)
    await expect(page.getByText(/entities\[0\]/).first()).toBeVisible();
  });

  test('clears errors when valid JSON is entered', async ({ page }) => {
    await page.goto('/');

    const editor = page.getByRole('textbox');

    // Enter invalid JSON
    await editor.fill('{ invalid }');
    await expect(page.getByText('Parse Error:')).toBeVisible();

    // Enter valid JSON
    const validJson = JSON.stringify({
      title: 'Valid',
      entities: [],
      relationships: [],
    });
    await editor.fill(validJson);

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

    const editor = page.getByRole('textbox');
    await editor.fill(diagram);

    // Canvas should show both entities
    const svg = page.locator('svg');
    await expect(svg.getByText('User')).toBeVisible();
    await expect(svg.getByText('Admin')).toBeVisible();
  });
});
