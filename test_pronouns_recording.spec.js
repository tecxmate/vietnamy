import { test, expect } from '@playwright/test';

test('record pronouns practice module run', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173/');
  
  // Login with test credentials if needed (assuming dev server auto-logs in or has a test account)
  // For now, assume it's publicly accessible or already authenticated via session.
  // We'll navigate directly to practice then Pronouns
  
  await page.goto('http://localhost:5173/practice');
  
  // Wait for the practice page to load
  await page.waitForSelector('.practice-card'); // Wait until cards are present
  
  // Click on Pronouns Practice
  await page.click('text="Pronouns"');
  
  // Wait for Pronouns module to load
  await page.waitForSelector('.tree-section');
  await page.waitForTimeout(1000);
  
  // Interact with gender toggle
  await page.click('button:has-text("Female")');
  await page.waitForTimeout(500);

  // Select a family member
  // Locate the node for "Grandfather (Paternal)" -> "Ông Nội"
  const grandFatherNode = page.locator('.member-content:has-text("Ông nội")');
  await grandFatherNode.click();
  
  await page.waitForTimeout(1000);
  
  // Scroll down slightly to see interaction panel
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(500);

  // Reveal answer
  await page.click('button:has-text("How do we address each other?")');
  await page.waitForSelector('.result-display');
  
  // Wait longer to record the result
  await page.waitForTimeout(3000);
  
  // Try another
  await page.click('button:has-text("Try Another")');
  await page.waitForTimeout(1000);
});
