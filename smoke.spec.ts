import { test, expect } from '@playwright/test';

test('landing page has correct title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/EduMaster/);
});

test('navigation to login page works', async ({ page }) => {
  await page.goto('/');
  
  // Assuming there is a login link or button, or navigating directly
  await page.goto('/login');
  await expect(page).toHaveURL(/.*login/);
});