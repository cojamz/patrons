import { browserPath, launchBrowser } from '../e2e/v4/lib/browser.mjs';
// Wheel spin while the table is busy (Cory, 2026-10-25: "it's when other animations are happening… I want a super snappy
// spinning wheel even if other things are going on"). A local game, you and three Normal bots at Steady, 1270×700, CPU
// throttled (default 4×). On rivals' turns (their flights, the story, the shop sliding) it presses an arrow key every
// ~700ms and times, in the page: the key's wait for the main thread (event → handler), the handler to the spin's first
// compositor frame, and the key to the landing (the spin's last frame). Frames come from the compositor (CDP screencast),
// so a spin that runs while the main thread is stuck still counts as moving.
//   node scripts/v4-spin-busy.mjs <url> [--cpu=4] [--dpr=1] [--spins=12] [--drag] [--shots=<dir>]
// --drag: mouse drags of a quarter turn instead of keys (pointer-to-rest time, each move's wait for the main thread).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const base = argv.find(a => !a.startsWith('--')) || 'http://localhost:5291';
const DRAG = argv.includes('--drag');
const CPU = Number(flag('cpu', 4)), SPINS = Number(flag('spins', 12)), SHOTS = flag('shots', '');
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await launchBrowser({ executablePath: browserPath });
const DPR = Number(flag('dpr', 1));
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 }, deviceScaleFactor: DPR });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await page.addInitScript(() => {
  const W = window.__spin = { runs: [], long: [] };
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) W.long.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch { /* none */ }
  // every spin's animations (a key's, a drag's hand-off, a drag's settle on release): when they start and end
  const had = Element.prototype.animate;
  Element.prototype.animate = function (...a) { const an = had.apply(this, a); if (this.matches && this.matches('.stage > .turn-layer') && W.drag) { const d = W.drag; queueMicrotask(() => { d.spins.push([an.startTime ?? performance.now(), an.effect.getComputedTiming().duration]); }); } return an; };
  addEventListener('pointerup', e => { if (W.drag) W.drag.up = [e.timeStamp, performance.now()]; }, true);
  addEventListener('pointermove', e => { if (W.drag && e.buttons) W.drag.moves.push([e.timeStamp, performance.now()]); }, true);
  addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const r = { ev: e.timeStamp, handler: performance.now() };
    W.runs.push(r);
    // after the wheel's own listener (added later, same target, bubble): its spin's animations exist now
    setTimeout(() => {
      const layer = document.querySelector('.stage > .turn-layer');
      const an = layer && layer.getAnimations()[0];
      r.started = performance.now();
      if (!an) { r.none = true; return; }
      r.animStart = an.startTime; r.dur = an.effect.getComputedTiming().duration;
      an.finished.then(() => { r.landedMain = performance.now(); }, () => { r.cancelled = performance.now(); });
    }, 0);
  });
});
await page.goto(`${base}/?intro=0`);
await page.click('[data-home="local"]');
await page.click('[data-start]');
const frames = [];
cdp.on('Page.screencastFrame', async f => { frames.push(f.metadata.timestamp * 1000); if (SHOTS) frames.push(null); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); if (SHOTS && f.data) shotQ.push([f.metadata.timestamp * 1000, f.data]); });
const shotQ = [];
let spins = 0, guard = 0;
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, everyNthFrame: 1 });
const clock0 = await page.evaluate(() => [performance.now(), performance.timeOrigin]);
while (spins < SPINS && guard++ < 400) {
  // your turn: a starting choice or a lit space; place and pass the buy
  const opt = await page.$('.prompt.choice button[data-option]:not([disabled])');
  if (opt) { await opt.click().catch(() => {}); await sleep(300); continue; }
  const lit = await page.$('.slot.can .base');
  if (lit) { await lit.click({ force: true }).catch(() => {}); await sleep(500); const done = await page.$('[data-done], button[data-pass]'); if (done) await done.click().catch(() => {}); await sleep(200); continue; }
  const any = await page.$('.prompt button:not([disabled])');
  const busy = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && !(a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.stage'))).length);
  if (busy > 0) {
    if (DRAG) {
      // a drag on the ring: down near the left edge, a quarter turn over ~250ms (16 moves), up
      const b = await page.$eval('.stage', e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width / 2]; });
      const [cx, cy, R] = b, rr = R * 0.8, a0 = Math.PI * (spins % 2 ? 1.1 : 0.9);
      await page.evaluate(() => { const W = window.__spin; W.drag = { t0: performance.now(), moves: [], spins: [] }; (W.drags = W.drags || []).push(W.drag); });
      await page.mouse.move(cx + rr * Math.cos(a0), cy + rr * Math.sin(a0));
      await page.mouse.down();
      for (let k = 1; k <= 16; k++) { const a = a0 + (spins % 2 ? -1 : 1) * (Math.PI / 2) * k / 16; await page.mouse.move(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); await sleep(16); }
      await page.mouse.up();
      spins++; await sleep(900); continue;
    }
    await page.keyboard.press(spins % 2 ? 'ArrowLeft' : 'ArrowRight'); spins++; await sleep(700); continue;
  }
  if (any) { await any.click().catch(() => {}); await sleep(300); continue; }
  await sleep(150);
}
await sleep(800);
await cdp.send('Page.stopScreencast');
const { runs, long, origin, drags } = await page.evaluate(() => ({ ...window.__spin, origin: performance.timeOrigin }));
const fr = frames.filter(x => x != null).map(t => t - origin).sort((a, b) => a - b);
const rows = runs.filter(r => !r.none && r.animStart != null).map(r => {
  const end = r.animStart + r.dur;
  const inSpin = fr.filter(t => t >= r.ev && t <= end + 50);
  const first = fr.find(t => t >= r.animStart) ?? null;
  const gaps = inSpin.slice(1).map((t, i) => t - inSpin[i]);
  const lt = long.filter(([s, d]) => s < end && s + d > r.ev).map(([, d]) => Math.round(d));
  return { wait: Math.round(r.handler - r.ev), toFirst: first == null ? null : Math.round(first - r.ev), land: Math.round(end - r.ev), landedMain: r.landedMain ? Math.round(r.landedMain - r.ev) : null, frames: inSpin.length, maxGap: gaps.length ? Math.round(Math.max(...gaps)) : null, long: lt };
});
const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const out = { cpu: CPU, n: rows.length, median: { wait: med(rows.map(r => r.wait)), toFirst: med(rows.map(r => r.toFirst)), land: med(rows.map(r => r.land)), maxGap: med(rows.map(r => r.maxGap)) }, worst: { toFirst: Math.max(...rows.map(r => r.toFirst ?? 0)), land: Math.max(...rows.map(r => r.land)) }, rows };
if (DRAG) out.drags = (drags || []).map(d => {
  const w = d.moves.map(([ts, h]) => h - ts), a = d.moves.length ? d.moves[0][0] : d.t0, z = d.moves.length ? d.moves[d.moves.length - 1][1] : d.t0;
  const inD = fr.filter(t => t >= a && t <= z), gaps = inD.slice(1).map((t, i) => t - inD[i]);
  const rest = d.spins.length ? Math.max(...d.spins.map(([s0, du]) => s0 + du)) : null;
  return { toRest: rest == null ? null : Math.round(rest - a), upWait: d.up ? Math.round(d.up[1] - d.up[0]) : null, spins: d.spins.length, moves: d.moves.length, waitMed: med(w) && Math.round(med(w)), waitMax: Math.round(Math.max(0, ...w)), span: Math.round(z - a), frames: inD.length, maxGap: gaps.length ? Math.round(Math.max(...gaps)) : null, long: long.filter(([s0, du]) => s0 < z && s0 + du > a).map(([, du]) => Math.round(du)) };
});
out.allLong = long.map(([s, d]) => Math.round(d)).sort((a, b) => b - a).slice(0, 25); out.span = Math.round(fr[fr.length - 1] - fr[0]);
console.log(JSON.stringify(out, null, 1));
if (SHOTS && DRAG && drags && drags.length) {
  // the median drag's frames, from its first move until 400ms after the wheel came to rest
  const ds = drags.map(d => [d, d.moves.length ? d.moves[0][0] : d.t0]);
  const [d, a] = ds[Math.floor(ds.length / 2)];
  const rest = d.spins.length ? Math.max(...d.spins.map(([s0, du]) => s0 + du)) : (d.up ? d.up[1] : a + 1000);
  let k = 0;
  for (const [t, data] of shotQ) { const at = t - origin; if (at >= a - 20 && at <= rest + 400) writeFileSync(`${SHOTS}/${String(k++).padStart(2, '0')}-${Math.round(at - a)}ms.jpg`, Buffer.from(data, 'base64')); }
  writeFileSync(`${SHOTS}/result.json`, JSON.stringify(out, null, 1));
} else if (SHOTS) {
  // the worst spin's frames, key to landing
  const w = rows.slice().sort((a, b) => b.land - a.land)[0];
  const r = runs.filter(x => !x.none && x.animStart != null)[rows.indexOf(w)];
  let k = 0;
  for (const [t, data] of shotQ) { const at = t - origin; if (at >= r.ev - 20 && at <= r.ev + w.land + 120) writeFileSync(`${SHOTS}/${String(k++).padStart(2, '0')}-${Math.round(at - r.ev)}ms.jpg`, Buffer.from(data, 'base64')); }
  writeFileSync(`${SHOTS}/result.json`, JSON.stringify(out, null, 1));
}
await browser.close();
