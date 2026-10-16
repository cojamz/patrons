import { browserPath } from './lib/browser.mjs';
// E2E motion gate: what you do yourself moves, at laptop size (1270×700) and on a phone (390×844, real touch).
//  (m1) a +6 follower buy counts up: your follower number shows at least 3 values between old and new (sampled per
//       painted frame; Tick.jsx steps one whole number per painted frame for small changes, so a loaded box that paints
//       rarely slows the count instead of skipping numbers);
//  (m2) your placement sends a worker token flying to the space;
//  (m3) your recruit flies from the shop as a fixed-size picture (no reflowed text spilling out), starting on screen;
//  (m4) laptop, Normal bots, Steady animations: after a bot step that shows something (it plays a chain of
//       animations), the next player's step (or that bot's next turn) waits at least 400ms; the same bot's own sub-steps
//       flow at their hand-off. This pinned the old fixed bot pace (600ms a step); since
//       Cory's 2026-10-15 calls ("clear and steady, not slow"; every action plays a chain) the chain sets the pace, a
//       bot's next step shows at its chain's hand-off, and a step with nothing to show (a pass) holds no fixed time.
//       The floor is MO.stepFloor at Steady (400ms × Steady's speed since the morning fixes: 480ms);
//  (m5) laptop, the same seeded game at Steady and at Relaxed: a rival's whole turn (their placement showing → the next
//       placement showing, bot to bot) takes at least 1.8× as long at Relaxed, at the median (Cory's play note, morning
//       fixes: "Animations are too fast even on Relaxed": Relaxed is twice Steady, Steady a little slower than before).
// Starts from a saved game (e2e/v4/lib/rich-save.mjs) where P1 holds 6 of every color and is about to place.
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5184.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { richSave } from './lib/rich-save.mjs';
import { seedSave } from './lib/seed.mjs';
import { MO, motionSpeed } from '../../src/v4/motion.js';

// (node has no saved speed: this reads Steady's own numbers)
if (motionSpeed() !== 'steady') throw new Error('motion.mjs reads Steady budgets');
const FLOOR = MO.stepFloor; // a rival's visible step stays up at least this long at Steady (m4)

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
const browser = await chromium.launch({ executablePath: browserPath });
const PROFILES = [
  { tag: 'laptop', ctx: { viewport: { width: 1270, height: 700 } }, fol: '.lt-seat.mine .tv' },
  // phone is out of scope for v0.2 (Cory, 2026-10-15: "don't worry about phone for now"): opt in with V4_PHONE=1, as touch.mjs
  ...(process.env.V4_PHONE ? [{ tag: 'phone', ctx: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, fol: '.lt-seat.mine .tv' }] : []),
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
  await seedSave(page, richSave()); // before the app runs (lib/seed.mjs)
  await page.goto(`${base}/`);
  await page.waitForSelector('[data-home="resume"]');
  const go = el => (prof.ctx.hasTouch ? el.tap() : el.click());
  await go(await page.$('[data-home="resume"]'));
  await page.waitForSelector('.lt-seat[data-pid]');
  await page.evaluate(INSTRUMENT, prof.fol);
  return { ctx, page, go };
}

