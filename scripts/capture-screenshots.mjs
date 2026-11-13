import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright-core';

const baseUrl = process.env.APP_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`;
const chromePath =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));

const viewports = [
  { label: '1440', width: 1440, height: 1000 },
  { label: '360', width: 360, height: 800 },
];

const publicPages = [
  { name: 'home', path: '/' },
  { name: 'catalog', path: '/catalog' },
  { name: 'search', path: '/catalog?q=ashen' },
  { name: 'product', path: '/products/ashen-crown-digital' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ executablePath: chromePath, headless: true });

async function capture(page, name) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(200);
    await page.screenshot({
      path: join(outputDir, `${name}-${viewport.label}.png`),
      fullPage: false,
    });
    console.log(`captured ${name} at ${viewport.label}px`);
  }
}

try {
  const publicContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const publicPage = await publicContext.newPage();

  for (const entry of publicPages) {
    await publicPage.goto(`${baseUrl}${entry.path}`, { waitUntil: 'domcontentloaded' });
    await capture(publicPage, entry.name);
  }

  await publicContext.close();

  const accountContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const accountPage = await accountContext.newPage();
  await accountPage.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await accountPage.waitForLoadState('networkidle');
  await accountPage.fill('#login-email', 'demo@hexora.test');
  await accountPage.fill('#login-password', 'Demo1234!');
  await accountPage.click('button[type="submit"]');
  await accountPage.waitForURL('**/account', { timeout: 30000 });
  await capture(accountPage, 'account');
  await accountContext.close();
} finally {
  await browser.close();
}
