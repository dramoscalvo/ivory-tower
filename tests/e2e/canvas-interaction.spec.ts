import { test, expect } from '@playwright/test';

test.describe('Canvas Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ensure we have a valid diagram
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('canvas displays diagram entities', async ({ page }) => {
    await page.goto('/');

    // Default example has User, UserUtils, IAuthenticatable
    const svg = page.locator('svg');
    // Use exact match to avoid matching UserUtils
    await expect(svg.getByText('User', { exact: true })).toBeVisible();
    await expect(svg.getByText('UserUtils', { exact: true })).toBeVisible();
  });

  test('zoom controls are visible', async ({ page }) => {
    await page.goto('/');

    // Find the zoom buttons by their text content
    const zoomInButton = page.locator('button', { hasText: '+' });
    const zoomOutButton = page.locator('button', { hasText: '-' });

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();
  });

  test('zoom in button increases scale', async ({ page }) => {
    await page.goto('/');

    // Find the zoom in button by + text
    const zoomInButton = page.locator('button', { hasText: '+' });
    await expect(zoomInButton).toBeVisible();

    // Get initial transform from SVG style
    const svg = page.locator('svg').first();

    const getScale = async () => {
      const style = await svg.getAttribute('style');
      const match = style?.match(/scale\(([^)]+)\)/);
      return match ? parseFloat(match[1]) : 1;
    };

    const initialScale = await getScale();

    // Click zoom in
    await zoomInButton.click();

    // Scale should increase
    const newScale = await getScale();
    expect(newScale).toBeGreaterThan(initialScale);
  });

  test('zoom out button decreases scale', async ({ page }) => {
    await page.goto('/');

    // First zoom in to have room to zoom out
    const zoomInButton = page.locator('button', { hasText: '+' });
    await zoomInButton.click();
    await zoomInButton.click();

    const svg = page.locator('svg').first();

    const getScale = async () => {
      const style = await svg.getAttribute('style');
      const match = style?.match(/scale\(([^)]+)\)/);
      return match ? parseFloat(match[1]) : 1;
    };

    const scaleAfterZoomIn = await getScale();

    // Find and click zoom out button (uses − character)
    const zoomOutButton = page.locator('button', { hasText: '-' });
    await zoomOutButton.click();

    const scaleAfterZoomOut = await getScale();
    expect(scaleAfterZoomOut).toBeLessThan(scaleAfterZoomIn);
  });

  test('canvas shows relationship lines', async ({ page }) => {
    await page.goto('/');

    // The example diagram has relationships, so there should be path elements
    // with marker-end attribute (relationship arrows)
    const svg = page.locator('svg');
    const relationshipPaths = svg.locator('path[marker-end]');
    await expect(relationshipPaths.first()).toBeVisible();
  });

  test('canvas renders entities with type indicators', async ({ page }) => {
    await page.goto('/');

    const svg = page.locator('svg');

    // Check that entity names are rendered
    await expect(svg.getByText('User', { exact: true })).toBeVisible();
    await expect(svg.getByText('UserUtils', { exact: true })).toBeVisible();
    await expect(svg.getByText('IAuthenticatable')).toBeVisible();
  });
});
