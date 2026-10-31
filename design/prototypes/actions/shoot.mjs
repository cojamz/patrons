// Screenshots of the three action-space directions. Run from the repo root:
//   node design/prototypes/actions/shoot.mjs [1 2 3 compare]
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const shots = path.join(dir, 'shots');
const want = process.argv.slice(2);
const pick = k => !want.length || want.includes(k);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function shoot(file, out, { w = 1270, h = 700, full = false, dpr = 1 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.join(dir, file));
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight));
  await page.screenshot({ path: path.join(shots, out), fullPage: full });
  console.log(out, errs.length ? 'ERRORS ' + errs.join(' | ') : 'ok', fonts.length ? '' : '(no web fonts loaded)');
  await ctx.close();
}

for (const n of ['1', '2', '3']) {
  if (!pick(n)) continue;
  await shoot(`option-${n}.html?view=wheel`, `option-${n}-wheel.png`);
  await shoot(`option-${n}.html?view=quadrant`, `option-${n}-quadrant.png`, { h: 820, full: true });
}
if (pick('compare')) await shoot('compare.html', 'compare.png', { w: 1500, h: 640 });
await browser.close();
