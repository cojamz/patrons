import { browserPath, launchBrowser } from './lib/browser.mjs';
// Probe: how fast the round-end card and the results appear, and what they look like, at 1270×700 (todo: "round-end
// and end-game screens appear quickly"). From a saved game at P1's last placement of round III (lib/late-save.mjs):
//  (s1) the Reckoning ends → the round card is readable (fully opaque): ms, and the longest task meanwhile;
//  (s2) "See results" → the results are on screen: ms; then the end-game scoring's pops (followers, members, grants);
//  (s3) Skip on round I's Reckoning → its card readable: ms.
// Screenshots to $V4_SHOTS/score-screens (frames of the results' scoring as f-*.png). Exits 1 on an error or a card
// slower than 400ms. Server: $V4_URL (required).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { lateSave } from './lib/late-save.mjs';
import { seedSave } from './lib/seed.mjs';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/score-screens';
mkdirSync(SHOTS, { recursive: true });
const base = process.env.V4_URL;
if (!base) { console.error('set V4_URL'); process.exit(1); }
const errors = [];
const browser = await launchBrowser({ executablePath: browserPath });

// in-page: when a selector first shows up, and when it is first fully opaque (its own and every ancestor's opacity)
const watcher = () => {
  window.__ss = { seen: {}, opaque: {}, gone: {}, long: [], gaps: [] };
  let last = 0;
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__ss.long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ['longtask'] }); } catch { /* no longtask */ }
  const sels = { reckon: '.lt-reckon', card: '.dialog.roundend', results: '.results', pops: '.fs-pop', scored: '.over-cults[data-scored="done"]' };
  const opa = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };
  const tick = () => {
    const ss = window.__ss, now = Math.round(performance.now());
    // a frame that took over 50ms while the Reckoning or the round card is up: a hitch
    if (last && now - last > 50 && (document.querySelector('.lt-reckon') || ss.seen.reckon != null)) ss.gaps.push([now, now - last, document.querySelector('.lt-reckon') ? 'reckon' : document.querySelector('.dialog.roundend') ? 'card' : 'after']);
    last = now;
    for (const [k, s] of Object.entries(sels)) {
      const el = document.querySelector(s);
      if (el && ss.seen[k] == null) ss.seen[k] = now;
      if (el && ss.opaque[k] == null && opa(el) > 0.99) ss.opaque[k] = now;
      if (!el && ss.seen[k] != null && ss.gone[k] == null) ss.gone[k] = now;
    }
    requestAnimationFrame(tick);
  };
  addEventListener('DOMContentLoaded', () => requestAnimationFrame(tick));
};
const longIn = (ss, a, b) => Math.max(0, ...ss.long.filter(([t, d]) => t + d > a && t < b).map(([, d]) => d));

