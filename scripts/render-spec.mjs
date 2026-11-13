import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { chromium } from 'playwright-core';

const chromePath =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const source = pathToFileURL(join(process.cwd(), 'docs/deliverables/spec.html')).href;

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });

try {
  await page.goto(source);
  await page.waitForLoadState('networkidle');
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: 'P2 - Hexora Specification.pdf',
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
  });
  await page.emulateMedia({ media: 'screen' });

  const pages = page.locator('.page');
  const count = await pages.count();
  const sizes = await page.$$eval('.page', (nodes) =>
    nodes.map((node, index) => ({
      page: index + 1,
      content: node.scrollHeight,
      box: node.clientHeight,
      overflow: node.scrollHeight - node.clientHeight,
    })),
  );
  for (const size of sizes) {
    console.log(
      `page ${size.page}: content ${size.content}px / box ${size.box}px` +
        (size.overflow > 1 ? `  OVERFLOW +${size.overflow}px` : ''),
    );
  }

  for (let index = 0; index < count; index += 1) {
    await pages.nth(index).screenshot({
      path: `docs/deliverables/spec-preview-${index + 1}.png`,
    });
  }

  console.log(`wrote P2 - Hexora Specification.pdf with ${count} sections`);
} finally {
  await browser.close();
}
