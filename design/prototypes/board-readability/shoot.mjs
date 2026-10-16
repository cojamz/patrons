// Screenshots of the board-readability sketches. Run from the repo root: node design/prototypes/board-readability/shoot.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const pages = [
  ['A', 'A-text-on-board.html', '#sel=2-2'], // laptop: Echo's full wording docked in the side card
  ['B', 'B-map-and-list.html', ''],
];
const sizes = [
  ['laptop', { viewport: { width: 1270, height: 700 } }],
  ['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [id, file, hash] of pages) {
  for (const [size, opts] of sizes) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + path.join(dir, file) + (size === 'laptop' ? hash : ''));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(dir, 'shots', `${id}-${size}.png`) });
    if (size === 'phone') await page.screenshot({ path: path.join(dir, 'shots', `${id}-phone-full.png`), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    console.log(id, size, errs.length ? 'ERRORS ' + errs.join(' | ') : 'ok', overflow > 0 ? `horizontal overflow ${overflow}px` : '');
    await ctx.close();
  }
}
await browser.close();
