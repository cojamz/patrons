// Real-time pacing and smoothness of the table, on a production build (never the dev server).
//   node design/eval/morning-fixes/motion/pace.mjs <url> <speed> <out.json> [--cpu=1] [--secs=70] [--seed=7]
// Chromium at 1270×700. One person (plays the first open space, passes every buy) and three Normal bots, at the given
// animation speed (?speed=). Math.random is seeded in the page, so the same seed deals the same game.
// Records:
//  - every step the table shows (data-moves on .app.game), so a rival's whole turn is measured as grammar H3 does it:
//    from their placement showing to the next placement showing (bot → bot only: your own clicks skip chains);
//  - every requestAnimationFrame interval, split by whether a chain is playing (.app.game[data-chain]);
//  - long animation frames (LoAF) with their top scripts, and CDP layout / style-recalc counts and times.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const pos = argv.filter(a => !a.startsWith('--'));
const flag = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const [base, speed = 'steady', out = '/dev/stdout'] = pos;
const CPU = Number(flag('cpu', 1)), SECS = Number(flag('secs', 70)), SEED = Number(flag('seed', 7));

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1270, height: 700 } });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await cdp.send('Performance.enable');
await p.addInitScript(seed => {
  let s = seed >>> 0;
  Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  window.__steps = []; window.__frames = []; window.__loaf = [];
  let last = null;
  const frame = now => {
    const el = document.querySelector('.app.game');
    if (last != null && el) window.__frames.push({ t: now, dt: now - last, chain: !!el.dataset.chain });
    last = now;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  try {
    new PerformanceObserver(l => { for (const e of l.getEntries()) window.__loaf.push({ t: e.startTime, d: e.duration, block: e.blockingDuration, render: e.renderStart ? e.startTime + e.duration - e.renderStart : 0, style: e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0, scripts: (e.scripts || []).slice(0, 3).map(s => ({ d: Math.round(s.duration), src: `${s.invoker || ''} ${s.sourceFunctionName || ''} ${(s.sourceURL || '').split('/').pop()}:${s.sourceCharPosition}` })) }); }).observe({ type: 'long-animation-frame', buffered: true });
  } catch { /* no LoAF */ }
  const watch = () => {
    const el = document.querySelector('.app.game');
    if (!el) { requestAnimationFrame(watch); return; }
    const read = () => ({ moves: el.dataset.moves, bot: el.dataset.bot, actor: el.dataset.actor, phase: el.dataset.phase, round: el.dataset.round });
    let prev = read();
    new MutationObserver(() => {
      const now = read();
      if (now.moves !== prev.moves) window.__steps.push({ t: performance.now(), byBot: prev.bot === '1', by: prev.actor, kind: prev.phase, round: prev.round, roundNow: now.round, modal: !!document.querySelector('.roundend, [data-next-round]') });
      prev = now;
    }).observe(el, { attributes: true, attributeFilter: ['data-moves'] });
  };
  addEventListener('DOMContentLoaded', watch);
}, SEED);

await p.goto(`${base}/?intro=0&speed=${speed}`);
await p.click('[data-home="local"]');
await p.click('[data-start]');
await p.waitForSelector('.lt-seat[data-pid]');
const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const t0 = Date.now();
let rounds = 0;
// the driver stays off the page's main thread between your turns: one cheap read per poll (Playwright's selector
// engine, polled with several queries, was 5% of the page's script time in the first profile)
const look = () => p.evaluate(() => { const g = document.querySelector('.app.game'); return document.querySelector('[data-next-round]') ? 'next' : g && g.dataset.yours === '1' ? g.dataset.phase || '?' : ''; }).catch(() => '');
while (Date.now() - t0 < SECS * 1000) {
  const ph = await look();
  if (ph === 'next') { if (++rounds > 2) break; await p.click('[data-next-round]').catch(() => {}); await p.waitForTimeout(300); continue; }
  if (ph) {
    let el = null;
    if (ph === 'buy') el = await p.$('[data-option="pass"]:not([disabled])');
    else if (ph === 'place') el = await p.$('.slot.can .base');
    if (!el) el = await p.$('.prompt [data-option]:not([disabled]), [data-option^="color:"]:not([disabled]), .dialog [data-option]:not([disabled])');
    if (!el) { const all = await p.$$('[data-option]:not([disabled])'); for (const e of all) { const id = await e.getAttribute('data-option').catch(() => ''); if (id && !id.startsWith('toggle') && id !== 'back' && !id.startsWith('tier:')) { el = e; break; } } }
    if (el) { await el.click({ timeout: 1000 }).catch(() => {}); const conf = await p.$('[data-place]'); if (conf) await conf.click().catch(() => {}); }
  }
  await p.waitForTimeout(150);
}
const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const data = await p.evaluate(() => ({ steps: window.__steps, frames: window.__frames, loaf: window.__loaf }));
await b.close();

// a rival's whole turn: their placement shows → the next placement shows (bot → bot, same round, no round card)
const st = data.steps;
const turns = [];
for (let i = 0; i < st.length; i++) {
  if (st[i].kind !== 'place' || !st[i].byBot || st[i].modal) continue;
  let j = i + 1;
  while (j < st.length && st[j].kind !== 'place') j++;
  if (j >= st.length || !st[j].byBot || st[j].round !== st[i].round || st[j].modal || st.slice(i, j + 1).some(x => x.roundNow !== st[i].round)) continue;
  turns.push(Math.round(st[j].t - st[i].t));
}
const q = (a, k) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(k * s.length))] * 10) / 10; };
const fr = data.frames.filter(f => f.chain), dts = fr.map(f => f.dt);
const res = {
  speed, cpu: CPU, secs: SECS, seed: SEED,
  rivalTurns: { n: turns.length, p50: q(turns, 0.5), p95: q(turns, 0.95), all: turns },
  chainFrames: { n: dts.length, p50: q(dts, 0.5), p95: q(dts, 0.95), p99: q(dts, 0.99), max: q(dts, 1), over25: dts.filter(d => d > 25).length, over50: dts.filter(d => d > 50).length, droppedPct: dts.length ? Math.round(1000 * dts.filter(d => d > 25).length / dts.length) / 10 : null },
  allFrames: { n: data.frames.length, over25: data.frames.filter(f => f.dt > 25).length, over50: data.frames.filter(f => f.dt > 50).length },
  cdp: Object.fromEntries(['LayoutCount', 'RecalcStyleCount', 'LayoutDuration', 'RecalcStyleDuration', 'ScriptDuration', 'TaskDuration'].map(k => [k, Math.round((m1[k] - m0[k]) * (k.endsWith('Duration') ? 1000 : 1))])),
  slow: data.frames.filter(f => f.dt > 25).map(f => [Math.round(f.t), Math.round(f.dt), f.chain ? 1 : 0]),
  stepTimes: st.map(x => [Math.round(x.t), x.by, x.kind]),
  loaf: { n: data.loaf.length, over100: data.loaf.filter(l => l.d > 100).length, top: [...data.loaf].sort((a, b2) => b2.d - a.d).slice(0, 8) },
};
writeFileSync(out, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ speed, cpu: CPU, rivalTurns: { n: res.rivalTurns.n, p50: res.rivalTurns.p50, p95: res.rivalTurns.p95 }, chainFrames: res.chainFrames, allFrames: res.allFrames, cdp: res.cdp, loaf: { n: res.loaf.n, over100: res.loaf.over100 } }));
