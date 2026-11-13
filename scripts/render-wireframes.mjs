import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { chromium } from 'playwright-core';

const chromePath =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const source = pathToFileURL(join(process.cwd(), 'docs/deliverables/wireframes.html')).href;

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 2 });

try {
  await page.goto(source);
  await page.waitForLoadState('load');

  for (const id of ['wf-catalog', 'wf-product', 'wf-cart', 'wf-checkout', 'wf-admin']) {
    await page.locator(`#${id}`).screenshot({
      path: join('docs/deliverables', `${id.replace('wf-', 'wireframe-')}.png`),
    });
    console.log(`captured ${id}`);
  }
} finally {
  await browser.close();
}
