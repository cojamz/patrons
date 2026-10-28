import { browserPath, launchBrowser, cdpOk } from '../e2e/v4/lib/browser.mjs';
// Pace: where the wall-clock time of a turn goes (snappy pair, Oct 28: "still doesn't feel as snappy as it could").
//   node scripts/v4-pace.mjs <base url> [--speed=relaxed] [--cpu=1] [--seed=5] [--turns=3]
// From a save where P1 is about to place (seed's round II), P1 places a plain space and passes the buy, then the rivals
// play until P1 places again; repeated --turns times. A logger on the table root stamps every change of actor, phase,
// shown move and show (data-chain), so the report splits each loop into:
//   ack      press → first painted change (next frame after the first DOM change under the table)
//   lit      press → your next choice lit (buy step shown)
//   rivals   pass → your next placement lit, with each shown move's time and how much of it was a show
// Prints a table and writes design/eval/perf/pace-<speed>-cpu<n>.md.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createGame, applyMove, chooseBotMove } from '../src/engine/v4/index.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { buildStamp } from '../e2e/v4/lib/stamp.mjs';

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const base = argv.find(a => !a.startsWith('--'));
if (!base) { console.error('usage: node scripts/v4-pace.mjs <base url> [--speed=relaxed] [--cpu=1] [--seed=5] [--turns=3]'); process.exit(2); }
const SPEED = flag('speed', 'relaxed'), CPU = Number(flag('cpu', 1)), SEED = Number(flag('seed', 5)), TURNS = Number(flag('turns', 3));
const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];

function saveAt(seed, pick) {
  let s = createGame({ seats: SEATS, seed });
  s.build = buildStamp();
  const rand = seededRandom(seed);
  for (let n = 0; n < 2000 && !s.over && !pick(s, n); n++) s = applyMove(s, chooseBotMove(s, rand));
  s.build = buildStamp();
  return { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
}
const save = saveAt(SEED, (s, n) => n >= 44 && s.pending && s.pending.player === 0 && s.pending.kind === 'place');

const LOGGER = () => {
  const L = (window.__pace = { ev: [], firstChange: null, armed: false });
  const root = () => document.querySelector('.app.game');
  let last = '';
  const stamp = () => {
    const r = root(); if (!r) return;
    const d = r.dataset;
    const k = `${d.actor}|${d.phase}|${d.presentationMoves}|${d.chain ? 1 : 0}|${d.yours}`;
    if (k !== last) { last = k; L.ev.push({ t: performance.now(), actor: d.actor, phase: d.phase, pm: Number(d.presentationMoves), chain: !!d.chain, yours: d.yours }); }
  };
  const mo = new MutationObserver(() => {
    stamp();
    if (L.armed && L.firstChange == null) { const t = performance.now(); L.firstChange = t; requestAnimationFrame(() => { L.firstPaint = performance.now(); }); }
  });
  const hook = () => { const r = root(); if (!r) return setTimeout(hook, 50); mo.observe(r, { attributes: true, childList: true, subtree: true, characterData: true }); stamp(); };
  hook();
};

const b = await launchBrowser({ executablePath: browserPath });
const ctx = await b.newContext({ viewport: { width: 1270, height: 700 } });
const p = await ctx.newPage();
if (CPU > 1 && cdpOk) { const c = await ctx.newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate: CPU }); }
await p.goto(`${base}/?intro=0&speed=${SPEED}`);
await p.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), save);
await p.reload();
await (await p.waitForSelector('[data-home="resume"]', { timeout: 20000 })).click();
await p.evaluate(LOGGER);
const placeSel = '.lt[data-phase="place"][data-yours="1"] .slot.can .base';
await p.waitForSelector(placeSel, { timeout: 30000 });
await p.waitForTimeout(1500);

