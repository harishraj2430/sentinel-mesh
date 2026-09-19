import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const VIEWPORTS = [
  { name: '1229x691_laptop_125', width: 1229, height: 691 },
  { name: '1280x720_hd', width: 1280, height: 720 },
  { name: '1366x768_typical_laptop', width: 1366, height: 768 },
  { name: '1440x900_macbook', width: 1440, height: 900 },
  { name: '1920x1080_fhd', width: 1920, height: 1080 },
  { name: '2560x1440_qhd', width: 2560, height: 1440 },
  { name: '768x1024_tablet', width: 768, height: 1024 },
  { name: '390x844_mobile', width: 390, height: 844 }
];

test.describe('Sentinel Mesh Layout & Verification Suite', () => {

  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.name} (${vp.width}x${vp.height}) - No horizontal scroll & above-fold Hero`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:5173/');
      await page.waitForLoadState('networkidle');

      // 1. Assert no horizontal page overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin of error for sub-pixel anti-aliasing

      // 2. Fix 1: At 1366x768, H1, sub-paragraph and CTA buttons must be in viewport without scrolling
      if (vp.name === '1366x768_typical_laptop') {
        const ctaButton = page.locator('text=CONNECT GMAIL WORKSPACE');
        await expect(ctaButton).toBeVisible();
        const box = await ctaButton.boundingBox();
        expect(box).not.toBeNull();
        expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
      }

      // Screenshot Landing Page in Dark Mode
      const screenshotDir = path.resolve('tests/screenshots');
      if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({ path: path.join(screenshotDir, `${vp.name}_landing_dark.png`), fullPage: false });
    });
  }

  test('Fix 3: Light & Dark Theme Toggle Verification Across Tabs', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Default dark
    const darkTheme = await page.getAttribute('html', 'data-theme');
    expect(darkTheme === 'dark' || darkTheme === null).toBeTruthy();

    // Toggle to light mode
    const themeBtn = page.locator('.theme-switch-container');
    await themeBtn.click();
    await page.waitForTimeout(300);

    const lightTheme = await page.getAttribute('html', 'data-theme');
    expect(lightTheme).toBe('light');

    // Screenshot Landing in Light Theme
    await page.screenshot({ path: 'tests/screenshots/1366x768_landing_light.png' });

    // Navigate to SOC Console tab in light mode
    await page.goto('http://localhost:5173/console');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/1366x768_console_light.png' });

    // Toggle back to dark in console
    await page.locator('.theme-switch-container').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/screenshots/1366x768_console_dark.png' });
  });

  test('Fix 5: Assert exactly one scanner-line exists on page', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const count = await page.locator('.scanner-line').count();
    expect(count).toBe(1);
  });

  test('Fix 6: No file / empty file analysis behavior', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Analyze button should be disabled without file
    const analyzeBtn = page.locator('button:has-text("ATTACH FILE TO ANALYSE")');
    await expect(analyzeBtn).toBeVisible();
    await expect(analyzeBtn).toBeDisabled();

    // Try attaching 0-byte empty file
    const tempEmptyFile = path.resolve('tests/empty_sample.eml');
    fs.writeFileSync(tempEmptyFile, '');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=DROP .EML / .MSG / .TXT').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tempEmptyFile);

    // Verify error displayed and analyze button remains disabled
    await expect(page.locator('text=File is empty (0 bytes)')).toBeVisible();
    await expect(analyzeBtn).toBeDisabled();

    // Clean up temp file
    if (fs.existsSync(tempEmptyFile)) fs.unlinkSync(tempEmptyFile);
  });

  test('Fix 10: Google Mail Connect Popup Usability at 100% Zoom', async ({ page }) => {
    await page.setViewportSize({ width: 1229, height: 691 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Open modal
    await page.locator('text=CONNECT GMAIL WORKSPACE').click();
    await page.waitForTimeout(400);

    const modal = page.locator('.cyber-panel:has-text("CONNECT SECURE GMAIL GATEWAY")');
    await expect(modal).toBeVisible();

    const box = await modal.boundingBox();
    expect(box.height).toBeLessThanOrEqual(691);

    // Advance to step 2 (GIS)
    await page.locator('text=AUTHENTICATE VIA GOOGLE OAUTH 2.0').click();
    await page.waitForTimeout(400);
    const allowBtn = page.locator('button:has-text("Allow")');
    await expect(allowBtn).toBeVisible();
    const allowBox = await allowBtn.boundingBox();
    expect(allowBox.y + allowBox.height).toBeLessThanOrEqual(691); // fully visible without scrolling

    await page.screenshot({ path: 'tests/screenshots/1229x691_gmail_modal_gis.png' });
  });

});
