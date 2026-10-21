import { browserPath } from './lib/browser.mjs';
// E2E travel gate (Cory, 2026-10-15: "whenever somebody does something it should be obvious … a steal moves from the
// other player to them"; wave 3 found moves that changed numbers with nothing in the air). At laptop size (1270×700),
// default speed (Steady), for each move P1 makes, a piece (or the member itself) must fly from where the rules take it
// to where they put it, and be in the air before the number it lands on changes:
//  (t1) a steal in round I and (t2) one in round III: from the rival's stack to yours;
//  (t3) a gift (Kickback): from the space's resource (its color's rim on the wheel, where a space's resources come
//       from since the wheel-slice rework) to the rival's stack;
//  (t4) a member taken (Poach): the member flies from the rival's seat to its new chip in yours;
//  (t5) a ransom paid: from your seat to the rival's stack;
//  (t6) a member's Use: from the member to your stack.
// Since the action stage (decisions 2026-10-15 20:30) a path may relay through the wheel's hub: the member steps off
// its seat (or the piece flies) to the stage, and what it gives flies on from there (from the member's card as it
// stands on the stage); both legs are checked.
// Every flight ghost is recorded as it's added to the page (a MutationObserver, so a loaded box that paints rarely can't
// hide one), with where it starts and where its path ends. Saves: e2e/v4/lib/travel-save.mjs.
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5430.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { travelSave } from './lib/travel-save.mjs';
import { seedSave } from './lib/seed.mjs';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/travel';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5430;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 120 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const browser = await chromium.launch({ executablePath: browserPath });

// every flight ghost the page adds: its kind, when, where it starts and where its path ends (its animation's last frame)
const INSTRUMENT = () => {
  window.__fl = [];
  const t0 = performance.now();
  const read = el => {
    const r = el.getBoundingClientRect();
    const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
    let dx = 0, dy = 0;
    for (const a of el.getAnimations()) {
      const ks = a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : [];
      const m = ks.length && /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(ks[ks.length - 1].transform || '');
      if (m) { dx = Number(m[1]); dy = Number(m[2]); break; }
    }
    return { cls: el.className, t: performance.now() - t0, x0, y0, x1: x0 + dx, y1: y0 + dy };
  };
  // a card or member stepping onto the action stage (ActionStage.jsx): it rests at its own left/top and flies in from
  // its first keyframe's translate (the place on the board it left), so that's where its path starts
  const readStage = el => {
    const r = el.getBoundingClientRect();
    const x1 = el.offsetLeft + el.offsetWidth / 2, y1 = el.offsetTop + el.offsetHeight / 2;
    let dx = 0, dy = 0;
    for (const a of el.getAnimations()) {
      const ks = a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : [];
      const m = ks.length && /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(ks[0].transform || '');
      if (m) { dx = Number(m[1]); dy = Number(m[2]); break; }
    }
    const hw = el.offsetWidth / 2, hh = el.offsetHeight / 2;
    return { cls: 'stage ' + el.dataset.stage, t: performance.now() - t0, x0: x1 + dx, y0: y1 + dy, x1, y1, w: r.width, box: { l: x1 - hw, r: x1 + hw, t: y1 - hh, b: y1 + hh } };
  };
  new MutationObserver(list => {
    for (const m of list) for (const el of m.addedNodes) {
      if (el.nodeType !== 1) continue;
      if (el.classList.contains('ghost-layer') && /piece-flight|card-flight/.test(el.className)) window.__fl.push(read(el));
      for (const s of el.matches('[data-stage]') ? [el] : el.querySelectorAll('[data-stage]')) window.__fl.push(readStage(s));
    }
  }).observe(document.body, { childList: true, subtree: true });
  window.__t = () => performance.now() - t0;
};

