// E2E snappy gate (Cory, 2026-10-15: "it just doesn't feel snappy", "the wheel spins really slow"). Laptop, 1270×700.
//  (s1) a wheel spin (an arrow key) starts within 100ms and has landed within 400ms;
//  (s2) a hover card opens within 100ms of the pointer arriving: wheel spaces, shop cards and keyword tips;
//  (s3) a click on a lit space shows your minion standing on it (painted, opacity ≥ .5) within 150ms;
//  (s4) the animation speed setting changes a chain's length (Relaxed ≥ 1.8 × Quick);
//  (s5) the gap between your turns at Steady (bots at Normal) is under 8s.
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
  // each arrival starts with no card up (the loop waits for that), so the arrival arms on the target alone: under load
  // the target's own card was sometimes already up when this listener ran, and a "no card up" check never armed it
  addEventListener('pointerover', e => {
    if (e.target.closest && e.target.closest('[data-slot], [data-uid], [data-tip]') && W.hov.t0 == null) W.hov.t0 = performance.now();
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

// (s2) hover: separate arrivals onto spaces, shop cards and keyword tips; the better of two runs counts
{
  const centers = sel => page.$$eval(sel, els => els.filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.top > 0 && b.bottom < innerHeight; })
    .map(e => { const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }));
  const spaces = await centers('[data-slot] .base');
  const cards = await centers('.lt-shop [data-uid]');
  const tips = await centers('.lt [data-tip][role="button"]'); // a tip of its own (one inside a control shows its title)
  const targets = [...spaces.slice(0, 8).map(c => [...c, 'space']), ...cards.slice(0, 6).map(c => [...c, 'card']), ...tips.slice(0, 4).map(c => [...c, 'tip'])];
  // each arrival: away (the card closes), then onto the target, and wait for its card (up to 1.5s on a loaded box)
  const measure = async () => {
    const F = await idleFrame();
    await page.evaluate(() => { window.__snap.hov.lat = []; window.__snap.hov.t0 = null; });
    let n = 0;
    const misses = [];
    for (const [x, y, kind] of targets) {
      await page.mouse.move(4, 696);
      const closed = await page.waitForFunction(() => !document.querySelector('[data-hover-layer][data-open="1"], .popover:not([data-hover-layer])'), null, { timeout: 1500 }).then(() => true, () => false);
      const stuck = closed ? '' : await page.evaluate(() => { const up = document.querySelector('[data-hover-layer][data-open="1"] [data-hover-card], .popover:not([data-hover-layer])'); return up ? ` (the last card never closed: ${up.dataset.hoverCard || up.className}${up.querySelector('[data-space-card]') ? ` ${up.querySelector('[data-space-card]').dataset.spaceCard}` : ''})` : ''; });
      await page.waitForTimeout(60);
      await page.evaluate(() => { window.__snap.hov.t0 = null; });
      const had = await page.evaluate(() => window.__snap.hov.lat.length);
      // one step, straight onto the target: a two-step move from the parking spot crossed a shop card first, whose card
      // opened before the pointer reached the target, so the arrival was never armed (5 of 18 "misses" on the quiet box)
      await page.mouse.move(x, y);
      const hit = await page.waitForFunction(h => window.__snap.hov.lat.length > h, had, { timeout: 1500 }).then(() => true, () => false);
      // a miss names what was under the pointer and whether a card was already up, so a flaky target can be found
      if (!hit) misses.push(`${kind} at ${Math.round(x)},${Math.round(y)}: ${await page.evaluate(([px, py]) => { const e = document.elementFromPoint(px, py); const t = e && e.closest('[data-slot], [data-uid], [data-tip]'); const up = document.querySelector('[data-hover-layer][data-open="1"]'); return `${e ? `${e.tagName.toLowerCase()}.${String(e.className && e.className.baseVal != null ? e.className.baseVal : e.className).split(' ').join('.')}` : 'nothing'}${t ? ` in ${t.getAttribute('data-slot') ? `slot ${t.getAttribute('data-slot')}` : t.getAttribute('data-uid') ? `card ${t.getAttribute('data-uid')}` : 'tip'}` : ' (no target)'}${up ? `, card up: ${(up.querySelector('[data-hover-card]') || {}).dataset?.hoverCard} ${(up.querySelector('[data-space-card]') || up.querySelector('[data-card-hover]') || { dataset: {} }).dataset.spaceCard || (up.querySelector('[data-card-hover]') || { dataset: {} }).dataset.cardHover || ''} at ${Math.round(up.getBoundingClientRect().left)},${Math.round(up.getBoundingClientRect().top)} opacity ${getComputedStyle(up).opacity}` : ''}, arrival ${window.__snap.hov.t0 == null ? 'never seen' : 'seen'}`; }, [x, y])}${stuck}`);
      n++;
    }
    const lat = (await page.evaluate(() => window.__snap.hov.lat)).sort((a, b) => a - b);
    return { n, F, lat, misses, p95: lat.length ? lat[Math.min(lat.length - 1, Math.floor(lat.length * 0.95))] : Infinity };
  };
  let run = await measure();
  const first = run;
  if (!(run.p95 <= LIMIT.hover + run.F)) { const again = await measure(); if (again.p95 - again.F < run.p95 - run.F) run = again; }
  report.push(`hover: p95 ${Math.round(run.p95)}ms over ${run.lat.length}/${run.n} arrivals, box frame ${Math.round(run.F)}ms (${spaces.length} spaces, ${cards.length} cards, ${tips.length} tips on screen)${first !== run ? `; first run p95 ${Math.round(first.p95)}ms` : ''}`);
  if (run.misses.length) report.push(`hover misses: ${run.misses.join('; ')}`);
  if (run.lat.length < run.n - 2) errors.push(`(s2) only ${run.lat.length} of ${run.n} hover arrivals opened a card within 1.5s (missed: ${run.misses.join('; ')})`);
  if (!(run.p95 <= LIMIT.hover + run.F)) errors.push(`(s2) hover cards open in p95 ${Math.round(run.p95)}ms (want ≤ ${LIMIT.hover}ms + one ${Math.round(run.F)}ms frame; samples ${run.lat.map(Math.round).join(',')})`);
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
    const F = await idleFrame();
    await page.evaluate(() => { window.__snap.minion = { armed: true }; });
    await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForFunction(() => window.__snap.minion && window.__snap.minion.t1 != null, null, { timeout: 2000 }).catch(() => {});
    const m = await page.evaluate(() => window.__snap.minion);
    if (m && m.t0 != null) tries.push({ ms: m.t1 == null ? Infinity : m.t1 - m.t0, gap: await longestGap(m.t0, m.t1 ?? m.t0 + 2000), F });
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
  report.push(`minion: ${tries.map(t => `${Number.isFinite(t.ms) ? Math.round(t.ms) : 'never'}ms (longest frame ${Math.round(t.gap)}ms, box frame ${Math.round(t.F)}ms)`).join('; ')}`);
  if (!best) errors.push('(s3) could not click a lit space');
  else if (!(best.ms <= LIMIT.minion + best.F)) errors.push(`(s3) your minion showed on the space ${Number.isFinite(best.ms) ? `${Math.round(best.ms)}ms` : 'never (2s+)'} after the click (want ≤ ${LIMIT.minion}ms + one ${Math.round(best.F)}ms frame)`);
}

