import { browserPath, launchBrowser } from './lib/browser.mjs';
// E2E mid-chain click gate (snappy pair, 2026-10-25; UX research: "never block input on animation"). Laptop, 1270×700.
//  (c1) your turn has come while a rival's last step is still playing: a press on a space you can take skips the rest
//       of the show and places your minion there, with no second click (it used to skip the show and drop the click).
// From the saved game: place, end the turn, then wait for the bots' last step to be playing while it is already your
// turn (the table marks the spaces you can take in the newest state: data-live-open) and press one of them.
// Server: $V4_URL (check:v4 serves one).
import { chromium } from 'playwright';
import { richSave } from './lib/rich-save.mjs';
import { seedSave } from './lib/seed.mjs';

const base = process.env.V4_URL;
if (!base) { console.error('midchain: set V4_URL'); process.exit(2); }
const browser = await launchBrowser({ executablePath: browserPath });
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
await ctx.addInitScript(() => { try { localStorage.setItem('patrons.v4.motionSpeed', 'steady'); } catch { /* private window */ } });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
await seedSave(page, richSave());
await page.goto(`${base}/?intro=0`);
const resume = await page.waitForSelector('[data-home="resume"]', { timeout: 8000 }).catch(() => null);
if (!resume) { console.error('midchain: the saved game did not resume'); process.exit(1); }
await resume.click();
const moves = () => page.$eval('.app.game', e => Number(e.dataset.moves));
let tried = 0, placed = null;
for (let turn = 0; turn < 8 && placed == null; turn++) {
  // your turn: place anywhere lit (past a round's end card: Start round), then answer or end the turn until the bots move
  for (let k = 0; k < 120 && !(await page.$('.slot.can .base')); k++) {
    const next = await page.$('button:has-text("Start round")');
    if (next) await next.click().catch(() => {});
    await page.waitForTimeout(250);
  }
  await page.waitForSelector('.slot.can .base', { timeout: 30000 });
  await page.waitForTimeout(300);
  await page.click('.slot.can .base');
  for (let k = 0; k < 40; k++) {
    if (await page.$('[data-done-no-buy="on"]')) { await page.click('[data-done-no-buy="on"]'); break; }
    const opt = await page.$('.prompt.choice button[data-option]:not([disabled])');
    if (opt) await opt.click().catch(() => {});
    await page.waitForTimeout(150);
  }
  // the bots play; catch the moment your turn has come while their last step still plays
  const open = await page.waitForFunction(() => { const a = document.querySelector('.app.game'); return a && a.dataset.liveOpen ? a.dataset.liveOpen : null; }, null, { timeout: 30000, polling: 'raf' }).then(h => h.jsonValue(), () => null);
  if (!open) continue;
  tried++;
  const key = open.split(',')[0];
  const at = await page.$eval(`[data-slot="${key}"] .base`, e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }).catch(() => null);
  if (!at) continue;
  const m0 = await moves();
  await page.mouse.click(at.x, at.y); // a raw press: page.click would wait for the page to stop moving
  const t0 = Date.now();
  placed = await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, m0, { timeout: 1500 }).then(() => Date.now() - t0, () => null);
  if (placed == null) break;
}
await browser.close();
const fail = [];
if (!tried) fail.push('(c1) never caught your turn arriving while a rival step still played: nothing was tested');
else if (placed == null) fail.push('(c1) a press on a space you can take, while the last rival step still played, did not place your minion (the click was dropped)');
if (errors.length) fail.push(...errors);
if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log(`midchain: ok (a press mid-show placed your minion; the move went in ${placed}ms after the press)`);
