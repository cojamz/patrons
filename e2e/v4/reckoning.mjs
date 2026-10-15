// E2E: the Reckoning and the minions, at 1270×700 (Cory: "a little animation showing which cult wins each round
// prize"; "placing a minion animates it from the leader to the wheel space; at round end they fly home").
//  (r1) at round end each quadrant pays in turn: the header names every quadrant's result;
//  (r2) the counts tick up: some player's count shows at least 3 values on its way up;
//  (r3) a "+N" token flies to every winner (one flight per winner per quadrant);
//  (r4) then the summary (Start round II) appears; Skip goes straight there on the next round end;
//  (r5) your placement sends a minion flying from your leader; when round II begins, the wheel's minions fly home;
//  (r6) no flying ghost (a minion, a "+N" of followers, a card) outlives its flight: each is gone within 2.5s;
//  (r7) the round-III summary at 1270×700: the end-game bonus line is on screen without scrolling, and the whole
//       summary fits (no "More below"), from a saved game at P1's last placement (e2e/v4/lib/late-save.mjs).
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5196.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { lateSave } from './lib/late-save.mjs';

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
  window.__rk = { heads: [], counts: {}, tokens: 0, out: 0, home: 0, longest: 0, stuck: [] };
  const alive = new Map(); // every flying ghost (a minion, a "+N" of followers, a card) and when it took off
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
    // (r6) no ghost outlives its flight: each is gone within 2.5s of taking off
    const now = performance.now();
    for (const g of document.querySelectorAll('.ghost-layer')) if (!alive.has(g)) alive.set(g, now);
    for (const [g, t0] of alive) {
      const life = now - t0;
      if (!g.isConnected) { rk.longest = Math.max(rk.longest, life); alive.delete(g); }
      else if (life > 2500 && !g.dataset.stuck) { g.dataset.stuck = '1'; rk.stuck.push(`${g.className.replace(' ghost-layer', '')} still flying after ${Math.round(life)}ms`); }
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
  const rk2 = await page.evaluate(() => window.__rk);
  rk2.stuck.forEach(m => errors.push(`(r6) a ghost outlived its flight: ${m}`));
  console.log(`reckoning: ${told.length} quadrants told, best count run ${best}, ${rk.tokens} prize flights for ${winners} winners, ${rk.out} minions out, ${home} home, longest flight ${Math.round(rk2.longest)}ms`);
  // (r7) the round-III summary at 700px tall: the end-game bonuses are on screen without scrolling
  {
    const p3 = await browser.newPage({ viewport: { width: 1270, height: 700 } });
    p3.on('pageerror', e => errors.push(`r7 pageerror: ${e.message}`));
    await p3.goto(`${base}/?botDelay=20&intro=0`);
    await p3.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), lateSave(21, 3));
    await p3.reload();
    await p3.click('[data-home="resume"]');
    await p3.waitForSelector('.lt-wheel .slot');
    const t3 = Date.now();
    while (!(await p3.$('.roundend')) && Date.now() - t3 < 60000) {
      const sk = await p3.$('[data-reckon-skip]');
      if (sk) { await sk.click().catch(() => {}); continue; }
      const o = await p3.$('.slot.can, [data-option]:not([disabled]):not([data-option^="toggle:"]):not([data-option^="release:"]):not([data-option="back"])');
      if (o) await o.click({ timeout: 800 }).catch(() => {});
      await p3.waitForTimeout(80);
    }
    await p3.waitForTimeout(900); // the totals tick up
    const r = await p3.evaluate(() => {
      const d = document.querySelector('.roundend');
      if (!d) return null;
      const body = d.querySelector('.re-body'), fin = d.querySelector('.re-final');
      const B = body.getBoundingClientRect(), D = d.getBoundingClientRect();
      const f = fin && fin.getBoundingClientRect();
      return { round: d.querySelector('h2').textContent, fin: !!fin, text: fin && fin.innerText, inView: !!f && f.top >= B.top - 1 && f.bottom <= B.bottom + 1 && f.bottom <= innerHeight, scrolls: body.scrollHeight - body.clientHeight, more: !!d.querySelector('.re-more'), onScreen: D.top >= 0 && D.bottom <= innerHeight };
    });
    if (!r) errors.push('(r7) the round-III summary never appeared');
    else {
      if (!/III/.test(r.round)) errors.push(`(r7) expected the round-III summary, saw "${r.round}"`);
      if (!r.fin) errors.push('(r7) the last round\'s summary has no end-game bonus line');
      else if (!r.inView) errors.push(`(r7) the end-game bonus line is below the fold at 700px ("${r.text}")`);
      if (r.more || r.scrolls > 1) errors.push(`(r7) the round-III summary scrolls at 700px (${r.scrolls}px more${r.more ? ', "More below"' : ''})`);
      if (!r.onScreen) errors.push('(r7) the round-III summary runs off the window');
      console.log(`reckoning: round-III summary fits at 700px; bonuses: ${r.text}`);
    }
    await p3.screenshot({ path: `${SHOTS}/r7-round3-summary.png` }).catch(() => {});
    await p3.close();
  }
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
