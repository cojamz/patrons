// E2E layout gate (panel 7, laptop V): text you need is never cut off.
//  (l1) while you place, every compact shop card shows its whole name and whole list cost (no ellipsis, no clip);
//  (l2) every follower buy shows its whole label and price, while placing and while buying;
//  (l3) nothing makes the page scroll sideways;
//  (l4) a member whose color isn't on the table never prints that color as its cost;
//  (l5) no color rule for follower buys anywhere (they take anything);
//  (l6) at setup the starting-resource picker never covers the wheel (RC1: it hid the lower half, so a newcomer
//       never saw that the wheel spins): the picker stays outside the wheel's disc, and the whole disc is on screen.
// Checked at 1270×700, 900×700 (the "900px clipping") and 1100×700, from a saved game (e2e/v4/lib/rich-save.mjs).
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5186.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { richSave } from './lib/rich-save.mjs';
import { answerChoice } from './lib/answer.mjs';
import { seedSave } from './lib/seed.mjs';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/layout';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5186;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

// elements whose text must be whole: cut means it overflows its own box or its nearest clipping ancestor
const CUT = sels => {
  const out = [];
  // an invisible hit-area helper (.hitbox: a 44px touch target around a small control) isn't text: measure without it
  const quiet = document.createElement('style');
  quiet.textContent = '.hitbox{display:none!important}';
  document.head.appendChild(quiet);
  const vis = e => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  for (const sel of sels) for (const e of document.querySelectorAll(sel)) {
    if (!vis(e) || e.closest('[aria-hidden="true"]')) continue;
    const txt = e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 2) { out.push(`${sel} "${txt}" overflows its box`); continue; }
    const b = e.getBoundingClientRect();
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (/(hidden|clip)/.test(s.overflow + s.overflowX + s.overflowY)) {
        const c = a.getBoundingClientRect();
        // a scroll box may hide things below the fold; sideways it may not
        const scrolls = /(auto|scroll)/.test(s.overflowY);
        if (b.left < c.left - 1 || b.right > c.right + 1 || (!scrolls && (b.top < c.top - 1 || b.bottom > c.bottom + 1))) out.push(`${sel} "${txt}" clipped by .${String(a.className).split(' ')[0]}`);
        break;
      }
    }
  }
  quiet.remove();
  return out;
};

