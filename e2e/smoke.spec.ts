import { test, expect } from '@playwright/test';

test.describe('Void Whiteboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should draw a stroke and see it on the canvas', async ({ page }) => {
    // Wait for the app to load and authentication to resolve (fake mode is fast)
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible();

    // Draw something
    const box = await svg.boundingBox();
    if (!box) throw new Error('SVG not found');

    const startX = box.x + 100;
    const startY = box.y + 100;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY + 50);
    await page.mouse.move(startX + 100, startY + 50);
    await page.mouse.up();

    // Verify a path element was created in the SVG
    const path = svg.locator('path');
    await expect(path).toHaveCount(1);
  });

  test('should switch tools using keyboard shortcuts', async ({ page }) => {
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible();

    // Default tool is draw (crosshair)
    await expect(svg).toHaveCSS('cursor', 'crosshair');

    // Press 'Q' for move tool
    await page.keyboard.press('q');
    await expect(svg).toHaveCSS('cursor', 'grab');

    // Press 'E' for eraser tool
    await page.keyboard.press('e');
    await expect(svg).toHaveCSS('cursor', 'cell');

    // Press 'R' for text tool
    await page.keyboard.press('r');
    await expect(svg).toHaveCSS('cursor', 'text');

    // Press 'W' for draw tool
    await page.keyboard.press('w');
    await expect(svg).toHaveCSS('cursor', 'crosshair');
  });

  test('should create a new folder in File Explorer', async ({ page }) => {
    // Open explorer
    await page.getByRole('button', { name: 'Boards' }).click();
    await expect(page.getByText('Meus Boards')).toBeVisible();

    // Click "Nova Pasta"
    await page.getByText('Nova Pasta').click();
    
    // Type name and enter
    const folderName = 'Test Folder ' + Math.random().toString(36).substring(7);
    const input = page.getByPlaceholder('Nome da pasta...');
    await input.fill(folderName);
    await page.keyboard.press('Enter');

    // Verify folder exists
    await expect(page.getByText(folderName)).toBeVisible();
  });

  test('should rename the current board', async ({ page }) => {
    const defaultTitle = 'Board Sem Título';
    await expect(page.getByText(defaultTitle)).toBeVisible();

    // Click to rename
    await page.getByText(defaultTitle).click();
    
    // Type new name
    const newName = 'My Awesome Board';
    const input = page.getByTestId('board-name-input');
    await input.fill(newName);
    await page.keyboard.press('Enter');

    // Verify name updated in toolbar
    await expect(page.getByText(newName)).toBeVisible();
  });
});
