import { test, expect, type Page } from '@playwright/test';

/**
 * Collect console errors that fire during a test.
 * Attaches a listener and returns a getter.
 */
function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
  return () => errors;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
test.describe('Dashboard', () => {
  test('loads without crashing', async ({ page }) => {
    const getErrors = trackConsoleErrors(page);
    await page.goto('/dashboard');
    // Wait for the main heading or a known stable element
    await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
    // Ensure no unhandled console errors
    const errors = getErrors().filter(
      (e) => !e.includes('Failed to fetch') && !e.includes('net::ERR_'),
    );
    expect(errors).toEqual([]);
  });

  test('Author tab renders content (not blank)', async ({ page }) => {
    const getErrors = trackConsoleErrors(page);
    await page.goto('/dashboard');
    // Click the Author tab
    const authorTab = page.locator('button', { hasText: /Author/i });
    await expect(authorTab).toBeVisible({ timeout: 10_000 });
    await authorTab.click();
    // The Author tab should render JourneyJournal and MediaUpload
    // Wait for at least one card or heading inside the tab content
    await expect(
      page.locator('[role="tabpanel"] >> visible=true').first(),
    ).toBeVisible({ timeout: 10_000 });
    // Page must not be blank — check there is meaningful content
    const tabContent = page.locator('[role="tabpanel"] >> visible=true');
    const text = await tabContent.textContent({ timeout: 5_000 });
    expect((text ?? '').trim().length).toBeGreaterThan(0);
    // Console errors (exclude benign network errors from missing API)
    const errors = getErrors().filter(
      (e) => !e.includes('Failed to fetch') && !e.includes('net::ERR_'),
    );
    expect(errors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Coordination
// ---------------------------------------------------------------------------
test.describe('Coordination', () => {
  test('loads and renders stable content', async ({ page }) => {
    const getErrors = trackConsoleErrors(page);
    await page.goto('/coordination');
    // Wait for stable render — look for heading or card
    await expect(
      page.locator('h1, h2, [data-testid]').first(),
    ).toBeVisible({ timeout: 15_000 });
    // No crash-level errors
    const errors = getErrors().filter(
      (e) => !e.includes('Failed to fetch') && !e.includes('net::ERR_'),
    );
    expect(errors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Demo
// ---------------------------------------------------------------------------
test.describe('Demo', () => {
  test('renders expected heading and button', async ({ page }) => {
    const getErrors = trackConsoleErrors(page);
    await page.goto('/demo');
    // The Demo page should have a heading
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
    const heading = await page.locator('h1').textContent();
    expect(heading).toContain('Joiner Demo');
    // The "Simulate Joiner" button should be present
    await expect(
      page.locator('button', { hasText: /Simulate Joiner/i }),
    ).toBeVisible();
    const errors = getErrors().filter(
      (e) => !e.includes('Failed to fetch') && !e.includes('net::ERR_'),
    );
    expect(errors).toEqual([]);
  });
});
