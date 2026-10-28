import { browserPath } from '../e2e/v4/lib/browser.mjs';
// The freeze probe: where the page stops answering in a real played game, the way a person feels it.
//   node scripts/v4-freeze.mjs <url> <label> [--cpu=4] [--speed=relaxed] [--seed=N] [--profile] [--out=design/eval/perf]
//        [--poke=250] [--max-min=45] [--online-lag=0]
// Plays the rig's game (one person + 3 Normal bots, same seed = same game) and, the whole game long, rival turns and
// animations included, presses a harmless key every --poke ms (Shift: nothing listens for it), so every stretch where
// the page can't answer shows up as input waiting. It records:
//   - every Event Timing entry over 16 ms (input delay = how long the press waited for the main thread; duration = to the
//     next paint), the person's own clicks and the probe's presses, tagged with round, whose turn and the table's phase;
//   - every long animation frame over 50 ms, with its blocking time, style+layout time and the scripts that ran (by
//     function and source position);
//   - with --profile, a CPU profile of the whole game (unminified build for names): main-thread time inside long tasks,
//     by function (self and total), and the busiest long tasks' stacks.
// Writes <out>/freeze-<label>.md and .json. Same seed, same game: compare builds on the totals.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { answerChoice } from '../e2e/v4/lib/answer.mjs';