for (const size of [{ width: 1270, height: 700 }, { width: 900, height: 700 }, { width: 1100, height: 700 }]) {
  const tag = `${size.width}x${size.height}`;
  const ctx = await browser.newContext({ viewport: size });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${tag}] pageerror: ${e.message}`));
  const check = async (step, sels) => {
    const cut = await page.evaluate(CUT, sels);
    for (const c of cut) errors.push(`[${tag} ${step}] ${c}`);
    const side = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (side > 0) errors.push(`[${tag} ${step}] (l3) the page scrolls sideways by ${side}px`);
    if (cut.length) await page.screenshot({ path: `${SHOTS}/${tag}-${step}-cut.png` });
    // (l5) follower buys take anything (Cory, 2026-10-14): no color rule anywhere on the table
    const rule = await page.evaluate(() => (document.body.innerText.match(/\d\+ colors|counts as any colou?r|at least \d colou?rs/i) || [])[0]);
    if (rule) errors.push(`[${tag} ${step}] (l5) the table still shows a color rule: "${rule}"`);
  };
  try {
    await seedSave(page, richSave()); // before the app runs (lib/seed.mjs)
    await page.goto(`${base}/`);
    await page.click('[data-home="resume"]');
    await page.waitForSelector('.lt-shop .card');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/${tag}-place.png` });
    await check('place', ['.lt-shop .card .nm', '.lt-shop .card .ft', '.lt-shop .card .lt-cost', '.lt-shop .lt-rate b', '.lt-shop .lt-rate']);
    // (l4) the classic table has no magenta: a magenta-leaning guest's cost reads in "any"
    const res = await page.evaluate(() => [...document.querySelectorAll('.lt-seat[data-pid="0"] [data-res]')].map(e => e.getAttribute('title') || e.textContent));
    // a cost is drawn as shapes: its words are in its label
    const costs = await page.$$eval('.lt-shop .card .lt-cost', els => els.map(e => e.getAttribute('aria-label') || e.textContent));
    for (const c of costs) for (const color of ['magenta', 'purple', 'silver', 'white', 'yellow']) if (c.includes(color)) errors.push(`[${tag}] (l4) a cost names ${color}, which isn't on this table: "${c}" (${res.join(',')})`);
    // place, answer any question, then the buy step
    const slot = await page.$('.slot.can .base');
    const bb = await slot.boundingBox();
    await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForTimeout(300);
    for (let k = 0; k < 16 && !(await page.$('.lt[data-phase="buy"][data-yours="1"]')); k++) {
      // a choice is answered where it's asked: a button, or on the board (a rival's seat or stack: lib/answer.mjs);
      // only while one is open, so a placement still landing never gets a second click on the table
      // (never Pass, a buy or another space: the step can turn to the buy step between the check and the click)
      if (await page.$('.lt[data-phase="choose"][data-yours="1"], .lt[data-phase="pay"][data-yours="1"]')) await answerChoice(page, { avoid: ['pass', 'card:', 'tier:', 'slot:', 'release:'] });
      await page.waitForTimeout(250);
    }
    await page.waitForSelector('.lt[data-phase="buy"][data-yours="1"]', { timeout: 5000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/${tag}-buy.png` });
    await check('buy', ['.lt-shop .lt-rate b', '.lt-shop .lt-rate', '.lt-shop .card .nm']);
  } catch (e) {
    errors.push(`[${tag}] run: ${e.message}`);
    await page.screenshot({ path: `${SHOTS}/${tag}-fail.png` }).catch(() => {});
  }
  await ctx.close();
}

// (l6) the setup picker and the wheel, side by side at laptop sizes
for (const size of [{ width: 1270, height: 700 }, { width: 1100, height: 700 }]) {
  const tag = `${size.width}x${size.height}`;
  const ctx = await browser.newContext({ viewport: size });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${tag} setup] pageerror: ${e.message}`));
  try {
    await page.goto(`${base}/?botDelay=20&intro=0`);
    await page.click('[data-home="local"]');
    await page.click('[data-start]');
    await page.waitForSelector('.prompt.choice.setup [data-option]', { timeout: 20000 });
    await page.waitForTimeout(700); // the wheel settles to its setup size
    const r = await page.evaluate(() => {
      const st = document.querySelector('.lt-wheel .stage').getBoundingClientRect();
      const pk = document.querySelector('.prompt.choice.setup').getBoundingClientRect();
      // the paper disc: radius 200 of the board's square (its viewBox), centred in the stage
      const vb = document.querySelector('.lt-wheel svg.wheel-paper').viewBox.baseVal;
      const cx = st.left + st.width / 2, cy = st.top + st.height / 2, rad = st.width * 200 / vb.width;
      const nx = Math.max(pk.left, Math.min(cx, pk.right)), ny = Math.max(pk.top, Math.min(cy, pk.bottom));
      return { gap: Math.round(Math.hypot(nx - cx, ny - cy) - rad), disc: [cy - rad, cy + rad].map(Math.round), h: innerHeight, size: Math.round(rad * 2) };
    });
    if (r.gap < 0) errors.push(`[${tag} setup] (l6) the starting-resource picker covers the wheel by ${-r.gap}px`);
    if (r.disc[0] < 0 || r.disc[1] > r.h) errors.push(`[${tag} setup] (l6) the wheel runs off the window at setup (${r.disc.join('–')})`);
    if (r.size < 300) errors.push(`[${tag} setup] (l6) the wheel shrank to ${r.size}px at setup`);
    await page.screenshot({ path: `${SHOTS}/${tag}-setup.png` });
  } catch (e) {
    errors.push(`[${tag} setup] run: ${e.message}`);
  }
  await ctx.close();
}

await browser.close();
if (server) server.kill();
if (errors.length) console.error([...new Set(errors)].join('\n'));
console.log(errors.length ? 'FAIL layout' : 'PASS layout');
process.exit(errors.length ? 1 : 0);
