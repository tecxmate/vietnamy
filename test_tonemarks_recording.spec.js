import { test, expect } from '@playwright/test';

test('record tonemarks practice module run', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173/practice');
  
  // Wait for the practice page to load
  await page.waitForSelector('.practice-card'); // Wait until cards are present
  
  // Click on Tone Marks
  await page.click('text="Tone Marks"');
  
  // Wait for Tone Marks module to load
  // We're initially on "Explore" which has the .periodic-grid
  await page.waitForSelector('.periodic-grid');
  
  // We want to verify the Combine tab as well
  await page.click('text="Combine"');
  await page.waitForTimeout(1000); // let UI settle
  
  // Wait to capture the page with the new flat layout
  await page.waitForSelector('.challenge-content');
  await page.waitForTimeout(1000);

});
