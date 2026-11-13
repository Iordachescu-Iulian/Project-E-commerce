import { readdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { chromium } from 'playwright-core';

const dir = process.argv[2] ?? 'docs/deliverables';
const chromePath =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const files = (await readdir(dir)).filter((file) => extname(file) === '.svg');
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const page = await browser.newPage({ deviceScaleFactor: 2 });

try {
  for (const file of files) {
    const url = pathToFileURL(join(process.cwd(), dir, file)).href;
    await page.goto(url);
    await page.waitForLoadState('load');
    const name = basename(file, '.svg');
    await page.locator('svg').screenshot({ path: join(dir, `${name}.png`), timeout: 15000 });
    console.log(`rendered ${name}.png`);
  }
} finally {
  await browser.close();
}