async function place(page, go, prof) {
  await page.waitForSelector('.slot.can .base', { timeout: 8000 });
  // a plain gain space ("+3 blue"), so no question (a seat or a space to pick on the board) stands between it and the buy
  const slot = await (await page.evaluateHandle(() => { const s = [...document.querySelectorAll('.slot.can')].find(e => /: \+\d+ \w+\.( Open)/.test(e.getAttribute('aria-label') || '')) || document.querySelector('.slot.can'); return s.querySelector('.base'); })).asElement();
  await page.evaluate(() => { window.__ghosts = []; });
  const bb = await slot.boundingBox();
  if (prof.ctx.hasTouch) await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); else await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(300);
  const conf = await page.$('[data-place]');
  if (conf) await go(conf);
  // a space may ask something first: answer with the first choice until the buy step comes up
  for (let k = 0; k < 10 && !(await page.$('.lt[data-phase="buy"][data-yours="1"]')); k++) {
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
      // the +6 buy: "+6" on the older screen, "8 → 6" on the Lamplit shop's follower rates
      const big = await page.waitForSelector('[data-option^="tier:"][data-rate="big"], [data-option^="tier:"]:has-text("+6"), [data-option^="tier:"]:has-text("→ 6")', { timeout: 8000 });
      await page.evaluate(() => { window.__fol = [window.__fol[window.__fol.length - 1]]; });
      await big.scrollIntoViewIfNeeded();
      await go(big);
      const pay = await page.waitForSelector('.dialog.pay .pay-go[data-option], .dialog.pay .btn.pri[data-option]', { timeout: 2500 }).catch(() => null);
      if (pay) { await page.waitForTimeout(450); await go(pay); }
      // the buy plays as a chain at the default speed (director.js): coins in, followers out, then the count; wait for the
      // count to reach its new total (a loaded box paints rarely and takes longer), then judge the values it showed
      await page.waitForFunction(sel => { const f = window.__fol; return f.length && Number(f[f.length - 1]) - Number(f[0]) >= 6; }, null, { timeout: 12000 }).catch(() => {});
      await page.waitForTimeout(300);
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
      const card = await page.waitForSelector('.lt-shop .card.can[data-option]', { timeout: 8000 });
      await card.scrollIntoViewIfNeeded();
      await page.evaluate(() => { window.__ghosts = []; });
      await go(card);
      // on touch a tap reads the card (a sheet); its Recruit button recruits
      const recruit = prof.ctx.hasTouch ? await page.waitForSelector('[data-recruit]', { timeout: 2500 }).catch(() => null) : null;
      if (prof.ctx.hasTouch && !recruit) errors.push(`[${prof.tag}] (m3) tapping an affordable card showed no Recruit button`);
      if (recruit) await go(recruit);
      const pay = await page.waitForSelector('.dialog.pay .pay-go[data-option], .dialog.pay .btn.pri[data-option]', { timeout: 2500 }).catch(() => null);
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

// (m4) laptop pacing at Steady (no botDelay override): rounds I–II of a fresh game, a rival's visible step stays up
// at least FLOOR before the next player's step
{
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__steps = [];
    const watch = () => {
      const el = document.querySelector('.app.game');
      if (!el) { requestAnimationFrame(watch); return; }
      let prev = { moves: el.dataset.moves, bot: el.dataset.bot, actor: el.dataset.actor, phase: el.dataset.phase, round: (document.querySelector('header .round') || {}).textContent || '' };
      new MutationObserver(() => {
        const now = { moves: el.dataset.moves, bot: el.dataset.bot, actor: el.dataset.actor, phase: el.dataset.phase, round: (document.querySelector('header .round') || {}).textContent || '' };
        // shows: the step played a chain of its own (director.js counts each one as the table shows it)
        const chains = window.__patronsChains || 0;
        // by: who made the step; kind: the step's own phase (a placement starts a turn)
        if (now.moves !== prev.moves) { window.__steps.push({ t: performance.now(), byBot: prev.bot === '1', by: prev.actor, kind: prev.phase, inRound: /Round/.test(prev.round) && /Round/.test(now.round), modal: !!document.querySelector('.roundend'), shows: chains > (window.__chainsSeen || 0) }); window.__chainsSeen = chains; }
        prev = now;
      }).observe(el, { attributes: true, attributeFilter: ['data-moves'] });
    };
    addEventListener('DOMContentLoaded', watch);
  });
  try {
    await page.goto(`${base}/?intro=0&speed=steady`); // intro=0: no first-game intro over the table (src/v4/Intro.jsx; hotseat.mjs gates the intro)
    await page.click('[data-home="local"]');
    await page.click('[data-start]');
    await page.waitForSelector('.lt-seat[data-pid]');
    const t0 = Date.now();
    // rounds I and II: the turns between two players (what m4 guards) come a handful a round
    for (let round = 0; round < 2; round++) {
      if (round) { const nx = await page.$('[data-next-round]'); if (!nx) break; await nx.click(); await page.waitForTimeout(400); }
      while (!(await page.$('[data-next-round]')) && Date.now() - t0 < 120000 * (round + 1)) {
        const els = await page.$$('[data-option]:not([disabled])');
        for (const el of els) { const id = await el.getAttribute('data-option').catch(() => null); if (!id || id.startsWith('toggle') || id === 'back') continue; try { await el.click({ timeout: 1000 }); break; } catch { /* moved */ } }
        await page.waitForTimeout(120);
      }
    }
    const st = await page.evaluate(() => window.__steps || []);
    let pairs = 0, worst = Infinity;
    for (let i = 1; i < st.length; i++) {
      if (!st[i].byBot || !st[i - 1].byBot || !st[i].inRound || !st[i - 1].inRound || st[i].modal || st[i - 1].modal) continue;
      // what it guards: a rival's last visible step stays up at least 400ms before the next player's step (or that
      // rival's next turn, a new placement); the same bot's own sub-steps (the buy after a choice) flow at their
      // hand-off, and a pass between shows nothing of its own (Cory's pacing call)
      if (st[i].by === st[i - 1].by && st[i].kind !== 'place') continue;
      let j = i - 1;
      while (j > 0 && !st[j].shows && st[j - 1].by === st[i - 1].by && st[j].kind !== 'place') j--;
      if (!st[j].shows || st[j].by !== st[i - 1].by || st[j].modal || !st[j].inRound) continue;
      pairs++; worst = Math.min(worst, st[i].t - st[j].t);
    }
    console.log(`laptop pacing: ${pairs} hand-overs from a rival's visible step to the next player's (rounds I–II), shortest ${Math.round(worst)}ms`);
    if (pairs < 6) errors.push(`(m4) too few bot steps measured (${pairs})`);
    else if (worst < FLOOR - 20) errors.push(`(m4) bot steps ${Math.round(worst)}ms apart at 1270×700 (need ≥${FLOOR})`);
  } catch (e) { errors.push(`m4 run: ${e.message}`); }
  await ctx.close();
}

