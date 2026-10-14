// Screenshots of the pixel-icon calibration set. Run from the repo root: node design/prototypes/pixel-art/shoot.mjs
// Shot at deviceScaleFactor 2 (a retina laptop): one icon pixel at 24px = 2×2 screen pixels.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const shots = [
  ['sheet', 'sheet.html', { width: 1270, height: 900 }, true],
  ['context', 'context.html', { width: 1270, height: 720 }, false],
];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [name, file, viewport, full] of shots) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.join(dir, file));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, 'shots', `${name}.png`), fullPage: full });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log(name, errs.length ? 'ERRORS ' + errs.join(' | ') : 'ok', overflow > 0 ? `horizontal overflow ${overflow}px` : '');
  await ctx.close();
}
await browser.close();
