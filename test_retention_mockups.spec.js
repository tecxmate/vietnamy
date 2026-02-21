import { test, expect } from '@playwright/test';

test('record retention mockups', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173/');
  
  // Wait for the roadmap
  await page.waitForSelector('.roadmap-container'); 
  
  // Click on Unit 1 Lesson 1
  await page.click('text="Unit 1"'); // Open accordion if needed
  await page.waitForTimeout(500);
  
  // Click the first lesson node
  const nodes = await page.$$('.path-node-wrapper');
  if (nodes.length > 0) {
      await nodes[0].click();
      await page.waitForTimeout(500);
      await page.click('text="START +10 XP"');
  }

  // Once in lesson, click the X to see the quit confirm
  await page.waitForSelector('.ghost');
  await page.click('.ghost'); // First ghost is X
  
  // Wait for quit confirm to show
  await page.waitForSelector('text="Wait, you only have 1 minute"');
  await page.screenshot({ path: 'quit_confirm.png' });
  
  // Click keep learning
  await page.click('text="KEEP LEARNING"');
  
  // Now speed through the questions to reach the end
  let keepGoing = true;
  while(keepGoing) {
      // Check if we hit retention screens
      const isRet = await page.$('text="+1"');
      if (isRet) {
          keepGoing = false;
          break;
      }
      
      const checkBtn = await page.$('button:has-text("CHECK")');
      const contBtn = await page.$('button:has-text("CONTINUE")');
      const passBtn = await page.$('button:has-text("SIMULATE PASS")');
      
      if (passBtn && await passBtn.isVisible()) {
          await passBtn.click();
          await page.waitForTimeout(300);
          await page.click('button:has-text("CONTINUE")');
      } else if (checkBtn && await checkBtn.isVisible() && !await checkBtn.isDisabled()) {
          await checkBtn.click();
          await page.waitForTimeout(300);
          const nextCont = await page.$('button:has-text("CONTINUE")');
          if (nextCont && await nextCont.isVisible()) {
              await nextCont.click();
          }
      } else {
          // just try clicking the first choice
          const choices = await page.$$('button:not(.primary):not(.ghost):not(.secondary:has(svg))');
          if (choices.length > 0) {
              await choices[0].click();
          }
          await page.waitForTimeout(100);
          const activeCheckBtn = await page.$('button:has-text("CHECK")');
          if (activeCheckBtn && await activeCheckBtn.isVisible() && !await activeCheckBtn.isDisabled()) {
              await activeCheckBtn.click();
              await page.waitForTimeout(300);
              const nextCont = await page.$('button:has-text("CONTINUE")');
              if (nextCont && await nextCont.isVisible()) {
                  await nextCont.click();
              }
          }
      }
      await page.waitForTimeout(300);
  }

  // Energy
  await page.waitForSelector('text="+1"');
  await page.screenshot({ path: 'retention_energy.png' });
  await page.click('button:has-text("CONTINUE")');
  await page.waitForTimeout(500);

  // Quest
  await page.waitForSelector('text="You finished this Weekend Quest"');
  await page.screenshot({ path: 'retention_quest.png' });
  await page.click('button:has-text("I DID IT")');
  await page.waitForTimeout(500);

  // XP
  await page.waitForSelector('text="triple XP Boost"');
  await page.screenshot({ path: 'retention_xp.png' });
});
