// E2E snappy gate (Cory, 2026-10-15: "it just doesn't feel snappy", "the wheel spins really slow"). Laptop, 1270×700.
//  (s1) a wheel spin (an arrow key) starts within 100ms and has landed within 400ms;
//  (s2) a hover card opens within 100ms of the end of the hover delay (Cory, 2026-10-15: hovers wait HOVER_DELAY_MS,
//       src/v4/game/hoverDelay.js, so a mouse sweeping across the board doesn't fire them nonstop; timed from the
//       pointer's arrival + HOVER_DELAY_MS): wheel spaces, shop cards, keyword tips, rivals' seats and the members in
//       them; it opens complete: its words, its size and its place 400ms later are the ones it first painted (no "You'd get" or
//       member list filling in after: testers saw cards fill in late, in bursts); and a quick sweep across several spaces
//       (the pointer moving on within the delay) opens no card at all;
//  (s3) a click on a lit space shows your minion standing on it (painted, opacity ≥ .5) within 100ms;
//  (s4) the animation speed setting changes a chain's length (Relaxed ≥ 1.8 × Quick);
//  (s5) the gap between your turns at Steady (bots at Normal) is under 8s × Steady's speed (9.6s);
//  (s6) with only the table's idle loops running on your turn, the page draws at least 30 frames a second;
//  (s7) a press on a lit space reaches the screen (the next frame) within 100ms.
// s1–s3 measure input → first response, never a chain's length: a chain plays after your move has shown.
// Frame-honest: times are taken in the page (performance.now at the input event, rAF for what's painted). A loaded box
// paints less often, so each limit allows one of the box's own frames on top (the median rAF interval with nothing
// moving, measured just before each check: ~17ms on a quiet box, so the limits bite there), and each check takes the
// better of a few tries (a real slowdown fails every try). Every number is printed with the box frame it allowed.
// Motion budgets live in src/v4/motion.js (JS) and the --mo-* tokens at the top of src/v4/v4.css (CSS).
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5184.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { richSave } from './lib/rich-save.mjs';
import { seedSave } from './lib/seed.mjs';
import { SPEEDS } from '../../src/v4/motion.js';
import { HOVER_DELAY_MS } from '../../src/v4/game/hoverDelay.js';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/snappy';
mkdirSync(SHOTS, { recursive: true });
const LIMIT = { spinStart: 100, spin: 400, hover: 100, minion: 100 }; // minion: 150 → 100 (2026-10-15, drawn in the click's frame)
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
await seedSave(page, richSave()); // before the app runs (lib/seed.mjs)
await page.goto(`${base}/?intro=0`);
// V4_CPU=4: the slow laptop (CDP CPU throttling), for checking the limits where the squad's bar is set
if (Number(process.env.V4_CPU) > 1) await (await ctx.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.V4_CPU) });
// the saved game (P1 about to place); a dev server whose rules hash went stale sets it aside: then a fresh game,
// picking the starting resources until a space lights
const resume = await page.waitForSelector('[data-home="resume"]', { timeout: 8000 }).catch(() => null);
if (resume) await resume.click();
else {
  await seedSave(page, null, { clear: true }); // no saved game on the next load (lib/seed.mjs)
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
await page.evaluate(delay => {
  const W = window.__snap = { frames: [], rot: [], key: null, hov: { lat: [], t0: null }, minion: null, delay, sweep: null };
  const wheelG = () => document.querySelector('.lt-wheel svg.wheel-paper g.wheel, .stage svg g.wheel');
  // a card on screen (one waiting out the hover delay is drawn off screen and hidden: data-prep, never counted)
  const upEl = () => [...document.querySelectorAll('[data-hover-layer][data-open="1"], .peek, .popover:not([data-hover-layer]):not([data-prep])')]
    .find(e => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.left > -1000 && Number(cs.opacity) > 0.05 && cs.visibility !== 'hidden'; });
  const hoverUp = () => !!upEl();
  // what a card says and how tall it is: the same 400ms later, or it filled in after it opened
  // (its place too: a card that slides or jumps after it shows hasn't opened whole either)
  W.cardSig = () => { const e = upEl(); if (!e) return null; const b = e.getBoundingClientRect(); return `${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.height)}|${e.innerText}`; };
  W.hoverUp = hoverUp;
  addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { W.key = performance.now(); W.rot = []; } }, true);
  // each arrival starts with no card up (the loop waits for that), so the arrival arms on the target alone: under load
  // the target's own card was sometimes already up when this listener ran, and a "no card up" check never armed it
  addEventListener('pointerover', e => {
    if (e.target.closest && e.target.closest('[data-slot], [data-uid], [data-tip], [data-cult]') && W.hov.t0 == null) W.hov.t0 = performance.now();
    if (W.sweep) W.sweep.at.push(performance.now());
  }, true);
  // the minion check: from the click on a lit space to the first frame it stands there, painted
  // the press: from the pointer going down on a lit space to the next frame (the one that paints it)
  addEventListener('pointerdown', e => {
    const s = e.target.closest && e.target.closest('.slot.can[data-slot]');
    if (s && W.minion && W.minion.armed) { const t = performance.now(); requestAnimationFrame(() => { W.press = performance.now() - t; }); }
  }, true);
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
    // the angle the board shows: its group's rotate() plus any CSS turn on its layer (a spin runs on the compositor as a
    // Web Animation on the layer; the computed transform reads the animated value)
    const g = wheelG();
    if (g && W.key != null) {
      const m = /rotate\((-?[\d.e]+)/.exec(g.getAttribute('transform') || '');
      const tf = getComputedStyle(g.ownerSVGElement).transform;
      const mm = /^matrix\((-?[\d.e]+),\s*(-?[\d.e]+)/.exec(tf || '');
      const t = ((m ? Number(m[1]) : 0) + (mm ? (Math.atan2(Number(mm[2]), Number(mm[1])) * 180) / Math.PI : 0)).toFixed(1);
      if (!W.rot.length || W.rot[W.rot.length - 1][1] !== t) W.rot.push([performance.now(), t]);
    }
    const up = hoverUp();
    // from the end of the hover delay (the arrival + HOVER_DELAY_MS)
    if (up && W.hov.t0 != null) { W.hov.lat.push(performance.now() - W.hov.t0 - W.delay); W.hov.t0 = null; W.hov.sig0 = W.cardSig(); }
    if (up && W.sweep) W.sweep.opened = W.sweep.opened || W.cardSig();
    if (!up && W.hov.t0 == null) W.hov.idle = true;
    const m = W.minion;
    if (m && m.key && m.t1 == null) {
      const w = document.querySelector(`[data-slot="${m.key}"] .worker`);
      if (w && shown(w)) m.t1 = performance.now();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}, HOVER_DELAY_MS);
// the box's own frame: the median rAF interval over ~600ms with nothing moving
const idleFrame = async () => {
  const t = await page.evaluate(() => performance.now());
  await page.waitForTimeout(600);
  return page.evaluate(a => { const d = window.__snap.frames.filter(([t]) => t > a).map(([, x]) => x).sort((x, y) => x - y); return d.length ? d[Math.floor(d.length / 2)] : 17; }, t);
};
const longestGap = (from, to) => page.evaluate(([a, b]) => Math.max(0, ...window.__snap.frames.filter(([t]) => t > a && t <= b + 1).map(([, d]) => d)), [from, to]);

// (s1) the wheel spin: an arrow key turns it a quarter; it must start at once and land fast
{
  const spin = async key => {
    await page.mouse.move(640, 690);
    await page.keyboard.press(key);
    await page.waitForTimeout(1200);
    const { key: k, rot } = await page.evaluate(() => window.__snap);
    if (!rot.length || k == null) return null;
    const first = rot.length > 1 ? rot[1][0] : rot[0][0], end = rot[rot.length - 1][0];
    return { start: first - k, total: end - k, gap: await longestGap(k, end), frames: rot.length };
  };
  const runs = [];
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowRight']) {
    const F = await idleFrame();
    const r = await spin(key);
    if (r) runs.push({ ...r, F });
    if (r && r.total <= LIMIT.spin + F && r.start <= LIMIT.spinStart + F) break;
  }
  const best = runs.slice().sort((a, b) => (a.total - a.F) - (b.total - b.F))[0];
  report.push(`spin: ${runs.map(r => `${Math.round(r.total)}ms (starts ${Math.round(r.start)}ms, ${r.frames} frames, longest ${Math.round(r.gap)}ms, box frame ${Math.round(r.F)}ms)`).join('; ')}`);
  if (!best) errors.push('(s1) an arrow key did not turn the wheel');
  else {
    if (best.total > LIMIT.spin + best.F) errors.push(`(s1) the wheel spin took ${Math.round(best.total)}ms to land (want ≤ ${LIMIT.spin}ms + one ${Math.round(best.F)}ms frame; runs ${runs.map(r => Math.round(r.total)).join(', ')}ms)`);
    if (!runs.some(r => r.start <= LIMIT.spinStart + r.F)) errors.push(`(s1) the wheel first moved ${Math.round(best.start)}ms after the key (want ≤ ${LIMIT.spinStart}ms + one ${Math.round(best.F)}ms frame)`);
  }
  // face the start again (the rest measures the board as dealt)
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(900);
}

