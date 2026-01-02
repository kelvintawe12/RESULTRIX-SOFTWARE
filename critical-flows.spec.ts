import { test, expect } from '@playwright/test';

test.describe('Critical Business Flows', () => {
  // Roadmap Item: Fee Payment Flow
  test('fee payment processing', async ({ page }) => {
    // 1. Login as Bursar
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'bursar@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 2. Navigate to Payments
    await page.click('nav >> text=Payments');
    await page.waitForURL('**/dashboard/payments');

    // 3. Select Student
    await page.click('text=Select Student');
    await page.click('li:has-text("John Doe")');

    // 4. Process Payment
    await page.fill('input[name="amount"]', '500');
    await page.click('button:has-text("Process Payment")');

    // 5. Verify Receipt Generation
    await expect(page.locator('text=Receipt Generated')).toBeVisible();
    await expect(page.locator('a:has-text("Download Receipt")')).toBeVisible();
  });

  // Roadmap Item: Report Card Generation
  test('report card generation', async ({ page }) => {
    // 1. Login as Teacher/Admin
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'teacher@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 2. Navigate to Academic Reports
    await page.click('nav >> text=Academic Reports');
    await page.waitForURL('**/dashboard/reports');

    // 3. Select Class/Student
    await page.click('text=Select Class');
    await page.click('li:has-text("Grade 10")');
    await page.click('text=Select Student');
    await page.click('li:has-text("Jane Smith")');

    // 4. Click Generate PDF
    await page.click('button:has-text("Generate PDF")');

    // 5. Verify Download/Preview
    await expect(page.locator('text=Report Card Preview')).toBeVisible();
    await expect(page.locator('a:has-text("Download PDF")')).toBeVisible();
  });
});