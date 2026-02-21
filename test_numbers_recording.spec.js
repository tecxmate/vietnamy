import { test, expect } from '@playwright/test';

test('record numbers practice module run', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173/practice');
  
  // Click on Numbers Practice
  await page.click('text="Numbers"');
  
  // Wait for Numbers module to load
  await page.waitForSelector('.number-grid');
  
  // Go to Build stage
  await page.click('text="Build"');
  await page.waitForTimeout(1000);
  
  // Wait to capture the builder page with the new spacing
  await page.waitForSelector('.build-answer-area');
  await page.waitForTimeout(1000);

});