// (m5) Relaxed is about twice Steady: the same seeded game (Math.random seeded in the page, so the bots and the deal
// repeat; you play the first open space and pass), round I at each speed; each rival turn measured as the grammar's H3
// (a bot's placement showing → the next placement showing, both bots, same round). You only act on your own turn, so no
// click ever skips a rival's chain.
async function rivalTurns(speed) {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[m5 ${speed}] pageerror: ${e.message}`));
  await page.addInitScript(() => {
    let s = 20261016;
    Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    window.__st = [];
    const watch = () => {
      const el = document.querySelector('.app.game');
      if (!el) { requestAnimationFrame(watch); return; }
      let prev = { ...el.dataset };
      new MutationObserver(() => {
        const now = { ...el.dataset };
        if (now.moves !== prev.moves) window.__st.push({ t: performance.now(), byBot: prev.bot === '1', kind: prev.phase, round: prev.round, roundNow: now.round, modal: !!document.querySelector('.roundend, [data-next-round]') });
        prev = now;
      }).observe(el, { attributes: true, attributeFilter: ['data-moves'] });
    };
    addEventListener('DOMContentLoaded', watch);
  });
  const turns = [];
  try {
    await page.goto(`${base}/?intro=0&speed=${speed}`);
    await page.click('[data-home="local"]');
    await page.click('[data-start]');
    await page.waitForSelector('.lt-seat[data-pid]');
    const t0 = Date.now();
    const look = () => page.evaluate(() => { const g = document.querySelector('.app.game'); return document.querySelector('[data-next-round]') ? 'next' : g && g.dataset.yours === '1' ? g.dataset.phase || '?' : ''; }).catch(() => '');
    while (Date.now() - t0 < 150000) {
      const ph = await look();
      if (ph === 'next') break; // round I is over
      if (ph) {
        let el = ph === 'buy' ? await page.$('[data-option="pass"]:not([disabled])') : ph === 'place' ? await page.$('.slot.can .base') : null;
        // anything else (a setup pick, a rival's seat to target, a color, a payment): the first open option, as m4 does
        if (!el) for (const o of await page.$$('[data-option]:not([disabled]):not([aria-disabled="true"])')) { const id = await o.getAttribute('data-option').catch(() => null); if (id && !id.startsWith('toggle') && id !== 'back' && id !== '@unpick' && await o.isVisible().catch(() => false)) { el = o; break; } }
        if (el) { await el.click({ timeout: 1000 }).catch(() => {}); const conf = await page.$('[data-place]'); if (conf) await conf.click().catch(() => {}); }
      }
      await page.waitForTimeout(150);
    }
    const st = await page.evaluate(() => window.__st);
    for (let i = 0; i < st.length; i++) {
      if (st[i].kind !== 'place' || !st[i].byBot || st[i].modal || st[i].round !== '1') continue;
      let j = i + 1;
      while (j < st.length && st[j].kind !== 'place') j++;
      if (j >= st.length || !st[j].byBot || st[j].modal || st.slice(i, j + 1).some(x => x.roundNow !== '1')) continue;
      turns.push(Math.round(st[j].t - st[i].t));
    }
  } catch (e) { errors.push(`m5 ${speed} run: ${e.message}`); }
  await ctx.close();
  return turns;
}
{
  const med = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
  const steady = await rivalTurns('steady'), relaxed = await rivalTurns('relaxed');
  const ratio = med(relaxed) / med(steady);
  console.log(`rival turns, round I: Steady p50 ${med(steady)}ms (${steady.length}: ${steady.join(' ')}); Relaxed p50 ${med(relaxed)}ms (${relaxed.length}: ${relaxed.join(' ')}); Relaxed/Steady ${ratio.toFixed(2)}`);
  if (steady.length < 4 || relaxed.length < 4) errors.push(`(m5) too few rival turns measured (Steady ${steady.length}, Relaxed ${relaxed.length})`);
  else if (!(ratio >= 1.8)) errors.push(`(m5) a rival's turn at Relaxed is ${ratio.toFixed(2)}× Steady's (p50 ${med(relaxed)}ms vs ${med(steady)}ms; want ≥ 1.8×)`);
}

await browser.close();
if (server) server.kill();
if (errors.length) console.error(errors.join('\n'));
console.log(errors.length ? 'FAIL motion' : 'PASS motion');
process.exit(errors.length ? 1 : 0);