// (s4) the animation speed setting changes how long a move's chain plays: the same placement at Quick and at Relaxed
// (?speed= in the address, the menu's setting for that page). Compared on the chain's own schedule (director.js
// publishes each chain's planned length), so a loaded box can't blur it; the wall time is reported beside it.
// (s5) the gap between your turns at Steady, bots at Normal: from your pass to your next placement, under 8s
// (Cory's pacing: a rival's whole turn about 1.5–2s). The better of two gaps in round I counts.
async function freshPage(query) {
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  await pg.goto(`${base}/?intro=0&${query}`);
  await pg.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), richSave());
  await pg.reload();
  const r = await pg.waitForSelector('[data-home="resume"]', { timeout: 15000 }).catch(() => null);
  if (!r) { await pg.close(); return null; }
  await r.click();
  await pg.waitForSelector('.lt[data-phase="place"][data-yours="1"] .slot.can .base', { timeout: 15000 });
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
    for (let turn = 0; turn < 3 && gaps.length < 1; turn++) {
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
  else if (Math.min(...gaps.map(g => g.planned)) > 8000) errors.push(`(s5) your next turn is scheduled ${(Math.min(...gaps.map(g => g.planned)) / 1000).toFixed(1)}s after your last (want ≤ 8s at Steady)`);
}

for (const line of report) console.log(`snappy: ${line}`);
await browser.close();
if (server) server.kill();
if (errors.length) console.error(errors.join('\n'));
console.log(errors.length ? 'FAIL snappy' : 'PASS snappy');
process.exit(errors.length ? 1 : 0);
