import { test, expect } from '@playwright/test';
import fs from 'fs';

test('upload avatar', async ({ page }) => {
  page.on('console', msg => console.log(`CONSOLE: ${msg.text()}`));
  page.on('pageerror', exception => console.log(`ERROR: ${exception}`));

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[type="email"]', 'anujkanthariya2005@gmail.com');
  await page.fill('input[type="password"]', 'Test@1234');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard');
  
  await page.goto('http://localhost:5173/profile');
  await page.waitForSelector('h2', { state: 'visible' });
  
  // create dummy image
  fs.writeFileSync('test.jpg', Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00]));
  
  await page.setInputFiles('input[type="file"]', 'test.jpg');
  
  await page.waitForSelector('text=Adjust Image', { state: 'visible' });
  await page.click('text=Crop & Upload');
  
  await page.waitForTimeout(5000);
});
