// E2E: the Reckoning and the minions, at 1270×700 (Cory: "a little animation showing which cult wins each round
// prize"; "placing a minion animates it from the leader to the wheel space; at round end they fly home").
//  (r1) at round end each quadrant pays in turn: the header names every quadrant's result;
//  (r2) the counts tick up: some player's count shows at least 3 values on its way up;
//  (r3) a "+N" token flies to every winner (one flight per winner per quadrant);
//  (r4) then the summary (Start round II) appears; Skip goes straight there on the next round end;
//  (r5) your placement sends a minion flying from your leader; when round II begins, the wheel's minions fly home.
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5196.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/reckoning';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5196;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
const shot = n => page.screenshot({ path: `${SHOTS}/${n}.png` }).catch(() => {});

// in-page: every header line, every count value per quadrant and player, and every flying ghost
await page.addInitScript(() => {
  window.__rk = { heads: [], counts: {}, tokens: 0, out: 0, home: 0 };
  const tick = () => {
    const h = document.querySelector('[data-reckon-head]');
    const rk = window.__rk;
    if (h && h.textContent && rk.heads[rk.heads.length - 1] !== h.textContent) rk.heads.push(h.textContent);
    const q = (document.querySelector('.lt-reckon') || {}).dataset?.reckon || '';
    for (const c of document.querySelectorAll('[data-reckon-count]')) {
      const k = `${q}:${c.dataset.reckonCount}`;
      const v = (c.querySelector('.tv') || c).textContent.trim();
      const seq = rk.counts[k] || (rk.counts[k] = []);
      if (seq[seq.length - 1] !== v) seq.push(v);
    }
    for (const g of document.querySelectorAll('.token-flight, .minion-flight')) {
      if (g.dataset.seen) continue;
      g.dataset.seen = '1';
      if (g.classList.contains('token-flight')) rk.tokens++;
      else if (g.classList.contains('home')) rk.home++;
      else rk.out++;
    }
    requestAnimationFrame(tick);
  };
  addEventListener('DOMContentLoaded', () => requestAnimationFrame(tick));
});

let ok = false;
try {
  await page.goto(`${base}/?botDelay=40`);
  await page.click('[data-home="local"]');
  await page.click('[data-start]');
  await page.waitForTimeout(400);
  const skip = await page.$('[data-intro-skip]'); if (skip) await skip.click();
  await page.waitForSelector('.lt-wheel .slot');

  const firstOption = async () => {
    for (const el of await page.$$('[data-option]:not([disabled])')) {
      const id = await el.getAttribute('data-option').catch(() => null);
      if (!id || id.startsWith('toggle:') || id === 'back' || id.startsWith('release:')) continue;
      try { await el.click({ timeout: 800 }); return true; } catch { /* covered or gone */ }
    }
    return false;
  };
  // round I: play until the Reckoning starts
  const t0 = Date.now();
  while (!(await page.$('.lt-reckon')) && Date.now() - t0 < 150000) { if (!(await firstOption())) await page.waitForTimeout(60); else await page.waitForTimeout(40); }
  if (!(await page.$('.lt-reckon'))) throw new Error('round I never reached the Reckoning');
  await shot('r1-reckoning');
  await page.waitForSelector('[data-next-round]', { timeout: 15000 });
  await shot('r4-summary');
  const rk = await page.evaluate(() => window.__rk);
  const quads = await page.$$eval('[data-plaque]', els => els.length);
  // (r1) every quadrant told
  const told = rk.heads.filter(h => / wins? \+\d+$| tie \+\d+$|no one scores$/.test(h));
  if (told.length < quads) errors.push(`(r1) the Reckoning told ${told.length} of ${quads} quadrants (${rk.heads.join(' | ')})`);
  // (r2) counts tick up
  const best = Math.max(0, ...Object.values(rk.counts).map(seq => new Set(seq).size));
  const top = Math.max(0, ...Object.values(rk.counts).map(seq => Number(seq[seq.length - 1]) || 0));
  if (top >= 2 && best < 3) errors.push(`(r2) no count ticked up through 3 values (best ${best}, highest count ${top})`);
  // (r3) a prize flight per winner
  const winners = told.reduce((n, h) => n + (/no one scores$/.test(h) ? 0 : h.split(':').slice(1).join(':').replace(/ (wins?|tie) \+\d+$/, '').split(' & ').length), 0);
  if (rk.tokens < winners) errors.push(`(r3) ${rk.tokens} prize flights for ${winners} winners`);
  // (r5) your placements flew out
  if (rk.out < 1) errors.push('(r5) no minion flew from a leader to the wheel');
  const onWheel = await page.$$eval('.lt-wheel [data-slot] .worker', els => els.length);
  // start round II: the minions fly home
  await page.click('[data-next-round]');
  await page.waitForTimeout(900);
  const home = await page.evaluate(() => window.__rk.home);
  if (onWheel && home < Math.min(onWheel, 3)) errors.push(`(r5) ${home} minions flew home of ${onWheel} on the wheel`);
  await shot('r5-round2');
  // (r4) Skip goes straight to the summary at the next round end
  const t1 = Date.now();
  while (!(await page.$('.lt-reckon')) && !(await page.$('[data-next-round]')) && !(await page.$('.results')) && Date.now() - t1 < 150000) { if (!(await firstOption())) await page.waitForTimeout(60); else await page.waitForTimeout(40); }
  const sk = await page.$('[data-reckon-skip]');
  if (sk) {
    await sk.click();
    const t2 = Date.now();
    await page.waitForSelector('[data-next-round]', { timeout: 3000 }).catch(() => errors.push('(r4) Skip did not go straight to the summary'));
    if (Date.now() - t2 > 2000) errors.push('(r4) the summary took over 2s after Skip');
  }
  console.log(`reckoning: ${told.length} quadrants told, best count run ${best}, ${rk.tokens} prize flights for ${winners} winners, ${rk.out} minions out, ${home} home`);
  ok = errors.length === 0;
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
  await shot('zz-failure');
}
await browser.close();
if (server) server.kill();
if (errors.length) console.error(errors.join('\n'));
console.log(ok ? 'PASS reckoning' : 'FAIL reckoning');
process.exit(ok ? 0 : 1);