async function toCard(page, { skip }) {
  const t0 = Date.now();
  while (!(await page.$('.dialog.roundend')) && Date.now() - t0 < 90000) {
    if (skip) { const sk = await page.$('[data-reckon-skip]'); if (sk && await page.$('.lt-reckon')) { await page.waitForTimeout(500); await page.evaluate(() => { window.__ss.skipAt = Math.round(performance.now()); }); await sk.click().catch(() => {}); await page.waitForSelector('.dialog.roundend', { timeout: 5000 }).catch(() => {}); break; } }
    const o = await page.$('.slot.can, [data-option]:not([disabled]):not([data-option^="toggle:"]):not([data-option^="release:"]):not([data-option="back"])');
    if (o && !(await page.$('.lt-reckon'))) await o.click({ timeout: 800 }).catch(() => {});
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(700);
}

let ok = false;
try {
  // (s1, s2) round III
  {
    const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    await page.addInitScript(watcher);
    await seedSave(page, lateSave(21, 3));
    await page.goto(`${base}/?botDelay=20&intro=0`);
    await page.click('[data-home="resume"]');
    await page.waitForSelector('.lt-wheel .slot');
    await toCard(page, { skip: false });
    const ss = await page.evaluate(() => window.__ss);
    if (ss.opaque.card == null) throw new Error('the round-III card never appeared');
    const s1 = ss.opaque.card - ss.gone.reckon;
    console.log(`(s1) Reckoning ends → round-III card readable: ${s1}ms (first in DOM +${ss.seen.card - ss.gone.reckon}ms), longest task ${longIn(ss, ss.gone.reckon - 50, ss.opaque.card)}ms`);
    if (s1 > 400) errors.push(`(s1) the round card took ${s1}ms to appear`);
    await page.screenshot({ path: `${SHOTS}/round3-card.png` });
    const at = await page.evaluate(() => { const t = Math.round(performance.now()); document.querySelector('[data-next-round]').click(); return t; });
    // frames of the results as they score
    for (let k = 0; k < 10; k++) { await page.waitForTimeout(k ? 260 : 60); await page.screenshot({ path: `${SHOTS}/f-${String(k).padStart(2, '0')}.png` }); }
    await page.waitForTimeout(2500);
    const s2 = await page.evaluate(() => window.__ss);
    if (s2.opaque.results == null) throw new Error('the results never appeared');
    console.log(`(s2) See results → results readable: ${s2.opaque.results - at}ms, longest task ${longIn(s2, at, s2.opaque.results)}ms; first pop +${s2.seen.pops != null ? s2.seen.pops - at : '—'}ms; scoring done +${s2.seen.scored != null ? s2.seen.scored - at : '—'}ms`);
    if (s2.opaque.results - at > 400) errors.push(`(s2) the results took ${s2.opaque.results - at}ms to appear`);
    await page.screenshot({ path: `${SHOTS}/results.png` });
    await page.close();
  }
  // (s3) round I with Skip
  {
    const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    await page.addInitScript(watcher);
    await seedSave(page, lateSave(21, 1));
    await page.goto(`${base}/?botDelay=20&intro=0`);
    await page.click('[data-home="resume"]');
    await page.waitForSelector('.lt-wheel .slot');
    await toCard(page, { skip: true });
    const ss = await page.evaluate(() => window.__ss);
    if (ss.opaque.card == null) throw new Error('the round-I card never appeared');
    const from = ss.skipAt ?? ss.gone.reckon;
    console.log(`(s3) ${ss.skipAt != null ? 'Skip' : 'Reckoning ends'} → round-I card readable: ${ss.opaque.card - from}ms, longest task ${longIn(ss, from, ss.opaque.card)}ms`);
    if (ss.opaque.card - from > 400) errors.push(`(s3) the round card took ${ss.opaque.card - from}ms to appear`);
    await page.screenshot({ path: `${SHOTS}/round1-card.png` });
    await page.close();
  }
  // (s4) round I's whole Reckoning, its card, and Start round II: every frame over 50ms
  {
    const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    await page.addInitScript(watcher);
    await seedSave(page, lateSave(21, 1));
    await page.goto(`${base}/?botDelay=20&intro=0`);
    await page.click('[data-home="resume"]');
    await page.waitForSelector('.lt-wheel .slot');
    await toCard(page, { skip: false });
    await page.click('[data-next-round]');
    await page.waitForTimeout(1500);
    const ss = await page.evaluate(() => window.__ss);
    const by = {};
    for (const [, d, ph] of ss.gaps) (by[ph] ||= []).push(d);
    console.log(`(s4) Reckoning ${ss.gone.reckon - ss.seen.reckon}ms; frames over 50ms: ${Object.entries(by).map(([k, v]) => `${k} ${v.length} (worst ${Math.max(...v)}ms)`).join(', ') || 'none'}`);
    await page.close();
  }
  ok = errors.length === 0;
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
}
await browser.close();
if (errors.length) console.error(errors.join('\n'));
console.log(ok ? 'PASS score-screens' : 'FAIL score-screens');
process.exit(ok ? 0 : 1);
