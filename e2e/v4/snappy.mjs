// E2E snappy gate (Cory, 2026-10-15: "it just doesn't feel snappy", "the wheel spins really slow"). Laptop, 1270×700.
//  (s1) a wheel spin (an arrow key) starts within 100ms and has landed within 400ms;
//  (s2) a hover card opens within 100ms of the pointer arriving: wheel spaces, shop cards and keyword tips;
//  (s3) a click on a lit space shows your minion standing on it (painted, opacity ≥ .5) within 150ms.
// Load-honest: times are taken in the page (performance.now at the input event, rAF for what's painted). The box's own
// stalls are reported, never forgiven wholesale: a spin may finish one frame late (the frame the box held up), and
// each check takes the better of a few tries (a real slowdown fails every try).
// Motion budgets live in src/v4/motion.js (JS) and the --mo-* tokens at the top of src/v4/v4.css (CSS).
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5184.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { richSave } from './lib/rich-save.mjs';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/snappy';
mkdirSync(SHOTS, { recursive: true });
const LIMIT = { spinStart: 100, spin: 400, hover: 100, minion: 150 };
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5184;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const report = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
await page.goto(`${base}/?intro=0`);
await page.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), richSave());
await page.reload();
// the saved game (P1 about to place); a dev server whose rules hash went stale sets it aside: then a fresh game,
// picking the starting resources until a space lights
const resume = await page.waitForSelector('[data-home="resume"]', { timeout: 8000 }).catch(() => null);
if (resume) await resume.click();
else {
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${base}/?intro=0`);
  await page.click('[data-home="local"]');
  await page.click('[data-start]');
  for (let k = 0; k < 40 && !(await page.$('.slot.can .base')); k++) {
    const opt = await page.$('.prompt.choice button[data-option]:not([disabled])');
    if (opt) await opt.click().catch(() => {});
    await page.waitForTimeout(250);
  }
}
await page.waitForSelector('.slot.can .base', { timeout: 15000 });
await page.waitForTimeout(600);

// one rAF loop for the whole page: frame times (the box's own stalls), the wheel's turn, hover visibility, minions
await page.evaluate(() => {
  const W = window.__snap = { frames: [], rot: [], key: null, hov: { lat: [], t0: null }, minion: null };
  const wheelG = () => document.querySelector('.lt-wheel svg.wheel-paper g.wheel, .stage svg g.wheel');
  const hoverUp = () => [...document.querySelectorAll('[data-hover-layer][data-open="1"], .peek, .popover:not([data-hover-layer])')]
    .some(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.left > -1000 && Number(getComputedStyle(e).opacity) > 0.05; });
  addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { W.key = performance.now(); W.rot = []; } }, true);
  addEventListener('pointerover', e => {
    if (e.target.closest && e.target.closest('[data-slot], [data-uid], [data-tip]') && !hoverUp() && W.hov.t0 == null) W.hov.t0 = performance.now();
  }, true);
  // the minion check: from the click on a lit space to the first frame it stands there, painted
  addEventListener('click', e => {
    const s = e.target.closest && e.target.closest('.slot.can[data-slot]');
    if (s && W.minion && W.minion.armed) Object.assign(W.minion, { armed: false, key: s.dataset.slot, t0: performance.now(), t1: null });
  }, true);
  const shown = el => { let o = 1; for (let e = el; e && !e.matches('[data-slot]'); e = e.parentElement) o *= Number(getComputedStyle(e).opacity); const b = el.getBoundingClientRect(); return b.width > 0 && o >= 0.5; };
  let last = null;
  const tick = now => {
    if (last != null) W.frames.push([now, now - last]);
    if (W.frames.length > 600) W.frames.splice(0, 300);
    last = now;
    const g = wheelG();
    if (g && W.key != null) {
      const t = g.getAttribute('transform') || '';
      if (!W.rot.length || W.rot[W.rot.length - 1][1] !== t) W.rot.push([performance.now(), t]);
    }
    const up = hoverUp();
    if (up && W.hov.t0 != null) { W.hov.lat.push(performance.now() - W.hov.t0); W.hov.t0 = null; }
    if (!up && W.hov.t0 == null) W.hov.idle = true;
    const m = W.minion;
    if (m && m.key && m.t1 == null) {
      const w = document.querySelector(`[data-slot="${m.key}"] .worker`);
      if (w && shown(w)) m.t1 = performance.now();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
const longestGap = (from, to) => page.evaluate(([a, b]) => Math.max(0, ...window.__snap.frames.filter(([t]) => t > a && t <= b + 1).map(([, d]) => d)), [from, to]);

// (s1) the wheel spin: an arrow key turns it a quarter; it must start at once and land fast
{
  const spin = async key => {
    await page.mouse.move(640, 690);
    await page.keyboard.press(key);
    await page.waitForTimeout(900);
    const { key: k, rot } = await page.evaluate(() => window.__snap);
    if (!rot.length || k == null) return null;
    const moved = rot.filter(([, t]) => t !== rot[0][1] || rot.length === 1);
    const first = rot.length > 1 ? rot[1][0] : rot[0][0], end = rot[rot.length - 1][0];
    void moved;
    const gap = await longestGap(k, end);
    // the spin's own length: to the frame that put the wheel down, less one late frame if the box stalled it
    return { start: first - k, total: end - k, own: end - k - Math.max(0, gap - 17), gap, frames: rot.length };
  };
  const runs = [];
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowRight']) {
    const r = await spin(key);
    if (r) runs.push(r);
    if (r && r.own <= LIMIT.spin && r.start <= LIMIT.spinStart) break;
  }
  const best = runs.slice().sort((a, b) => a.own - b.own)[0];
  report.push(`spin: ${runs.map(r => `${Math.round(r.total)}ms (starts ${Math.round(r.start)}ms, ${r.frames} frames, longest frame ${Math.round(r.gap)}ms)`).join('; ')}`);
  if (!best) errors.push('(s1) an arrow key did not turn the wheel');
  else {
    if (best.own > LIMIT.spin) errors.push(`(s1) the wheel spin took ${Math.round(best.own)}ms to land (want ≤ ${LIMIT.spin}ms; runs ${runs.map(r => Math.round(r.total)).join(', ')}ms)`);
    if (Math.min(...runs.map(r => r.start - Math.max(0, r.gap - 17))) > LIMIT.spinStart) errors.push(`(s1) the wheel first moved ${Math.round(best.start)}ms after the key (want ≤ ${LIMIT.spinStart}ms)`);
  }
  // face the start again (the rest measures the board as dealt)
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(700);
}

// (s2) hover: separate arrivals onto spaces, shop cards and keyword tips; the better of two runs counts
{
  const centers = sel => page.$$eval(sel, els => els.filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.top > 0 && b.bottom < innerHeight; })
    .map(e => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }));
  const spaces = await centers('[data-slot] .base');
  const cards = await centers('.lt-shop [data-uid]');
  const tips = await centers('.lt [data-tip]');
  const targets = [...spaces.slice(0, 8), ...cards.slice(0, 6), ...tips.slice(0, 4)];
  const measure = async () => {
    await page.evaluate(() => { window.__snap.hov.lat = []; window.__snap.hov.t0 = null; });
    let n = 0;
    for (const [x, y] of targets) {
      await page.mouse.move(4, 696);
      await page.waitForTimeout(260);
      await page.evaluate(() => { window.__snap.hov.t0 = null; });
      await page.mouse.move(x, y, { steps: 2 });
      await page.waitForTimeout(200);
      n++;
    }
    const lat = (await page.evaluate(() => window.__snap.hov.lat)).sort((a, b) => a - b);
    return { n, lat, p95: lat.length ? lat[Math.min(lat.length - 1, Math.floor(lat.length * 0.95))] : Infinity };
  };
  let run = await measure();
  const first = run;
  if (!(run.p95 <= LIMIT.hover)) { const again = await measure(); if (again.p95 < run.p95) run = again; }
  report.push(`hover: p95 ${Math.round(run.p95)}ms over ${run.lat.length}/${run.n} arrivals (${spaces.length} spaces, ${cards.length} cards, ${tips.length} tips on screen)${first !== run ? `, first run p95 ${Math.round(first.p95)}ms` : ''}`);
  if (run.lat.length < run.n - 2) errors.push(`(s2) only ${run.lat.length} of ${run.n} hover arrivals opened a card`);
  if (!(run.p95 <= LIMIT.hover)) errors.push(`(s2) hover cards open in p95 ${Math.round(run.p95)}ms (want ≤ ${LIMIT.hover}ms; samples ${run.lat.map(Math.round).join(',')})`);
  await page.mouse.move(4, 696);
  await page.waitForTimeout(300);
}

// (s3) click a lit space: your minion stands on it within 150ms. Undo between tries; the best of three counts.
{
  const tries = [];
  for (let k = 0; k < 3; k++) {
    const slots = await page.$$('.slot.can .base');
    const slot = slots[k % Math.max(1, slots.length)];
    if (!slot) break;
    const bb = await slot.boundingBox();
    await page.evaluate(() => { window.__snap.minion = { armed: true }; });
    await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForTimeout(700);
    const m = await page.evaluate(() => window.__snap.minion);
    if (m && m.t0 != null) {
      const gap = await longestGap(m.t0, m.t1 ?? m.t0 + 700);
      tries.push({ ms: m.t1 == null ? Infinity : m.t1 - m.t0, gap });
    }
    if (k === 0) await page.screenshot({ path: `${SHOTS}/after-place.png` });
    if (tries.length && tries[tries.length - 1].ms <= LIMIT.minion) break;
    // take it back (a space may have asked a question first: Undo is there either way) and try another space
    const undo = await page.$('.btn.undo');
    if (!undo) break;
    await undo.click();
    await page.waitForSelector('.slot.can .base', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  const best = Math.min(...tries.map(t => t.ms));
  report.push(`minion: ${tries.map(t => `${Number.isFinite(t.ms) ? Math.round(t.ms) : 'never'}ms (longest frame ${Math.round(t.gap)}ms)`).join('; ')}`);
  if (!tries.length) errors.push('(s3) could not click a lit space');
  else if (!(best <= LIMIT.minion)) errors.push(`(s3) your minion showed on the space ${Number.isFinite(best) ? `${Math.round(best)}ms` : 'never (700ms+)'} after the click (want ≤ ${LIMIT.minion}ms)`);
}

for (const line of report) console.log(`snappy: ${line}`);
await browser.close();
if (server) server.kill();
if (errors.length) console.error(errors.join('\n'));
console.log(errors.length ? 'FAIL snappy' : 'PASS snappy');
process.exit(errors.length ? 1 : 0);