// a place on the board, as a rect (read before the move: a member that leaves its seat is gone after it)
const RECT = (w) => {
  const seat = pid => document.querySelector(`.lt-cult-seat[data-seat="${pid}"]`);
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width ? { l: r.left, t: r.top, r: r.right, b: r.bottom } : null; };
  switch (w.kind) {
    case 'stack': return box(seat(w.pid) && seat(w.pid).querySelector(`.cs-stack[data-res="${w.r}"]`));
    case 'space': return box(document.querySelector(`[data-slot="${w.key}"] .base`) || document.querySelector(`[data-slot="${w.key}"]`));
    // a resource a space gives comes from its color's own rim on the wheel (director.js: "Resources live at their
    // matching wheel rim")
    case 'rim': return box(document.querySelector(`.rim[data-rim-res="${w.r}"]`));
    case 'member': return box(seat(w.pid) && seat(w.pid).querySelector(`.cs-member[data-uids~="${w.uid}"]`));
    case 'crowd': case 'seat': return box(seat(w.pid));
    default: return null;
  }
};
const near = (x, y, r, pad = 24) => !!r && x >= r.l - pad && x <= r.r + pad && y >= r.t - pad && y <= r.b + pad;
const numAt = w => (w.kind === 'stack' ? (() => { const s = document.querySelector(`.lt-cult-seat[data-seat="${w.pid}"] .cs-stack[data-res="${w.r}"] b.num`); return s ? s.dataset.hold ?? s.textContent.trim() : null; })() : null);

