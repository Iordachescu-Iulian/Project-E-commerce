import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { chromium } from 'playwright-core';

const chromePath =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const source = pathToFileURL(join(process.cwd(), 'docs/deliverables/deck.html')).href;

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

try {
  await page.goto(source);
  await page.waitForLoadState('networkidle');
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: 'P2 - Hexora.pdf',
    width: '13.333in',
    height: '7.5in',
    printBackground: true,
    preferCSSPageSize: true,
  });
  await page.emulateMedia({ media: 'screen' });

  for (const [index, id] of [1, 3, 7].entries()) {
    const slide = page.locator('.slide').nth(id - 1);
    await slide.screenshot({ path: `docs/deliverables/deck-preview-${index + 1}.png` });
  }

  console.log('wrote P2 - Hexora.pdf');
} finally {
  await browser.close();
}
