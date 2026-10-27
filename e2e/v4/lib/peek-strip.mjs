// Foreman's peek: a resumed round-II table with a full "since your last turn" strip, screenshotted at given sizes.
//   node e2e/v4/lib/peek-strip.mjs <url> <outDir> [WxH ...]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { browserPath } from './browser.mjs';
import { seedSave } from './seed.mjs';
import { stripSave } from './strip-save.mjs';

const [url, out, ...sizes] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: browserPath });
for (const size of sizes.length ? sizes : ['1270x700']) {
  const [width, height] = size.split('x').map(Number);
  const full = stripSave({ quadrants: ['gold', 'red', 'blue', 'green'] });
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', e => console.log('pageerror', e.message));
  await seedSave(page, full.save, { roundStart: full.roundStart });
  await page.goto(`${url}/?botDelay=300&intro=0`);
  await page.click('[data-home="resume"]', { timeout: 30000 });
  await page.waitForSelector('.lt-wheel .slot.can');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/strip-${size}.png` });
  if (process.env.DETAILS) {
    await page.click('text=details').catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/details-${size}.png` });
  }
  await page.close();
}
await browser.close();