async function check(kind, label) {
  let sv;
  try { sv = travelSave(kind); } catch (e) { errors.push(`(${label}) ${e.message}`); return; }
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${label}] pageerror: ${e.message}`));
  try {
    await seedSave(page, sv.save);
    await page.goto(`${base}/?intro=0&speed=steady`, { timeout: 90000 });
    await (await page.waitForSelector('[data-home="resume"]', { timeout: 60000 })).click();
    await page.waitForSelector('.lt-cult-seat[data-seat]', { timeout: 60000 });
    await page.evaluate(INSTRUMENT);
    await page.mouse.move(5, 690);
    const { to } = sv.expect;
    const from = sv.expect.from.kind === 'space' && to.kind === 'stack' ? { kind: 'rim', r: to.r } : sv.expect.from;
    let fromR = null, toR = null;
    const want = to.kind === 'stack' ? String(sv.after.players[to.pid].res[to.r] || 0) : null;
    for (const [k, id] of sv.moves.entries()) {
      const last = k === sv.moves.length - 1;
      // a member's Use lives on its hover card: point at the member first
      if (id.startsWith('use:')) {
        const chip = await page.waitForSelector(`.lt-cult-seat[data-seat="0"] .cs-member[data-uids~="${id.split(':')[1]}"]`, { timeout: 8000 });
        await chip.hover();
      }
      const el = await page.waitForSelector(`[data-option="${id}"]:not([disabled])`, { state: 'visible', timeout: 8000 });
      if (last) {
        fromR = await page.evaluate(RECT, from);
        toR = to.kind === 'member' ? await page.evaluate(RECT, { kind: 'seat', pid: to.pid }) : await page.evaluate(RECT, to);
        await page.evaluate(() => { window.__fl = []; window.__clickAt = window.__t(); });
        await page.evaluate(([to, want]) => {
          window.__landed = null;
          // (the seat is found fresh each time: seats re-order, and React may replace one)
          const seatOf = () => document.querySelector(`.lt-cult-seat[data-seat="${to.pid}"]`) || document.createElement('div');
          // a gain lands when the number first rises above what it showed before the click (a bot may spend it again
          // at once, so its final value can come and go between two frames)
          const shown = () => { const b = seatOf().querySelector(`.cs-stack[data-res="${to.r}"] b.num`); return b ? Number(b.dataset.hold ?? b.textContent.trim()) : NaN; };
          const was = to.kind === 'member' ? null : shown();
          const look = () => {
            if (window.__landed != null) return;
            if (to.kind === 'member') { const c = seatOf().querySelector(`.cs-member[data-uids~="${to.uid}"]`); if (c && getComputedStyle(c).opacity === '1') window.__landed = window.__t(); return; }
            if (shown() > was) window.__landed = window.__t();
          };
          new MutationObserver(look).observe(document.querySelector('.app.game') || document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-hold'] });
          const raf = () => { look(); if (window.__landed == null) requestAnimationFrame(raf); };
          requestAnimationFrame(raf);
        }, [to, want]);
      }
      const inSlot = await el.evaluate(e => !!e.closest('[data-slot]'));
      const target = inSlot ? (await el.$('.base')) || el : el;
      await target.click();
      if (!last) await page.waitForTimeout(450); // (a person's next click; the double-tap guard is 400ms)
    }
    // when the destination's number first rises (a stack: what's shown, data-hold while its pieces land), or when
    // the member's chip shows in your seat; watched in the page, so a value shown for one frame still counts
    const t0 = Date.now();
    let landedAt = null;
    while (Date.now() - t0 < 12000 && landedAt == null) { landedAt = await page.evaluate(() => window.__landed); if (landedAt == null) await page.waitForTimeout(50); }
    const fl = await page.evaluate(() => window.__fl);
    const clickAt = await page.evaluate(() => window.__clickAt);
    await page.screenshot({ path: `${SHOTS}/${label}.png` });
    if (landedAt == null) { errors.push(`(${label}) the move didn't land on screen within 12s (${to.kind}${to.r ? ' ' + to.r : ''}, want ${want ?? 'the chip'}, shows ${await page.evaluate(numAt, to)})`); return; }
    const toBox = to.kind === 'member' ? toR : toR;
    // straight from the source to the destination, or relayed through the action stage (Cory, 2026-10-15; decisions
    // 2026-10-15 20:30): one leg leaves the source for the hub, a later leg leaves the hub where it landed for the
    // destination, and that last leg is in the air before the destination's number changes
    // (a member on the stage is a wide card: what it gives leaves from its portrait, inside the card it landed as)
    const meet = (a, b) => Math.hypot(a.x1 - b.x0, a.y1 - b.y0) <= 48 || (!!a.box && near(b.x0, b.y0, a.box, 8));
    const ok = fl.filter(f => near(f.x1, f.y1, toBox) && f.t <= landedAt + 5 &&
      (near(f.x0, f.y0, fromR) || fl.some(a => a !== f && near(a.x0, a.y0, fromR) && !near(a.x0, a.y0, toBox, 0) && a.t <= f.t + 5 && meet(a, f))));
    console.log(`${label}: ${fl.length} flight(s) after the click, ${ok.length} from the source to the destination; landed ${Math.round(landedAt - clickAt)}ms after the click`);
    if (!fl.length) errors.push(`(${label}) nothing flew: the ${to.kind === 'member' ? 'member' : 'number'} changed with no flight in the air`);
    else if (!ok.length) errors.push(`(${label}) no flight went from ${from.kind} to ${to.kind} (flights: ${fl.map(f => `${f.cls.split(' ')[1] || f.cls} ${Math.round(f.x0)},${Math.round(f.y0)}→${Math.round(f.x1)},${Math.round(f.y1)} at ${Math.round(f.t - clickAt)}ms`).join('; ')}; source ${JSON.stringify(fromR)}, destination ${JSON.stringify(toBox)})`);
  } catch (e) { errors.push(`(${label}) run: ${e.message.split('\n')[0]}`); await page.screenshot({ path: `${SHOTS}/${label}-fail.png` }).catch(() => {}); }
  finally { await ctx.close(); }
}

await check('steal1', 't1 steal, round I');
await check('steal3', 't2 steal, round III');
await check('gift', 't3 gift');
await check('member', 't4 member taken');
await check('ransom', 't5 ransom paid');
await check('use', 't6 member use');

await browser.close();
if (server) server.kill();
if (errors.length) console.error(errors.join('\n'));
console.log(errors.length ? 'FAIL travel' : 'PASS travel');
process.exit(errors.length ? 1 : 0);
