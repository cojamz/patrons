import { browserPath } from '../e2e/v4/lib/browser.mjs';
// The perf rig: one full 4-player game on a frozen build at 4x CPU, measured round by round, with a pass/fail gate.
//   node scripts/v4-rig.mjs <url> <label> [--cpu=4] [--speed=relaxed|steady|quick] [--seed=N] [--out=design/eval/perf]
//        [--max-min=45] [--no-gate]
// P1 is a person (the harness: hovers a space and a shop card, places, recruits or buys followers, pays), P2-P4 are
// Normal bots, at the viewer's speed (default Relaxed, what Cory plays). Per round it records:
//   - frames: every frame's gap, tagged with the animations running (sampled 10x a second): p50/p95/worst, hitch %
//     (frames over 33 ms), per animation;
//   - clicks: pointerdown → the answer on screen and painted (a new move, new choices, a dialog), per kind;
//   - hovers: pointer arrival (+ the hover delay) → the card up and settled (no change for a frame);
//   - idle: on P1's turn with the table settled, main-thread busy % over 3 s, and its style/layout/script split;
//   - memory: elements, JS listeners and heap after a forced GC, at each round's first turn.
// At the end it reloads on the same turn and measures again (a reload drops anything leaked).
// Writes <out>/rig-<label>.md and .json. Exit 1 if a gate fails (bars: .claude/rules/harness.md "Checks").
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { HOVER_DELAY_MS } from '../src/v4/game/hoverDelay.js';
import { answerChoice } from '../e2e/v4/lib/answer.mjs';

const argv = process.argv.slice(2);
const pos = argv.filter(a => !a.startsWith('--'));
const flag = (n, d) => { const a = argv.find(x => x === `--${n}` || x.startsWith(`--${n}=`)); if (!a) return d; return a.includes('=') ? a.slice(a.indexOf('=') + 1) : true; };
const [base, label] = pos;
if (!base || !label) { console.error('usage: node scripts/v4-rig.mjs <url> <label> [--cpu=4] [--speed=relaxed] [--seed=N]'); process.exit(2); }
const CPU = Number(flag('cpu', 4)), SPEED = String(flag('speed', 'relaxed')), SEED = Number(flag('seed', 20261028));
const OUT = String(flag('out', 'design/eval/perf')), MAX_MIN = Number(flag('max-min', 45)), GATE = !flag('no-gate', false);
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

// The bars (the snappy bar in the project rules, plus growth and leak limits)
export const BARS = {
  clickP95: 100, // ms, pointerdown → answer painted
  hoverP95: 100, // ms, after the hover delay → card settled
  frameP95: 33.4, // ms, during shows
  hitchPct: 5, // % of frames over 33 ms
  idleBusyPct: 10, // % of main thread on an idle table at 4x
  growth: 1.5, // round III over round I, for click p95 and idle busy
  leakNodes: 1.1, leakListeners: 1.1, leakHeap: 1.25, // unbroken game over a reload of the same turn
};

