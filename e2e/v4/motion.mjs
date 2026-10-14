// E2E motion gate: what you do yourself moves, at laptop size (1270×700) and on a phone (390×844, real touch).
//  (m1) a +6 follower buy counts up: your follower number shows at least 3 values between old and new;
//  (m2) your placement sends a worker token flying to the space;
//  (m3) your recruit flies from the shop as a fixed-size picture (no reflowed text spilling out), starting on screen;
//  (m4) laptop, Normal speed: consecutive bot steps in round I are at least 600ms apart.
// Starts from a saved game (e2e/v4/lib/rich-save.mjs) where P1 holds 6 of every color and is about to place.
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5184.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { richSave } from './lib/rich-save.mjs';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/motion';
mkdirSync(SHOTS, { recursive: true });
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
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const PROFILES = [
  { tag: 'laptop', ctx: { viewport: { width: 1270, height: 700 } }, fol: '.pl[data-pid="0"] .fol .tv' },
  { tag: 'phone', ctx: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, fol: '.you-strip .yf .tv' },
];

// every distinct value the follower number shows, frame by frame, plus every flight ghost's geometry
const INSTRUMENT = sel => {
  window.__fol = []; window.__ghosts = [];
  const tick = () => {
    const e = document.querySelector(sel);
    const v = e ? e.textContent.trim() : null;
    if (v != null && v !== window.__fol[window.__fol.length - 1]) window.__fol.push(v);
    for (const g of document.querySelectorAll('.flight, .worker-flight')) {
      if (g.dataset.seen) continue;
      g.dataset.seen = '1';
      const r = g.getBoundingClientRect();
      window.__ghosts.push({ kind: g.classList.contains('flight') ? 'card' : 'worker', top: r.top, left: r.left, w: r.width, h: r.height, overflow: g.scrollHeight - g.clientHeight, vw: innerWidth, vh: innerHeight });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

async function resumeRich(prof) {
  const ctx = await browser.newContext(prof.ctx);
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${prof.tag}] pageerror: ${e.message}`));
  await page.goto(`${base}/`);
  await page.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), richSave());
  await page.reload();
  await page.waitForSelector('[data-home="resume"]');
  const go = el => (prof.ctx.hasTouch ? el.tap() : el.click());
  await go(await page.$('[data-home="resume"]'));
  await page.waitForSelector('.players');
  await page.evaluate(INSTRUMENT, prof.fol);
  return { ctx, page, go };
}

async function place(page, go, prof) {
  const slot = await page.waitForSelector('.slot.can .base', { timeout: 8000 });
  await page.evaluate(() => { window.__ghosts = []; });
  const bb = await slot.boundingBox();
  if (prof.ctx.hasTouch) await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); else await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(300);
  const conf = await page.$('[data-place]');
  if (conf) await go(conf);
  // a space may ask something first: answer with the first choice until the buy step comes up
  for (let k = 0; k < 10 && !(await page.$('.fbuy.live')); k++) {
    const opt = await page.$('.prompt.choice button[data-option]:not([disabled])');
    if (opt) await go(opt).catch(() => {});
    await page.waitForTimeout(250);
  }
  // a new step ignores taps for 400ms (the double-tap guard); a person's next tap comes later than that
  await page.waitForTimeout(450);
  const g = await page.evaluate(() => window.__ghosts);
  if (!g.some(x => x.kind === 'worker')) errors.push(`[${prof.tag}] (m2) your placement sent no worker flying`);
}

for (const prof of PROFILES) {
  // (m1) + (m2): place, then buy +6 followers
  {
    const { ctx, page, go } = await resumeRich(prof);
    try {
      await place(page, go, prof);
      const big = await page.waitForSelector('[data-option^="tier:"]:has-text("+6")', { timeout: 8000 });
      await page.evaluate(() => { window.__fol = [window.__fol[window.__fol.length - 1]]; });
      await big.scrollIntoViewIfNeeded();
      await go(big);
      const pay = await page.waitForSelector('.dialog.pay .btn.pri[data-option]', { timeout: 2500 }).catch(() => null);
      if (pay) { await page.waitForTimeout(450); await go(pay); }
      await page.waitForTimeout(1600);
      const seq = await page.evaluate(() => window.__fol);
      const from = Number(seq[0]), to = Number(seq[seq.length - 1]);
      const between = [...new Set(seq.slice(1, -1).map(Number))].filter(v => v > Math.min(from, to) && v < Math.max(from, to));
      console.log(`${prof.tag}: +6 buy showed ${seq.join(' > ')}`);
      if (to - from < 6) errors.push(`[${prof.tag}] (m1) the +6 buy didn't land (${seq.join(' > ')})`);
      else if (between.length < 3) errors.push(`[${prof.tag}] (m1) follower count jumped ${from} → ${to} with ${between.length} values between (need 3)`);
      await page.screenshot({ path: `${SHOTS}/${prof.tag}-after-buy.png` });
    } catch (e) { errors.push(`[${prof.tag}] m1 run: ${e.message}`); await page.screenshot({ path: `${SHOTS}/${prof.tag}-m1-fail.png` }).catch(() => {}); }
    await ctx.close();
  }
  // (m3): place, then recruit the first affordable member
  {
    const { ctx, page, go } = await resumeRich(prof);
    try {
      await place(page, go, prof);
      const card = await page.waitForSelector('.fbuy.live .mini.can, .buy-view .card.can, .shop .card.can[data-option]', { timeout: 8000 });
      await card.scrollIntoViewIfNeeded();
      await page.evaluate(() => { window.__ghosts = []; });
      await go(card);
      const pay = await page.waitForSelector('.dialog.pay .btn.pri[data-option]', { timeout: 2500 }).catch(() => null);
      if (pay) { await page.waitForTimeout(450); await go(pay); }
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${SHOTS}/${prof.tag}-recruit-flight.png` });
      await page.waitForTimeout(900);
      const g = (await page.evaluate(() => window.__ghosts)).filter(x => x.kind === 'card');
      if (!g.length) errors.push(`[${prof.tag}] (m3) your recruit did not fly`);
      for (const x of g) {
        if (x.overflow > 2) errors.push(`[${prof.tag}] (m3) the flying card's content spills ${Math.round(x.overflow)}px (reflowed)`);
        if (x.top + x.h < 0 || x.top > x.vh || x.left + x.w < 0 || x.left > x.vw) errors.push(`[${prof.tag}] (m3) the flight starts off screen`);
      }
    } catch (e) { errors.push(`[${prof.tag}] m3 run: ${e.message}`); await page.screenshot({ path: `${SHOTS}/${prof.tag}-m3-fail.png` }).catch(() => {}); }
    await ctx.close();
  }
}

