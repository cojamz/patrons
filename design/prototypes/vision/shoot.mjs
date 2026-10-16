// Screenshots of the vision key frames. Run from the repo root: node design/prototypes/vision/shoot.mjs [name...]
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const all = [
  ['f1-place', { viewport: { width: 1270, height: 700 } }],
  ['f2-buy', { viewport: { width: 1270, height: 700 } }],
  ['f3-round-end', { viewport: { width: 1270, height: 700 } }],
  ['f4-phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
];
const want = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [name, opts] of all) {
  if (want.length && !want.includes(name)) continue;
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  try { await page.goto('file://' + path.join(dir, name + '.html')); } catch (e) { console.log(name, 'missing'); await ctx.close(); continue; }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dir, 'shots', `${name}.png`) });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log(name, errs.length ? 'ERRORS ' + errs.join(' | ') : 'ok', overflow > 0 ? `horizontal overflow ${overflow}px` : '');
  await ctx.close();
}
await browser.close();