// (s6) the page's own frames on your turn, with only the idle loops running (the minions' bob, the leaders' breath): at
// least 30 a second. A per-frame effect over a big region dropped them to 15 (2026-10-15: the wheel's drop-shadow filter,
// re-blurred on every frame of any animation in a software compositor), and every hover and press waited for one. The
// other limits allow one of these frames on top, so this is what keeps them honest. The better of three reads counts.
{
  const reads = [await idleFrame(), await idleFrame(), await idleFrame()];
  const F = Math.min(...reads);
  report.push(`idle frame on your turn: ${reads.map(Math.round).join(', ')}ms`);
  if (F > 34) errors.push(`(s6) with nothing happening on your turn the page draws a frame every ${Math.round(F)}ms (want ≤ 34ms, 30 a second): something re-renders an expensive effect on every frame`);
}

// (s2) hover: separate arrivals onto spaces, shop cards, keyword tips, seats and members; the better of two runs counts
{
  const centers = sel => page.$$eval(sel, els => els.filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.top > 0 && b.bottom < innerHeight; })
    .map(e => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }));
  const spaces = await centers('[data-slot] .base');
  const cards = await centers('.lt-shop [data-uid]');
  // a tip of its own (one inside a control shows its title): the chairs' turn words and "each round" lines
  const tips = await centers('[data-tip]:not(.fig)');
  // a rival's seat (its leader) and the members sitting in the seats
  const seats = await centers('[data-cult]:not([data-cult="0"]) .cs-leader');
  const members = await centers('.cs-member .fig');
  const targets = [...spaces.slice(0, 8).map(c => [...c, 'space']), ...cards.slice(0, 6).map(c => [...c, 'card']), ...tips.slice(0, 4).map(c => [...c, 'tip']),
    ...seats.slice(0, 3).map(c => [...c, 'seat']), ...members.slice(0, 3).map(c => [...c, 'member'])];
  // each arrival: away (the card closes), then onto the target, and wait for its card (up to 1.5s on a loaded box)
  const measure = async () => {
    const F = await idleFrame();
    await page.evaluate(() => { window.__snap.hov.lat = []; window.__snap.hov.t0 = null; });
    let n = 0;
    const misses = [], staged = [];
    for (const [x, y, kind] of targets) {
      await page.mouse.move(4, 696);
      const closed = await page.waitForFunction(() => !document.querySelector('[data-hover-layer][data-open="1"], .popover:not([data-hover-layer]):not([data-prep])'), null, { timeout: 1500 }).then(() => true, () => false);
      const stuck = closed ? '' : await page.evaluate(() => { const up = document.querySelector('[data-hover-layer][data-open="1"] [data-hover-card], .popover:not([data-hover-layer])'); return up ? ` (the last card never closed: ${up.dataset.hoverCard || up.className}${up.querySelector('[data-space-card]') ? ` ${up.querySelector('[data-space-card]').dataset.spaceCard}` : ''})` : ''; });
      await page.waitForTimeout(60);
      await page.evaluate(() => { window.__snap.hov.t0 = null; });
      const had = await page.evaluate(() => window.__snap.hov.lat.length);
      // one step, straight onto the target: a two-step move from the parking spot crossed a shop card first, whose card
      // opened before the pointer reached the target, so the arrival was never armed (5 of 18 "misses" on the quiet box)
      await page.mouse.move(x, y);
      const hit = await page.waitForFunction(h => window.__snap.hov.lat.length > h, had, { timeout: 1500 + HOVER_DELAY_MS }).then(() => true, () => false);
      // complete on its first paint: the same words at the same height 400ms on
      if (hit) {
        await page.waitForTimeout(400);
        const [a, b] = await page.evaluate(() => [window.__snap.hov.sig0, window.__snap.cardSig()]);
        if (a && b && a !== b) staged.push(`${kind} at ${Math.round(x)},${Math.round(y)}: opened as "${a.slice(0, 90).replace(/\s+/g, ' ')}", 400ms later "${b.slice(0, 90).replace(/\s+/g, ' ')}"`);
      }
      // a miss names what was under the pointer and whether a card was already up, so a flaky target can be found
      if (!hit) misses.push(`${kind} at ${Math.round(x)},${Math.round(y)}: ${await page.evaluate(([px, py]) => { const e = document.elementFromPoint(px, py); const t = e && e.closest('[data-slot], [data-uid], [data-tip]'); const up = document.querySelector('[data-hover-layer][data-open="1"]'); return `${e ? `${e.tagName.toLowerCase()}.${String(e.className && e.className.baseVal != null ? e.className.baseVal : e.className).split(' ').join('.')}` : 'nothing'}${t ? ` in ${t.getAttribute('data-slot') ? `slot ${t.getAttribute('data-slot')}` : t.getAttribute('data-uid') ? `card ${t.getAttribute('data-uid')}` : 'tip'}` : ' (no target)'}${up ? `, card up: ${(up.querySelector('[data-hover-card]') || {}).dataset?.hoverCard} ${(up.querySelector('[data-space-card]') || up.querySelector('[data-card-hover]') || { dataset: {} }).dataset.spaceCard || (up.querySelector('[data-card-hover]') || { dataset: {} }).dataset.cardHover || ''} at ${Math.round(up.getBoundingClientRect().left)},${Math.round(up.getBoundingClientRect().top)} opacity ${getComputedStyle(up).opacity}` : ''}, arrival ${window.__snap.hov.t0 == null ? 'never seen' : 'seen'}`; }, [x, y])}${stuck}`);
      n++;
    }
    const lat = (await page.evaluate(() => window.__snap.hov.lat)).sort((a, b) => a - b);
    return { n, F, lat, misses, staged, p95: lat.length ? lat[Math.min(lat.length - 1, Math.floor(lat.length * 0.95))] : Infinity };
  };
  let run = await measure();
  const first = run;
  if (!(run.p95 <= LIMIT.hover + run.F) || run.staged.length) { const again = await measure(); if (again.p95 - again.F < run.p95 - run.F || again.staged.length < run.staged.length) run = again; }
  report.push(`hover: p95 ${Math.round(run.p95)}ms from the end of the ${HOVER_DELAY_MS}ms delay over ${run.lat.length}/${run.n} arrivals, box frame ${Math.round(run.F)}ms, ${run.staged.length} filled in after opening (${spaces.length} spaces, ${cards.length} cards, ${tips.length} tips, ${seats.length} seats, ${members.length} members on screen)${first !== run ? `; first run p95 ${Math.round(first.p95)}ms` : ''}`);
  if (run.misses.length) report.push(`hover misses: ${run.misses.join('; ')}`);
  if (run.lat.length < run.n - 2) errors.push(`(s2) only ${run.lat.length} of ${run.n} hover arrivals opened a card within 1.5s of the delay (missed: ${run.misses.join('; ')})`);
  if (run.staged.length) errors.push(`(s2) ${run.staged.length} hover card(s) filled in after they opened (want each whole on its first paint): ${run.staged.join('; ')}`);
  if (!(run.p95 <= LIMIT.hover + run.F)) errors.push(`(s2) hover cards open in p95 ${Math.round(run.p95)}ms after the ${HOVER_DELAY_MS}ms delay (want ≤ ${LIMIT.hover}ms + one ${Math.round(run.F)}ms frame; samples ${run.lat.map(Math.round).join(',')})`);
  // a quick sweep: the pointer crosses several spaces, resting on none as long as the delay, then leaves the board; no
  // card may open (Cory, 2026-10-15: no nonstop hovers as a mouse moves across the screen). A sweep the box itself
  // slowed (a step longer than the delay, timed in the page) proves nothing, so it's tried again
  const sweepOn = spaces.slice(0, 6);
  let swept = null;
  for (let k = 0; k < 3 && sweepOn.length >= 3; k++) {
    await page.mouse.move(4, 696);
    await page.waitForFunction(() => !window.__snap.hoverUp(), null, { timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.__snap.sweep = { at: [], opened: null }; });
    for (const [x, y] of sweepOn) { await page.mouse.move(x, y); await page.waitForTimeout(Math.round(HOVER_DELAY_MS / 4)); }
    await page.mouse.move(4, 696);
    const t = await page.evaluate(() => performance.now());
    await page.waitForTimeout(HOVER_DELAY_MS + 300);
    const sw = await page.evaluate(t1 => { const s = window.__snap.sweep; window.__snap.sweep = null; const at = [...s.at, t1]; return { opened: s.opened, step: Math.max(...at.slice(1).map((v, i) => v - at[i])), n: s.at.length }; }, t);
    swept = sw;
    if (sw.step < HOVER_DELAY_MS - 20) break;
  }
  if (swept) {
    report.push(`sweep across ${sweepOn.length} spaces: longest step ${Math.round(swept.step)}ms, ${swept.opened ? `a card opened ("${swept.opened.slice(0, 60).replace(/\s+/g, ' ')}")` : 'no card opened'}`);
    if (swept.opened && swept.step < HOVER_DELAY_MS - 20) errors.push(`(s2) a quick sweep across ${sweepOn.length} spaces (each step under ${Math.round(swept.step)}ms, the delay is ${HOVER_DELAY_MS}ms) opened a card: "${swept.opened.slice(0, 80).replace(/\s+/g, ' ')}"`);
    if (swept.step >= HOVER_DELAY_MS - 20) report.push(`sweep: the box never managed a step under ${HOVER_DELAY_MS - 20}ms in 3 tries, not judged`);
  } else errors.push('(s2) no sweep across the spaces could be made (fewer than 3 spaces on screen)');
  await page.mouse.move(4, 696);
  await page.waitForTimeout(300);
}