const RECORDER = () => {
  const F = (window.__rig = { round: '', frames: [], samples: [], loaf: [] });
  const name = a => {
    const el = a.effect && a.effect.target;
    const what = a.animationName || a.transitionProperty || 'js';
    if (!el || !el.tagName) return what;
    const c = (typeof el.className === 'string' ? el.className : el.className?.baseVal || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    return `${el.tagName.toLowerCase()}${c ? '.' + c : ''}:${what}`;
  };
  let last = 0, lastSample = 0, cur = [];
  const tick = t => {
    const r = (document.querySelector('.hub-label b')?.textContent || '').trim();
    if (r) F.round = r;
    if (t - lastSample > 100) {
      lastSample = t;
      try { cur = [...new Set(document.getAnimations().filter(a => a.playState === 'running').map(name))]; } catch { cur = []; }
    }
    // frames while the tab is idle-measured or hidden are skipped by the harness (F.pause)
    if (last && !F.pause && F.round) F.frames.push([F.round, Math.round((t - last) * 10) / 10, cur]);
    last = t;
    // paused (the idle reading): no frame loop at all, or its own frames would restyle every running animation
    if (F.pause) { F.stopped = true; last = 0; return; }
    requestAnimationFrame(tick);
  };
  F.resume = () => { F.pause = false; if (F.stopped) { F.stopped = false; requestAnimationFrame(tick); } };
  requestAnimationFrame(tick);
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { if (e.duration > 2000) F.big = (F.big || []).concat({ d: Math.round(e.duration), prompt: (document.querySelector('[data-prompt]')?.textContent || '').slice(0, 120), phase: document.querySelector('.app.game')?.dataset.phase, hover: (document.querySelector('.lt-hover')?.textContent || '').slice(0, 120), options: [...document.querySelectorAll('[data-option]')].map(x => x.getAttribute('data-option')).slice(0, 20) }); F.loaf.push({ round: F.round, d: Math.round(e.duration), scripts: (e.scripts || []).slice(0, 3).map(s => `${(s.sourceFunctionName || s.invoker || '?').slice(0, 40)} ${Math.round(s.duration)}${s.duration > 1000 ? ` [${s.invoker || ''} @ ${(s.sourceURL || '').split('/').pop()}:${s.sourceCharPosition}]` : ''}`) }); } }).observe({ type: 'long-animation-frame', buffered: false }); } catch { /* no LoAF */ }
  // click → answer painted: armed by the harness before each click
  F.arm = () => new Promise(resolve => {
    const look = () => {
      const g = document.querySelector('.app.game');
      return [g?.dataset.moves, !!document.querySelector('[data-next-round]'), [...document.querySelectorAll('[data-option]')].map(e => e.getAttribute('data-option')).sort().join(' '), !!document.querySelector('[data-place], .dialog.pay')].join('|');
    };
    const before = look();
    let t0 = null;
    const down = e => { t0 = e.timeStamp; };
    addEventListener('pointerdown', down, { capture: true, once: true });
    const t1 = performance.now();
    const poll = () => {
      if (t0 != null && look() !== before) { requestAnimationFrame(() => resolve(Math.round(performance.now() - t0))); return; }
      if (performance.now() - t1 > 4000) { resolve(null); return; }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  });
  // hover → card settled: the hover card is up and hasn't changed for one frame
  F.armHover = () => new Promise(resolve => {
    let t0 = null, sig = '', since = 0;
    const over = e => { if (t0 == null) t0 = e.timeStamp; };
    addEventListener('pointerover', over, { capture: true });
    const t1 = performance.now();
    const poll = () => {
      const card = document.querySelector('.lt-hover');
      const now = performance.now();
      if (t0 != null && card) {
        const s = card.innerHTML.length + ':' + card.getBoundingClientRect().height;
        if (s !== sig) { sig = s; since = now; } else if (now - since > 16) { removeEventListener('pointerover', over, true); resolve(Math.round(since - t0)); return; }
      }
      if (now - t1 > 3000) { removeEventListener('pointerover', over, true); resolve(null); return; }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  });
};

const browser = await chromium.launch({ executablePath: browserPath });
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
await ctx.addInitScript(RECORDER);
await ctx.addInitScript(s => { let a = s >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, SEED);
await ctx.addInitScript(s => { try { localStorage.setItem('patrons.v4.motionSpeed', s); } catch { /* */ } }, SPEED);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
let loads = 0;
page.on('load', () => { if (++loads > 2) errors.push(`the page reloaded itself (load ${loads})`); });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Performance.enable');
const throttle = r => cdp.send('Emulation.setCPUThrottlingRate', { rate: r });
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const memory = async () => { await cdp.send('HeapProfiler.collectGarbage'); const c = await cdp.send('Memory.getDOMCounters'); const h = await cdp.send('Runtime.getHeapUsage'); return { nodes: c.nodes, listeners: c.jsEventListeners, heapMB: Math.round(h.usedSize / 1e5) / 10 }; };
// every element handle is let go each turn: a held handle pins its element, and a detached one its whole old tree
// (memory.mjs read 27k nodes from that), which would read as the game's own leak
let held = [];
const $ = async sel => { const h = await page.$(sel); if (h) held.push(h); return h; };
const $$ = async sel => { const hs = await page.$$(sel); held.push(...hs); return hs; };
const letGo = async () => { const hs = held; held = []; await Promise.all(hs.map(h => h.dispose().catch(() => {}))); };
const roundOf = () => page.evaluate(() => (document.querySelector('.hub-label b')?.textContent || '').trim()).catch(() => '');
const center = async el => { const b = await el.boundingBox().catch(() => null); return b && b.width ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null; };

const R = {}; // round → { clicks: [{what, ms}], hovers: [], idle: [], memory }
const per = r => (R[r] ||= { clicks: [], hovers: [], idle: [], memory: null });

async function idleSample(round) {
  // the table settles, then 3 s of nothing: what the page costs on its own (the frame recorder pauses meanwhile)
  await sleep(1500);
  await page.evaluate(() => { window.__rig.pause = true; });
  const m0 = await metrics(); await sleep(3000); const m1 = await metrics();
  await page.evaluate(() => window.__rig.resume());
  const d = k => Math.round(((m1[k] || 0) - (m0[k] || 0)) * 1000);
  const anims = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length);
  const x = { busyPct: Math.round(d('TaskDuration') / 30), script: d('ScriptDuration'), style: d('RecalcStyleDuration'), layout: d('LayoutDuration'), anims };
  per(round).idle.push(x);
  return x;
}
async function click(el, what, round) {
  const c = await center(el);
  if (!c) return false;
  await page.mouse.move(c.x, c.y, { steps: 2 });
  const p = page.evaluate(() => window.__rig.arm()).catch(() => null);
  await sleep(20);
  await page.mouse.click(c.x, c.y);
  const ms = await p.catch(() => null);
  per(round).clicks.push({ what, ms });
  return ms != null;
}
async function hover(sel, round) {
  const els = await $$(sel);
  const el = els[Math.floor(els.length / 2)];
  const c = el && await center(el);
  if (!c) return;
  await page.mouse.move(c.x, c.y - 120, { steps: 1 }); // off it first
  await sleep(250);
  const p = page.evaluate(() => window.__rig.armHover()).catch(() => null);
  await sleep(20);
  await page.mouse.move(c.x, c.y, { steps: 3 });
  const ms = await p.catch(() => null);
  per(round).hovers.push({ sel, ms: ms == null ? null : Math.max(0, ms - HOVER_DELAY_MS) });
  await sleep(300);
}

await throttle(CPU);
await page.goto(`${base.replace(/\/$/, '')}/?intro=0&sound=off`);
await page.click('[data-home="local"]');
await page.waitForSelector('[data-start]');
await page.click('[data-start]');
await page.waitForSelector('.app.game');
const t0 = Date.now();
let turns = 0, lastRound = '', dead = 0, finalRound = '';
while (Date.now() - t0 < MAX_MIN * 60000) {
  if (await $('.results')) break;
  const hand = await $('[data-handoff]'); if (hand) { await hand.click().catch(() => {}); continue; }
  const round = await roundOf();
  const next = await $('[data-next-round]');
  if (next) { await sleep(900); await click(next, 'next-round', round || lastRound); continue; }
  const g = await page.evaluate(() => { const e = document.querySelector('.app.game'); return e ? { yours: e.dataset.yours === '1', phase: e.dataset.phase, anim: e.dataset.animating === 'true' } : null; }).catch(() => null);
  if (!g || !g.yours) { await sleep(60); continue; }
  if (round && round !== lastRound && g.phase === 'place') {
    lastRound = round;
    await sleep(1500);
    per(round).memory = await memory();
    console.log(`round ${round}: ${JSON.stringify(per(round).memory)}`);
  }
  const before = per(round).clicks.length;
  if (g.phase === 'place') {
    turns++;
    if (turns % 2 === 1) console.log(`round ${round} turn ${turns}: idle ${JSON.stringify(await idleSample(round))}`);
    await hover('.lt-wheel [data-slot][data-option]', round);
    await hover('.lt-shop .card[data-uid]', round);
    const legal = await $$('.lt-wheel [data-slot][data-option]');
    if (legal.length) await click(legal[(turns * 3) % legal.length], 'place', round);
    const confirm = await page.waitForSelector('[data-place]', { timeout: 500 }).catch(() => null);
    if (confirm) await click(confirm, 'place-confirm', round);
    finalRound = round;
  } else if (g.phase === 'buy') {
    const card = await $('.lt-shop .card[data-option]');
    const rates = await $$('.lt-rates [data-rate][data-option]');
    const pick = card || rates[rates.length - 1] || await $('[data-option="pass"]');
    if (pick) await click(pick, card ? 'recruit' : rates.length ? 'followers' : 'pass', round);
  } else {
    // the pay sheet, a choice on the board, a gift: the e2e drivers' one way to answer (e2e/v4/lib/answer.mjs)
    const p = page.evaluate(() => window.__rig.arm()).catch(() => null);
    await sleep(20);
    const a = await answerChoice(page, { last: ['pass'] }).catch(() => null);
    if (!a) { await letGo(); await sleep(200); continue; } // nothing on screen to answer yet (a sheet still opening)
    const ms = await p.catch(() => null);
    per(round).clicks.push({ what: a ? a.kind === 'option' ? g.phase || 'choose' : a.kind : 'none', ms });
  }
  const ok = per(round).clicks.length > before && per(round).clicks.at(-1).ms != null;
  dead = ok ? 0 : dead + 1;
  if (dead === 3) errors.push(`harness: stuck in ${g.phase}, options ${(await page.$$eval('[data-option]', els => els.map(e => `${e.getAttribute('data-option')}${e.disabled ? '(off)' : ''}@${e.className.split(' ')[0]}`)).catch(() => [])).join(' ')}`);
  if (dead >= 8) { errors.push(`harness: 8 clicks in a row changed nothing at round ${round}`); await page.screenshot({ path: `${OUT}/rig-${label}-stuck.png` }); break; }
  await letGo();
  await sleep(250);
}
await letGo();
const over = !!(await page.$('.results'));

const F = await page.evaluate(() => ({ frames: window.__rig.frames, loaf: window.__rig.loaf, big: window.__rig.big || [] })).catch(() => ({ frames: [], loaf: [] }));
// the leak control: a reload on the last round's turn (the game is saved locally), measured the same way
let unbroken = null, reloaded = null;
if (finalRound && R[finalRound]) {
  await page.evaluate(() => { window.__rig.frames = []; window.__rig.loaf = []; }).catch(() => {}); // the recorder's own data isn't the game's
  unbroken = await memory();
  await throttle(1);
  await page.reload();
  await page.waitForSelector('[data-home="resume"], .app.game');
  if (await page.$('[data-home="resume"]')) await page.click('[data-home="resume"]');
  await page.waitForSelector('.app.game').catch(() => {});
  await sleep(2500);
  reloaded = await memory();
}
await browser.close();

// ---------- the report ----------
const pct = (xs, p) => { const s = xs.filter(x => x != null).sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const rounds = Object.keys(R).filter(r => ['I', 'II', 'III', 'IV'].includes(r));
const sum = {};
for (const r of rounds) {
  const fr = F.frames.filter(f => f[0] === r);
  const showing = fr.filter(f => f[2].some(a => !/cult-(breathe|blink|shift|eager|scheme)|cs-bob|:blink$/.test(a)));
  const byAnim = new Map();
  for (const [, g, as] of fr) for (const a of as) { if (!byAnim.has(a)) byAnim.set(a, []); byAnim.get(a).push(g); }
  const clicks = R[r].clicks.map(c => c.ms), hovers = R[r].hovers.map(h => h.ms);
  sum[r] = {
    frames: { n: fr.length, showN: showing.length, p50: pct(showing.map(f => f[1]), 0.5), p95: pct(showing.map(f => f[1]), 0.95), worst: Math.max(0, ...showing.map(f => f[1])), hitch: showing.length ? Math.round(100 * showing.filter(f => f[1] > 33.4).length / showing.length) : 0 },
    anims: [...byAnim].map(([k, gs]) => ({ k, n: gs.length, p95: pct(gs, 0.95), worst: Math.max(...gs), hitch: Math.round(100 * gs.filter(g => g > 33.4).length / gs.length) })).sort((a, b) => b.hitch * b.n - a.hitch * a.n).slice(0, 12),
    clicks: { n: clicks.length, p50: pct(clicks, 0.5), p95: pct(clicks, 0.95), max: Math.max(0, ...clicks.filter(x => x != null)), dead: clicks.filter(x => x == null).length, byKind: Object.entries(R[r].clicks.reduce((m, c) => ((m[c.what] ||= []).push(c.ms), m), {})).map(([k, xs]) => ({ k, n: xs.length, p50: pct(xs, 0.5), p95: pct(xs, 0.95) })) },
    hovers: { n: hovers.length, p50: pct(hovers, 0.5), p95: pct(hovers, 0.95), missed: hovers.filter(x => x == null).length },
    idle: { busyPct: pct(R[r].idle.map(x => x.busyPct), 0.5), style: pct(R[r].idle.map(x => x.style), 0.5), script: pct(R[r].idle.map(x => x.script), 0.5), anims: pct(R[r].idle.map(x => x.anims), 0.5) },
    memory: R[r].memory,
    loaf: { n: F.loaf.filter(l => l.round === r).length, over100: F.loaf.filter(l => l.round === r && l.d > 100).length, top: F.loaf.filter(l => l.round === r).sort((a, b) => b.d - a.d).slice(0, 5) },
  };
}

const fails = [];
const check = (ok, what) => { if (!ok) fails.push(what); };
for (const r of rounds) {
  const s = sum[r];
  if (s.clicks.p95 != null) check(s.clicks.p95 <= BARS.clickP95, `round ${r}: clicks p95 ${s.clicks.p95} ms (bar ${BARS.clickP95})`);
  if (s.hovers.p95 != null) check(s.hovers.p95 <= BARS.hoverP95, `round ${r}: hovers p95 ${s.hovers.p95} ms (bar ${BARS.hoverP95})`);
  if (s.frames.p95 != null) check(s.frames.p95 <= BARS.frameP95, `round ${r}: show frames p95 ${s.frames.p95} ms (bar ${BARS.frameP95})`);
  check(s.frames.hitch <= BARS.hitchPct, `round ${r}: ${s.frames.hitch}% of show frames hitch (bar ${BARS.hitchPct}%)`);
  if (s.idle.busyPct != null) check(s.idle.busyPct <= BARS.idleBusyPct, `round ${r}: idle table busy ${s.idle.busyPct}% (bar ${BARS.idleBusyPct}%)`);
}
const first = sum[rounds[0]], lastS = sum[rounds.at(-1)];
if (first && lastS && rounds.length > 1) {
  if (first.clicks.p95 && lastS.clicks.p95) check(lastS.clicks.p95 <= BARS.growth * Math.max(first.clicks.p95, BARS.clickP95 / 2), `clicks p95 grows ${first.clicks.p95} → ${lastS.clicks.p95} ms over the game`);
  if (first.idle.busyPct != null && lastS.idle.busyPct != null) check(lastS.idle.busyPct <= BARS.growth * Math.max(first.idle.busyPct, 4), `idle busy grows ${first.idle.busyPct}% → ${lastS.idle.busyPct}% over the game`);
}
if (unbroken && reloaded) {
  check(unbroken.nodes <= BARS.leakNodes * reloaded.nodes, `leak: ${unbroken.nodes} elements vs ${reloaded.nodes} after a reload`);
  check(unbroken.listeners <= BARS.leakListeners * reloaded.listeners, `leak: ${unbroken.listeners} listeners vs ${reloaded.listeners} after a reload`);
  check(unbroken.heapMB <= BARS.leakHeap * reloaded.heapMB, `leak: heap ${unbroken.heapMB} MB vs ${reloaded.heapMB} MB after a reload`);
}
if (!over) fails.push(`the game did not finish (${errors.find(e => e.startsWith('harness')) || `cap ${MAX_MIN} min`})`);

const v = x => (x == null ? '–' : Math.round(x));
const L = [`# Perf rig: ${label}`, '', `${new Date().toISOString()} · ${base} · ${CPU}x CPU · ${SPEED} · seed ${SEED} · 1 person + 3 Normal bots · ${Math.round((Date.now() - t0) / 60000)} min · ${over ? 'game finished' : 'game NOT finished'}`, '',
  `Verdict: ${fails.length ? `FAIL (${fails.length})` : 'PASS'}`, ...fails.map(f => `- ${f}`), '',
  '## Per round', '', '| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |', '|---|---|---|---|---|---|---|---|---|---|---|---|'];
for (const r of rounds) { const s = sum[r]; L.push(`| ${r} | ${v(s.clicks.p50)} / ${v(s.clicks.p95)} | ${v(s.hovers.p50)} / ${v(s.hovers.p95)} | ${v(s.frames.p95)} | ${s.frames.hitch} | ${v(s.frames.worst)} | ${s.loaf.over100} | ${v(s.idle.busyPct)} | ${v(s.idle.style)} | ${s.memory?.nodes ?? '–'} | ${s.memory?.listeners ?? '–'} | ${s.memory?.heapMB ?? '–'} |`); }
if (unbroken) L.push('', `Leak control on the last turn: unbroken game ${unbroken.nodes} elements, ${unbroken.listeners} listeners, ${unbroken.heapMB} MB; after a reload ${reloaded.nodes}, ${reloaded.listeners}, ${reloaded.heapMB} MB.`);
for (const r of rounds) {
  const s = sum[r];
  L.push('', `## Round ${r}`, '', 'Clicks by kind: ' + s.clicks.byKind.map(k => `${k.k} ${k.n}× p50 ${v(k.p50)} p95 ${v(k.p95)}`).join(' · ') + (s.clicks.dead ? ` · ${s.clicks.dead} changed nothing in 4 s` : ''));
  L.push('', '| animating | frames | p95 | worst | hitch % |', '|---|---|---|---|---|', ...s.anims.map(a => `| ${a.k} | ${a.n} | ${v(a.p95)} | ${v(a.worst)} | ${a.hitch} |`));
  if (s.loaf.top.length) L.push('', 'Longest frames: ' + s.loaf.top.map(l => `${l.d} ms (${l.scripts.join(', ') || 'style/layout/paint'})`).join(' · '));
}
if (F.big && F.big.length) L.push('', 'Frames over 2 s, with the screen at the time:', ...F.big.map(b => `- ${b.d} ms · ${b.phase} · prompt "${b.prompt}" · hover "${b.hover}" · options ${b.options.join(' ')}`));
if (errors.length) L.push('', 'Errors:', ...errors.slice(0, 10).map(e => `- ${e}`));
writeFileSync(`${OUT}/rig-${label}.md`, L.join('\n') + '\n');
writeFileSync(`${OUT}/rig-${label}.json`, JSON.stringify({ label, cpu: CPU, speed: SPEED, seed: SEED, bars: BARS, fails, sum, unbroken, reloaded, errors }, null, 1));
console.log(L.slice(0, 12 + rounds.length + 3).join('\n'));
process.exit(GATE && fails.length ? 1 : 0);