const argv = process.argv.slice(2);
const pos = argv.filter(a => !a.startsWith('--'));
const flag = (n, d) => { const a = argv.find(x => x === `--${n}` || x.startsWith(`--${n}=`)); if (!a) return d; return a.includes('=') ? a.slice(a.indexOf('=') + 1) : true; };
const [base, label] = pos;
if (!base || !label) { console.error('usage: node scripts/v4-freeze.mjs <url> <label> [--profile]'); process.exit(2); }
const CPU = Number(flag('cpu', 4)), SPEED = String(flag('speed', 'relaxed')), SEED = Number(flag('seed', 20261028));
const EAGER = !!flag('eager', false); // click as soon as your spaces light, mid-animation included (a person does)
const PROFILE = !!flag('profile', false), POKE = Number(flag('poke', 250)), MAX_MIN = Number(flag('max-min', 45));
const OUT = String(flag('out', 'design/eval/perf'));
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const RECORDER = () => {
  const F = (window.__fz = { ev: [], loaf: [] });
  const tag = () => {
    const g = document.querySelector('.app.game');
    return { r: (document.querySelector('.hub-label b')?.textContent || '').trim(), y: g?.dataset.yours === '1' ? 1 : 0, ph: g?.dataset.phase || '', an: g?.dataset.animating === 'true' ? 1 : 0 };
  };
  // the table's state over time, each change (what's shown, whose turn, the prompt), for reading a stuck stretch back
  F.tl = [];
  let lastSig = '';
  setInterval(() => {
    const g = document.querySelector('.app.game');
    if (!g) return;
    const sig = `${g.dataset.moves}/${g.dataset.presentationMoves} y${g.dataset.yours} ${g.dataset.phase} a${g.dataset.animating ? 1 : 0} c${g.dataset.chain || 0} | ${(document.querySelector('[data-prompt]')?.textContent || '').slice(0, 50)} | lit ${document.querySelectorAll('[data-option]').length}`;
    if (sig !== lastSig) { lastSig = sig; F.tl.push(`${Math.round(performance.now())} ${sig}`); }
  }, 100);
  // tags are read when the observer reports (a frame or so after), close enough to say which round and whose turn
  try {
    new PerformanceObserver(l => {
      const t = tag();
      for (const e of l.getEntries()) F.ev.push({ n: e.name, t: Math.round(e.startTime), delay: Math.round(e.processingStart - e.startTime), proc: Math.round(e.processingEnd - e.processingStart), d: Math.round(e.duration), id: e.interactionId || 0, ...t });
    }).observe({ type: 'event', durationThreshold: 16, buffered: true });
  } catch { /* no Event Timing */ }
  try {
    new PerformanceObserver(l => {
      const t = tag();
      for (const e of l.getEntries()) {
        if (e.duration < 50) continue;
        F.loaf.push({ t: Math.round(e.startTime), d: Math.round(e.duration), block: Math.round(e.blockingDuration || 0), sl: Math.round(e.styleAndLayoutDuration || 0), render: e.renderStart ? Math.round(e.startTime + e.duration - e.renderStart) : 0,
          scripts: (e.scripts || []).filter(s => s.duration >= 5).map(s => ({ d: Math.round(s.duration), fsl: Math.round(s.forcedStyleAndLayoutDuration || 0), inv: (s.invoker || '').slice(0, 60), fn: (s.sourceFunctionName || '').slice(0, 50), src: `${(s.sourceURL || '').split('/').pop()}:${s.sourceCharPosition}` })), ...t });
      }
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch { /* no LoAF */ }
};

const browser = await chromium.launch({ executablePath: browserPath });
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
await ctx.addInitScript(RECORDER);
await ctx.addInitScript(s => { let a = s >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, SEED);
await ctx.addInitScript(s => { try { localStorage.setItem('patrons.v4.motionSpeed', s); } catch { /* */ } }, SPEED);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const cdp = await ctx.newCDPSession(page);
await cdp.send('Performance.enable');
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
let held = [];
const $ = async sel => { const h = await page.$(sel); if (h) held.push(h); return h; };
const $$ = async sel => { const hs = await page.$$(sel); held.push(...hs); return hs; };
const letGo = async () => { const hs = held; held = []; await Promise.all(hs.map(h => h.dispose().catch(() => {}))); };
const roundOf = () => page.evaluate(() => (document.querySelector('.hub-label b')?.textContent || '').trim()).catch(() => '');
const center = async el => { const b = await el.boundingBox().catch(() => null); return b && b.width ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null; };
const clicks = [];
async function click(el, what, round) {
  const c = await center(el); if (!c) return false;
  await page.mouse.move(c.x, c.y, { steps: 2 });
  await sleep(60);
  const look = () => page.evaluate(() => { const g = document.querySelector('.app.game'); return [g?.dataset.moves, [...document.querySelectorAll('[data-option]')].map(e => e.getAttribute('data-option')).sort().join(' '), !!document.querySelector('[data-place], .dialog.pay, [data-next-round]')].join('|'); }).catch(() => '');
  const before = await look();
  const anim = await page.evaluate(() => document.querySelector('.app.game')?.dataset.animating === 'true').catch(() => false);
  const t = Date.now();
  await page.mouse.click(c.x, c.y);
  // did the table answer? (a new move, new choices, a dialog) within 1.5 s; a click that changed nothing is a dead click
  let answered = null;
  while (Date.now() - t < 1500) { if ((await look()) !== before) { answered = Date.now() - t; break; } await sleep(30); }
  clicks.push({ what, round, anim, answered });
  return answered != null;
}

await page.goto(`${base.replace(/\/$/, '')}/?intro=0&sound=off`);
await page.click('[data-home="local"]');
await page.waitForSelector('[data-start]');
await page.click('[data-start]');
await page.waitForSelector('.app.game');
if (PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 1000 }); await cdp.send('Profiler.start'); }
const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const t0 = Date.now();
// the poker: a key nothing listens for, pressed on its own clock all game long; its wait is the page's
let poking = true, pokes = 0;
const poker = (async () => { while (poking) { await page.keyboard.press('Shift').catch(() => {}); pokes++; await sleep(POKE); } })();

const gsAt = {};
let dead = 0, placeAt = -1, turns = 0, lastRound = '';
while (Date.now() - t0 < MAX_MIN * 60000) {
  if (await $('.results')) break;
  const hand = await $('[data-handoff]'); if (hand) { await hand.click().catch(() => {}); continue; }
  const round = await roundOf();
  const next = await $('[data-next-round]');
  if (next) { await sleep(900); await click(next, 'next-round', round); await letGo(); continue; }
  const g = await page.evaluate(() => { const e = document.querySelector('.app.game'); return e ? { yours: e.dataset.yours === '1', phase: e.dataset.phase, anim: e.dataset.animating === 'true', moves: Number(e.dataset.moves) } : null; }).catch(() => null);
  if (!g || !g.yours || (g.anim && !EAGER)) { await letGo(); await sleep(60); continue; }
  if (round !== lastRound) {
    lastRound = round;
    const c = await page.evaluate(() => window.__gsCount || null).catch(() => null);
    if (c) gsAt[round] = c;
    console.log(`round ${round} at ${Math.round((Date.now() - t0) / 1000)} s${c ? ` (table renders begun ${c.r}, committed ${c.c})` : ''}`);
  }
  let acted = false;
  if (g.phase === 'place') {
    if (g.moves !== placeAt) { placeAt = g.moves; turns++; }
    // a person looks before placing: one space and one shop card hovered
    for (const sel of ['.lt-wheel [data-slot][data-option]', '.lt-shop .card[data-uid]']) {
      const els = await $$(sel); const el = els[Math.floor(els.length / 2)]; const c = el && await center(el);
      if (c) { await page.mouse.move(c.x, c.y, { steps: 3 }); await sleep(500); }
    }
    const legal = await $$('.lt-wheel [data-slot][data-option]');
    if (legal.length) acted = await click(legal[(g.moves * 3) % legal.length], 'place', round);
    const confirm = await page.waitForSelector('[data-place]', { timeout: 500 }).catch(() => null);
    if (confirm) { held.push(confirm); await click(confirm, 'place-confirm', round); }
  } else if (g.phase === 'buy') {
    const card = await $('.lt-shop .card[data-option]');
    const rates = await $$('.lt-rates [data-rate][data-option]');
    const pick = card || rates[rates.length - 1] || await $('[data-option="pass"]');
    if (pick) acted = await click(pick, card ? 'recruit' : 'followers', round);
  } else {
    const a = await answerChoice(page, { last: ['pass'] }).catch(() => null);
    acted = !!a;
    if (a) clicks.push({ what: g.phase || 'choose', round, anim: g.anim, answered: -1 });
  }
  dead = acted ? 0 : dead + 1;
  if (dead >= 12) {
    errors.push(`harness: stuck at round ${round}`);
    await page.screenshot({ path: `${OUT}/freeze-${label}-stuck.png` });
    // does the table come back by itself? (no input at all for 30 s)
    const look = () => page.evaluate(() => { const g = document.querySelector('.app.game'); return `moves ${g?.dataset.moves} shown ${g?.dataset.presentationMoves} yours ${g?.dataset.yours} phase ${g?.dataset.phase} animating ${g?.dataset.animating} chain ${g?.dataset.chain} prompt ${(document.querySelector('[data-prompt]')?.textContent || '').slice(0, 60)}`; }).catch(e => String(e));
    for (let k = 0; k < 6; k++) { errors.push(`  +${k * 5}s: ${await look()}`); await sleep(5000); }
    const tl = await page.evaluate(() => window.__fz.tl.slice(-60)).catch(() => []);
    errors.push('  timeline (page ms):', ...tl.map(x => `    ${x}`));
    break;
  }
  await letGo();
  await sleep(250);
}
poking = false; await poker;
const wall = Date.now() - t0;
const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const over = !!(await page.$('.results'));
const F = await page.evaluate(() => window.__fz);
const gsEnd = await page.evaluate(() => window.__gsCount || null).catch(() => null);
let profile = null;
if (PROFILE) profile = (await cdp.send('Profiler.stop')).profile;
await browser.close();

// ---------- the report ----------
const rounds = ['I', 'II', 'III'];
const sum = xs => xs.reduce((a, b) => a + b, 0);
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
const busy = k => Math.round(((m1[k] || 0) - (m0[k] || 0)) * 1000);
const L = [`# Freeze probe: ${label}`, '', `${new Date().toISOString()} · ${base} · ${CPU}x CPU · ${SPEED} · seed ${SEED} · ${Math.round(wall / 60000)} min · ${over ? 'game finished' : 'game NOT finished'} · ${pokes} presses every ${POKE} ms${PROFILE ? ' · CPU profile on' : ''}`, '',
  `Main thread over the game: busy ${busy('TaskDuration')} ms of ${wall} (${Math.round(100 * busy('TaskDuration') / wall)}%), script ${busy('ScriptDuration')}, style ${busy('RecalcStyleDuration')}, layout ${busy('LayoutDuration')}.`, ''];
// input: keydown/keyup are the probe's presses; pointer*/click/mouse* are the person's clicks and hovers
if (gsEnd) L.push(`Table renders: ${gsEnd.r} begun, ${gsEnd.c} committed (${gsEnd.r - gsEnd.c} thrown away and started over).`, '');
const inputs = F.ev.filter(e => /^(keydown|pointerdown|pointerup|click|mousedown|mouseup)$/.test(e.n));
L.push('## Input waiting (how long a press or click waited before the page even looked at it)', '', '| round | turn | presses/clicks over 16 ms | over 100 ms | over 250 ms | over 500 ms | worst wait | total wait ms | p95 to paint |', '|---|---|---|---|---|---|---|---|---|');
const res = { rounds: {} };
for (const r of rounds) for (const y of [1, 0]) {
  const xs = inputs.filter(e => e.r === r && e.y === y && (e.n === 'keydown' || e.n === 'pointerdown'));
  if (!xs.length) continue;
  const row = { n: xs.length, o100: xs.filter(e => e.delay > 100).length, o250: xs.filter(e => e.delay > 250).length, o500: xs.filter(e => e.delay > 500).length, worst: Math.max(...xs.map(e => e.delay)), wait: sum(xs.map(e => e.delay)), p95: pct(xs.map(e => e.d), 0.95) };
  (res.rounds[r] ||= {})[y ? 'yours' : 'rivals'] = row;
  L.push(`| ${r} | ${y ? 'yours' : 'rivals'} | ${row.n} | ${row.o100} | ${row.o250} | ${row.o500} | ${row.worst} | ${row.wait} | ${row.p95} |`);
}
const lf = F.loaf;
res.loaf = {};
L.push('', '## Long animation frames over 50 ms', '', '| round | turn | frames | blocking ms | total ms | style+layout ms | over 200 ms | worst |', '|---|---|---|---|---|---|---|---|');
for (const r of rounds) for (const y of [1, 0]) {
  const xs = lf.filter(e => e.r === r && e.y === y);
  if (!xs.length) continue;
  const row = { n: xs.length, block: sum(xs.map(e => e.block)), total: sum(xs.map(e => e.d)), sl: sum(xs.map(e => e.sl)), o200: xs.filter(e => e.d > 200).length, worst: Math.max(...xs.map(e => e.d)) };
  res.loaf[`${r}-${y ? 'yours' : 'rivals'}`] = row;
  L.push(`| ${r} | ${y ? 'yours' : 'rivals'} | ${row.n} | ${row.block} | ${row.total} | ${row.sl} | ${row.o200} | ${row.worst} |`);
}
res.totals = { loafBlock: sum(lf.map(e => e.block)), loafTotal: sum(lf.map(e => e.d)), inputWait: sum(inputs.filter(e => e.n === 'keydown' || e.n === 'pointerdown').map(e => e.delay)), over100: inputs.filter(e => (e.n === 'keydown' || e.n === 'pointerdown') && e.delay > 100).length };
L.push('', `Totals: long frames ${res.totals.loafTotal} ms (${res.totals.loafBlock} ms blocking), input waited ${res.totals.inputWait} ms, ${res.totals.over100} presses/clicks waited over 100 ms.`);
// scripts in long frames, grouped by who started them
const byScript = new Map();
for (const f of lf) for (const s of f.scripts) { const k = `${s.inv} → ${s.fn || '?'} @ ${s.src}`; const e = byScript.get(k) || { d: 0, n: 0, fsl: 0, max: 0 }; e.d += s.d; e.n++; e.fsl += s.fsl; e.max = Math.max(e.max, s.d); byScript.set(k, e); }
L.push('', '## Scripts in long frames (by entry point)', '', '| entry → function @ source | ms | times | forced style+layout ms | worst |', '|---|---|---|---|---|');
for (const [k, e] of [...byScript].sort((a, b) => b[1].d - a[1].d).slice(0, 25)) L.push(`| ${k.replace(/\|/g, '/')} | ${e.d} | ${e.n} | ${e.fsl} | ${e.max} |`);
L.push('', '## The 12 longest frames', '');
for (const f of [...lf].sort((a, b) => b.d - a.d).slice(0, 12)) L.push(`- round ${f.r} ${f.y ? 'your turn' : 'rival turn'} ${f.ph}${f.an ? ' (animating)' : ''}: ${f.d} ms (style+layout ${f.sl}, render ${f.render}): ${f.scripts.map(s => `${s.inv}→${s.fn || '?'} ${s.d}${s.fsl ? ` (forced ${s.fsl})` : ''}`).join(', ')}`);

if (profile) {
  // long tasks from the profile itself: runs of samples that aren't idle, over 50 ms
  const nodes = new Map(profile.nodes.map(n => [n.id, n]));
  const parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const isIdle = id => { const f = nodes.get(id).callFrame.functionName; return f === '(idle)'; };
  const key = f => `${f.functionName || '(anon)'} ${(f.url || '').split('/').pop()}:${f.lineNumber + 1}`;
  const self = new Map(), total = new Map();
  let run = [], runMs = 0, inLong = 0, tasks = [];
  const flush = () => {
    if (runMs >= 50) {
      inLong += runMs;
      const tself = new Map();
      for (const [id, dt] of run) {
        const f = nodes.get(id).callFrame; const k = key(f);
        self.set(k, (self.get(k) || 0) + dt); tself.set(k, (tself.get(k) || 0) + dt);
        const seen = new Set(); for (let n = id; n != null; n = parent.get(n)) { const cf = nodes.get(n).callFrame; if (cf.functionName && cf.url) seen.add(key(cf)); }
        for (const s of seen) total.set(s, (total.get(s) || 0) + dt);
      }
      tasks.push({ ms: runMs, top: [...tself].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${Math.round(v)}`) });
    }
    run = []; runMs = 0;
  };
  profile.samples.forEach((id, i) => { const dt = (profile.timeDeltas[i + 1] ?? 1000) / 1000; if (isIdle(id)) flush(); else { run.push([id, dt]); runMs += dt; } });
  flush();
  L.push('', `## Inside long tasks (CPU profile): ${Math.round(inLong)} ms in ${tasks.length} tasks over 50 ms`, '', '### By function, total (inclusive)', '');
  for (const [k, v] of [...total].sort((a, b) => b[1] - a[1]).slice(0, 45)) L.push(`- ${Math.round(v)} ms ${k}`);
  L.push('', '### By function, self', '');
  for (const [k, v] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 30)) L.push(`- ${Math.round(v)} ms ${k}`);
  L.push('', '### The 10 longest tasks', '');
  for (const t of tasks.sort((a, b) => b.ms - a.ms).slice(0, 10)) L.push(`- ${Math.round(t.ms)} ms: ${t.top.join(' · ')}`);
  res.profile = { inLong: Math.round(inLong), tasks: tasks.length };
}
{
  const timed = clicks.filter(c => c.answered !== -1 && c.answered !== undefined);
  const dead = timed.filter(c => c.answered == null);
  L.push('', `## The person's clicks`, '', `${timed.length} clicks timed; ${dead.length} changed nothing in 1.5 s (${dead.filter(c => c.anim).length} of them made while the table was still animating).`);
  for (const r of rounds) { const xs = timed.filter(c => c.round === r && c.answered != null).map(c => c.answered); if (xs.length) L.push(`- round ${r}: ${xs.length} answered, p50 ${pct(xs, 0.5)} ms, p95 ${pct(xs, 0.95)} ms, worst ${Math.max(...xs)} ms (as seen from outside the page, polling every 30 ms)`); }
  for (const c of dead.slice(0, 15)) L.push(`- dead: round ${c.round} ${c.what}${c.anim ? ' (animating)' : ''}`);
  res.clicks = { timed: timed.length, dead: dead.length, deadAnim: dead.filter(c => c.anim).length };
}
if (errors.length) L.push('', '## Errors', '', ...errors.map(e => `- ${e}`));
writeFileSync(`${OUT}/freeze-${label}.md`, L.join('\n') + '\n');
writeFileSync(`${OUT}/freeze-${label}.json`, JSON.stringify({ label, base, CPU, SPEED, SEED, wall, over, clicks, res, ev: F.ev, loaf: F.loaf }, null, 0));
console.log(L.slice(0, 40).join('\n'));