const now = () => p.evaluate(() => performance.now());
const loops = [];
for (let turn = 0; turn < TURNS; turn++) {
  const h = await p.evaluateHandle(() => [...document.querySelectorAll('.slot.can')].find(e => /: \+\d+ \w+\.( Open)/.test(e.getAttribute('aria-label') || '')) || document.querySelector('.slot.can'));
  const el = h.asElement();
  const bb = await (await el.$('.base')).boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 3 });
  await p.waitForTimeout(400);
  await p.evaluate(() => { window.__pace.armed = true; window.__pace.firstChange = null; window.__pace.firstPaint = null; });
  const t0 = await now();
  await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  // a space may ask first: answer (never pass or undo) until the buy step
  let asked = 0;
  for (let k = 0; k < 40 && !(await p.$('.lt[data-phase="buy"][data-yours="1"] [data-option="pass"]')); k++) {
    const opt = await p.$('.lt[data-phase="choose"][data-yours="1"] .prompt.choice button[data-option]:not([disabled]):not([data-option="pass"]):not(.undo)');
    if (opt) { asked++; await opt.click().catch(() => {}); }
    await p.waitForTimeout(40);
  }
  const tLit = await now();
  const own = await p.evaluate(([a, z]) => window.__pace.ev.filter(e => e.t >= a && e.t <= z).map(e => `${Math.round(e.t - a)} P${Number(e.actor) + 1}:${e.phase}#${e.pm}${e.chain ? ' show' : ''}`), [t0, tLit]);
  const ack = await p.evaluate(() => ({ change: window.__pace.firstChange, paint: window.__pace.firstPaint }));
  await p.evaluate(() => { window.__pace.armed = false; });
  await p.waitForTimeout(300);
  const tPass = await now();
  await (await p.$('.lt[data-phase="buy"][data-yours="1"] [data-option="pass"]'))?.click();
  await p.waitForSelector(placeSel, { timeout: 120000 });
  const tBack = await now();
  const ev = await p.evaluate(([a, z]) => window.__pace.ev.filter(e => e.t >= a && e.t <= z), [tPass, tBack]);
  // per shown move: from its pm bump to the next one, and time with a show running
  const steps = [];
  for (let i = 0; i < ev.length; i++) {
    const e = ev[i];
    if (i === 0 || e.pm !== ev[i - 1].pm) steps.push({ t: e.t, actor: e.actor, phase: e.phase, pm: e.pm, show: 0 });
  }
  for (let i = 0; i < ev.length; i++) if (ev[i].chain) { const end = (ev[i + 1] || { t: tBack }).t; const s = [...steps].reverse().find(x => x.t <= ev[i].t); if (s) s.show += end - ev[i].t; }
  steps.forEach((s, i) => { s.ms = Math.round(((steps[i + 1] || { t: tBack }).t) - s.t); s.show = Math.round(s.show); });
  loops.push({ own, turn, asked, ack: ack.paint ? Math.round(ack.paint - t0) : null, lit: Math.round(tLit - t0 - 40), rivals: Math.round(tBack - tPass), steps });
  await p.waitForTimeout(600);
}
await b.close();

const lines = [`# Pace: ${SPEED}, ${CPU}x CPU, seed ${SEED}`, '', `${new Date().toISOString()} · ${base}`, ''];
for (const l of loops) {
  lines.push(`Turn ${l.turn + 1}: press to first paint ${l.ack} ms · press to your buy step ${l.lit} ms (${l.asked} questions) · rivals ${(l.rivals / 1000).toFixed(1)} s over ${l.steps.length} shown moves`);
  lines.push('  you: ' + l.own.join(' · '));
  lines.push('  ' + l.steps.map(s => `P${Number(s.actor) + 1}:${s.phase} ${s.ms}${s.show ? `(show ${s.show})` : ''}`).join(' · '));
}
const out = lines.join('\n');
console.log(out);
mkdirSync('design/eval/perf', { recursive: true });
writeFileSync(`design/eval/perf/pace-${SPEED}-cpu${CPU}.md`, out + '\n');
