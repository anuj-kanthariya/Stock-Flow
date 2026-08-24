# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\test_upload.spec.ts >> upload avatar
- Location: tests\test_upload.spec.ts:4:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - button [ref=e5] [cursor=pointer]
    - generic [ref=e8]:
      - generic: StockFlow
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]:
            - heading "Sign in" [level=1] [ref=e13]
            - paragraph [ref=e14]: Welcome back! Enter your credentials.
          - generic [ref=e15]:
            - generic [ref=e16]:
              - generic [ref=e17]: Email
              - textbox "Email" [ref=e18]:
                - /placeholder: name@example.com
                - text: anujkanthariya2005@gmail.com
            - generic [ref=e19]:
              - generic [ref=e20]:
                - generic [ref=e21]: Password
                - link "Forgot password?" [ref=e22] [cursor=pointer]:
                  - /url: /forgot-password
              - generic [ref=e23]:
                - textbox "Password" [ref=e24]:
                  - /placeholder: Enter your password
                  - text: Test@1234
                - button "Show password" [ref=e25] [cursor=pointer]
              - paragraph [ref=e29]: Password must be at least 6 characters
            - generic [ref=e30]:
              - checkbox "Remember me" [ref=e31] [cursor=pointer]
              - generic [ref=e32] [cursor=pointer]: Remember me
            - button "Sign In" [ref=e33] [cursor=pointer]
          - generic [ref=e34]: OR CONTINUE WITH
          - button "Sign in with Google" [ref=e39] [cursor=pointer]
          - paragraph [ref=e46]:
            - text: Don't have an account?
            - button "Create Account" [ref=e47] [cursor=pointer]
        - generic [ref=e48]:
          - generic [ref=e49]:
            - heading "Create account" [level=1] [ref=e50]
            - paragraph [ref=e51]: Streamline your wholesale business.
          - generic [ref=e52]:
            - generic [ref=e53]:
              - generic [ref=e54]: Full Name
              - textbox "Full Name" [ref=e55]:
                - /placeholder: Enter your full name
            - generic [ref=e56]:
              - generic [ref=e57]: Email
              - textbox "Email" [ref=e58]:
                - /placeholder: name@example.com
            - generic [ref=e59]:
              - generic [ref=e60]: Password
              - generic [ref=e61]:
                - textbox "Password" [ref=e62]:
                  - /placeholder: Create your password
                - button [ref=e63] [cursor=pointer]
            - generic [ref=e67]:
              - generic [ref=e68]: Confirm Password
              - textbox "Confirm Password" [ref=e69]:
                - /placeholder: Confirm your password
            - button "Create Account" [disabled]
          - generic [ref=e70]: OR CONTINUE WITH
          - button "Sign up with Google" [ref=e75] [cursor=pointer]
          - paragraph [ref=e82]:
            - text: Already have an account?
            - button "Sign In" [ref=e83] [cursor=pointer]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'fs';
  3  | 
  4  | test('upload avatar', async ({ page }) => {
  5  |   page.on('console', msg => console.log(`CONSOLE: ${msg.text()}`));
  6  |   page.on('pageerror', exception => console.log(`ERROR: ${exception}`));
  7  | 
  8  |   console.log('Navigating to login...');
  9  |   await page.goto('http://localhost:5173/login');
  10 |   
  11 |   await page.fill('input[type="email"]', 'anujkanthariya2005@gmail.com');
  12 |   await page.fill('input[type="password"]', 'Test@1234');
  13 |   await page.click('button[type="submit"]');
  14 |   
> 15 |   await page.waitForURL('**/dashboard');
     |              ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  16 |   
  17 |   await page.goto('http://localhost:5173/profile');
  18 |   await page.waitForSelector('h2', { state: 'visible' });
  19 |   
  20 |   // create dummy image
  21 |   fs.writeFileSync('test.jpg', Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00]));
  22 |   
  23 |   await page.setInputFiles('input[type="file"]', 'test.jpg');
  24 |   
  25 |   await page.waitForSelector('text=Adjust Image', { state: 'visible' });
  26 |   await page.click('text=Crop & Upload');
  27 |   
  28 |   await page.waitForTimeout(5000);
  29 | });
  30 | 
```