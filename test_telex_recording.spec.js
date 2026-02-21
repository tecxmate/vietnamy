import { test, expect } from '@playwright/test';

test('record telex practice module run', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173/practice');
  
  // Wait for the practice page to load
  await page.waitForSelector('.practice-card'); // Wait until cards are present
  
  // Click on Telex Typing
  await page.click('text="Telex"');
  
  // Wait for intro to load
  await page.waitForSelector('.telex-content');
  
  // Scroll to show rules
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(1000);
  
  // Start challenge
  await page.click('text="Start Challenge"');
  
  // Game state 1 (Which key adds the Acute accent...) - multiple choice
  await page.waitForSelector('.telex-content');
  await page.click('text="s"'); // Correct
  await page.waitForTimeout(1500); // Wait for feedback and transition

  // Game state 2 (To type "â"...) - multiple choice
  await page.click('text="aa"'); // Correct
  await page.waitForTimeout(1500);

  // Game state 3 (Type TELEX for đ) - text input construction
  await page.fill('.construction-input', 'dd');
  await page.click('text="Submit"');
  await page.waitForTimeout(1500);

  // Intentionally get one wrong to show x-circle logic: "Which key adds Tilde..?"
  await page.click('text="f"'); // Incorrect
  await page.waitForTimeout(1500);
  
  // Correct choice
  await page.click('text="x"'); // Correct
  await page.waitForTimeout(1500);
  
});