// (m4) laptop pacing at Normal speed (no botDelay override): round I of a fresh game, bot steps ≥600ms apart
{
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__steps = [];
    const watch = () => {
      const el = document.querySelector('.app.game');
      if (!el) { requestAnimationFrame(watch); return; }
      let prev = { moves: el.dataset.moves, bot: el.dataset.bot, round: (document.querySelector('header .round') || {}).textContent || '' };
      new MutationObserver(() => {
        const now = { moves: el.dataset.moves, bot: el.dataset.bot, round: (document.querySelector('header .round') || {}).textContent || '' };
        if (now.moves !== prev.moves) window.__steps.push({ t: performance.now(), byBot: prev.bot === '1', inRound: /Round/.test(prev.round) && /Round/.test(now.round), modal: !!document.querySelector('.roundend') });
        prev = now;
      }).observe(el, { attributes: true, attributeFilter: ['data-moves'] });
    };
    addEventListener('DOMContentLoaded', watch);
  });
  try {
    await page.goto(`${base}/`);
    await page.click('[data-home="local"]');
    await page.click('[data-start]');
    await page.waitForSelector('.players');
    const t0 = Date.now();
    while (!(await page.$('[data-next-round]')) && Date.now() - t0 < 120000) {
      const els = await page.$$('[data-option]:not([disabled])');
      for (const el of els) { const id = await el.getAttribute('data-option').catch(() => null); if (!id || id.startsWith('toggle') || id === 'back') continue; try { await el.click({ timeout: 1000 }); break; } catch { /* moved */ } }
      await page.waitForTimeout(120);
    }
    const st = await page.evaluate(() => window.__steps || []);
    let pairs = 0, worst = Infinity;
    for (let i = 1; i < st.length; i++) {
      if (!st[i].byBot || !st[i - 1].byBot || !st[i].inRound || !st[i - 1].inRound || st[i].modal || st[i - 1].modal) continue;
      pairs++; worst = Math.min(worst, st[i].t - st[i - 1].t);
    }
    console.log(`laptop pacing: ${pairs} bot step pairs in round I, shortest gap ${Math.round(worst)}ms`);
    if (pairs < 6) errors.push(`(m4) too few bot steps measured (${pairs})`);
    else if (worst < 570) errors.push(`(m4) bot steps ${Math.round(worst)}ms apart at 1270×700 (need ≥600)`);
  } catch (e) { errors.push(`m4 run: ${e.message}`); }
  await ctx.close();
}

await browser.close();
if (server) server.kill();
if (errors.length) console.error(errors.join('\n'));
console.log(errors.length ? 'FAIL motion' : 'PASS motion');
process.exit(errors.length ? 1 : 0);