// (s3) click a lit space: your minion stands on it within 100ms. Undo between tries; the best of three counts.
{
  const tries = [];
  for (let k = 0; k < 3; k++) {
    const slots = await page.$$('.slot.can .base');
    const slot = slots[k % Math.max(1, slots.length)];
    if (!slot) break;
    const bb = await slot.boundingBox();
    const F = await idleFrame();
    await page.evaluate(() => { window.__snap.minion = { armed: true }; window.__snap.press = null; });
    await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForFunction(() => window.__snap.minion && window.__snap.minion.t1 != null, null, { timeout: 2000 }).catch(() => {});
    const m = await page.evaluate(() => ({ ...window.__snap.minion, press: window.__snap.press }));
    if (m && m.t0 != null) tries.push({ ms: m.t1 == null ? Infinity : m.t1 - m.t0, gap: await longestGap(m.t0, m.t1 ?? m.t0 + 2000), F, press: m.press });
    if (k === 0) await page.screenshot({ path: `${SHOTS}/after-place.png` });
    if (tries.length && tries[tries.length - 1].ms <= LIMIT.minion + F) break;
    // take it back (a space may have asked a question first: Undo is there either way) and try another space
    const undo = await page.waitForSelector('.btn.undo', { timeout: 3000 }).catch(() => null);
    if (!undo) break;
    await undo.click();
    await page.waitForSelector('.slot.can .base', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
  const best = tries.slice().sort((a, b) => (a.ms - a.F) - (b.ms - b.F))[0];
  report.push(`minion: ${tries.map(t => `${Number.isFinite(t.ms) ? Math.round(t.ms) : 'never'}ms (press ${t.press == null ? '?' : Math.round(t.press)}ms, longest frame ${Math.round(t.gap)}ms, box frame ${Math.round(t.F)}ms)`).join('; ')}`);
  // (s7) the press itself: the frame after the pointer goes down, within 100ms (no frame allowance: s6 holds frames at
  // 30 a second or better)
  const presses = tries.map(t => t.press).filter(x => x != null);
  if (!presses.length) errors.push('(s7) no press on a lit space was timed');
  else if (Math.min(...presses) > 100) errors.push(`(s7) a press on a lit space reached the screen ${Math.round(Math.min(...presses))}ms after the pointer went down (want ≤ 100ms)`);
  if (!best) errors.push('(s3) could not click a lit space');
  else if (!(best.ms <= LIMIT.minion + best.F)) errors.push(`(s3) your minion showed on the space ${Number.isFinite(best.ms) ? `${Math.round(best.ms)}ms` : 'never (2s+)'} after the click (want ≤ ${LIMIT.minion}ms + one ${Math.round(best.F)}ms frame)`);
}

// (s4) the animation speed setting changes how long a move's chain plays: the same placement at Quick and at Relaxed
// (?speed= in the address, the menu's setting for that page). Compared on the chain's own schedule (director.js
// publishes each chain's planned length), so a loaded box can't blur it; the wall time is reported beside it.
// (s5) the gap between your turns at Steady, bots at Normal: from your pass to your next placement, under 8s
// (Cory's pacing: a rival's whole turn about 1.5–2s). The better of two gaps in round I counts.
// The first page is done with by now: closed, so a game still live in it can never write over the save a fresh page
// resumes (one browser context shares one save; the older tab yields to the newer one only once that one is up).
let mainOpen = true;
async function freshPage(query) {
  if (mainOpen) { mainOpen = false; await page.close().catch(() => {}); }
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await seedSave(pg, richSave()); // before the app runs (lib/seed.mjs)
  await pg.goto(`${base}/?intro=0&${query}`);
  const r = await pg.waitForSelector('[data-home="resume"]', { timeout: 15000 }).catch(() => null);
  if (!r) { await pg.close(); return null; }
  await r.click();
  // a resumed game that never offers your placement is reported with what the screen showed (it threw, and the whole
  // gate died with a bare TimeoutError: 2026-10-15, twice, then not again in five runs)
  if (!(await pg.waitForSelector('.lt[data-phase="place"][data-yours="1"] .slot.can .base', { timeout: 15000 }).catch(() => null))) {
    const at = await pg.evaluate(() => { const l = document.querySelector('.lt'); return l ? `phase ${l.dataset.phase}, yours ${l.dataset.yours}` : (document.body.innerText || '').slice(0, 80); }).catch(() => '?');
    errors.push(`(${query}) the resumed game never offered your placement within 15s (${at})`);
    await pg.screenshot({ path: `${SHOTS}/fresh-${query.replace(/\W+/g, '-')}.png` }).catch(() => {});
    await pg.close();
    return null;
  }
  await pg.evaluate(() => {
    window.__chainSeen = [];
    const app = document.querySelector('.app.game');
    let on = null;
    new MutationObserver(() => { if (app.dataset.chain && on == null) on = performance.now(); if (!app.dataset.chain && on != null) { window.__chainSeen.push(performance.now() - on); on = null; } }).observe(app, { attributes: true, attributeFilter: ['data-chain'] });
  });
  return pg;
}
// a plain gain space (no question asked), so both speeds play the same chain
const plainSpace = pg => pg.evaluateHandle(() => [...document.querySelectorAll('.slot.can')].find(e => /: \+\d+ \w+\.( Open)/.test(e.getAttribute('aria-label') || '')) || document.querySelector('.slot.can'));
{
  const lengths = {};
  for (const sp of ['quick', 'relaxed']) {
    const pg = await freshPage(`speed=${sp}`);
    if (!pg) { errors.push(`(s4) could not resume at ${sp}`); continue; }
    const el = (await plainSpace(pg)).asElement();
    await (await el.$('.base')).click();
    await pg.waitForFunction(() => window.__patronsChainMs > 0, null, { timeout: 5000 }).catch(() => {});
    await pg.waitForTimeout(2500);
    lengths[sp] = { planned: await pg.evaluate(() => window.__patronsChainMs || 0), seen: await pg.evaluate(() => window.__chainSeen[0] || 0) };
    await pg.close();
  }
  report.push(`speed: a placement's chain plans ${Math.round(lengths.quick?.planned || 0)}ms at Quick, ${Math.round(lengths.relaxed?.planned || 0)}ms at Relaxed (on screen ${Math.round(lengths.quick?.seen || 0)}ms / ${Math.round(lengths.relaxed?.seen || 0)}ms)`);
  if (!(lengths.quick && lengths.relaxed && lengths.quick.planned > 0)) errors.push('(s4) a placement played no chain');
  else if (!(lengths.relaxed.planned >= lengths.quick.planned * 1.8)) errors.push(`(s4) the speed setting barely changes the chain (Quick ${lengths.quick.planned}ms, Relaxed ${lengths.relaxed.planned}ms; want Relaxed ≥ 1.8 × Quick)`);
}
{
  const pg = await freshPage('speed=steady');
  const gaps = [];
  if (pg) {
    for (let turn = 0; turn < 3 && gaps.length < 2; turn++) {
      const el = (await plainSpace(pg)).asElement();
      if (!el) break;
      await (await el.$('.base')).click();
      // answer any question with its first choice, then pass
      for (let k = 0; k < 20; k++) {
        const passBtn = await pg.$('.lt[data-phase="buy"][data-yours="1"] [data-option="pass"]');
        if (passBtn) { await passBtn.click().catch(() => {}); break; }
        const opt = await pg.$('.prompt.choice button[data-option]:not([disabled])');
        if (opt) await opt.click().catch(() => {});
        await pg.waitForTimeout(200);
      }
      const t0 = await pg.evaluate(() => ({ t: performance.now(), dwell: window.__patronsDwellSum || 0, moves: Number(document.querySelector('.app.game').dataset.moves) }));
      const ok = await pg.waitForSelector('.lt[data-phase="place"][data-yours="1"] .slot.can .base', { timeout: 40000 }).catch(() => null);
      if (!ok) break;
      const g = await pg.evaluate(a => ({ wall: performance.now() - a.t, planned: (window.__patronsDwellSum || 0) - a.dwell, steps: Number(document.querySelector('.app.game').dataset.moves) - a.moves }), t0);
      // a snake turnaround (you go again at once) isn't a gap between turns: count only gaps with rivals' turns in them
      if (g.steps >= 4) gaps.push(g);
    }
    await pg.close();
  }
  // frame-honest: the table's own schedule (each step's hold, director.js chains and the bot pace) is what Cults
  // controls; the wall time beside it adds whatever the box spent drawing
  report.push(`turns: gap between your turns at Steady, scheduled ${gaps.map(g => `${(g.planned / 1000).toFixed(1)}s (wall ${(g.wall / 1000).toFixed(1)}s, ${g.steps} steps)`).join(', ') || 'not measured'}`);
  if (!gaps.length) errors.push('(s5) could not measure the gap between your turns');
  // the grammar's H2: a usual gap (three rivals' turns) ≤ 8s here (6.5s p50 on a quiet box); the snake's long gap
  // (up to six rival turns in a row, many more steps) ≤ 13s. Those were set on the first Steady table; Cory's morning
  // note ("too fast even on Relaxed") made Steady ×1.2 of it (src/v4/motion.js SPEEDS), so both stretch by the same.
  else {
    const usual = gaps.filter(g => g.steps <= 12), long = gaps.filter(g => g.steps > 12);
    const U = Math.round(8000 * SPEEDS.steady), L = Math.round(13000 * SPEEDS.steady);
    if (usual.length && Math.min(...usual.map(g => g.planned)) > U) errors.push(`(s5) your next turn is scheduled ${(Math.min(...usual.map(g => g.planned)) / 1000).toFixed(1)}s after your last (want ≤ ${U / 1000}s at Steady)`);
    if (long.length && Math.min(...long.map(g => g.planned)) > L) errors.push(`(s5) the snake's long gap is scheduled ${(Math.min(...long.map(g => g.planned)) / 1000).toFixed(1)}s (want ≤ ${L / 1000}s at Steady)`);
  }
}

for (const line of report) console.log(`snappy: ${line}`);
await browser.close();
if (server) server.kill();
if (errors.length) console.error(errors.join('\n'));
console.log(errors.length ? 'FAIL snappy' : 'PASS snappy');
process.exit(errors.length ? 1 : 0);
