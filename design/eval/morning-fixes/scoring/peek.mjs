// Eyes on the end-game scoring: a saved game at P1's last placement of round III (e2e/v4/lib/late-save.mjs), played to
// the end, then the results' scoring sequence captured as a filmstrip at 1270×700.
//   node design/eval/morning-fixes/scoring/peek.mjs <url> <outDir> [speed] [seed]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { lateSave } from '../../../../e2e/v4/lib/late-save.mjs';
import { seedSave } from '../../../../e2e/v4/lib/seed.mjs';

const [url = 'http://localhost:5341', out = 'design/eval/morning-fixes/scoring', speed = 'steady', seed = '21'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => m.type() === 'error' && errs.push(m.text()));
await seedSave(page, lateSave(Number(seed), 3));
// a fake clock drives every timer and performance.now (Playwright); each CSS animation is seeked to the same virtual time
// before each frame (film.mjs's way), so the filmstrip shows the real pacing however slow a screenshot is
await page.clock.install();
await page.goto(`${url}/?intro=0&speed=${speed}`);
await page.click('[data-home="resume"]');
await page.waitForSelector('.lt-wheel .slot');
const t0 = Date.now();
while (!(await page.$('.roundend')) && Date.now() - t0 < 90000) {
  const sk = await page.$('[data-reckon-skip]');
  if (sk) { await sk.click().catch(() => {}); continue; }
  const o = await page.$('.slot.can, [data-option]:not([disabled]):not([data-option^="toggle:"]):not([data-option^="release:"]):not([data-option="back"])');
  if (o) await o.click({ timeout: 800 }).catch(() => {});
  await page.waitForTimeout(80);
}
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/00-round3-summary.png` });
await page.clock.pauseAt(Date.now() + 1000);
await page.click('[data-next-round]');
const s0 = Date.now();
const STEP = Number(process.env.FRAME_MS || 120);
const seek = () => page.evaluate(() => {
  const now = performance.now();
  for (const a of document.getAnimations()) {
    if (a.__born == null) { a.__born = now; a.pause(); }
    const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
    a.currentTime = Math.min(now - a.__born, t && Number.isFinite(t.endTime) ? t.endTime : Infinity);
  }
});
for (let k = 0; k < 120; k++) {
  await seek();
  await page.screenshot({ path: `${out}/film-${String(k).padStart(3, '0')}-${k * STEP}ms.png` });
  const done = await page.$('.over-cults[data-scored="done"]');
  if (done && process.env.TAIL !== '1') break;
  await page.clock.runFor(STEP);
}
await page.clock.runFor(1200);
await seek();
console.log(`filmstrip took ${Date.now() - s0}ms`);
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/99-final.png` });
const facts = await page.evaluate(() => ({
  pops: [...document.querySelectorAll('[data-score-pop]')].map(e => e.dataset.scorePop),
  finals: [...document.querySelectorAll('.over-seat')].map(e => [e.dataset.pid, e.querySelector('.final')?.textContent]),
}));
console.log(JSON.stringify(facts));
if (errs.length) console.log('errors:', errs.join('\n'));
await browser.close();
