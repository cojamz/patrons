// A Chrome performance trace of bot turns on a production build, summarized: where the main thread's time goes while
// chains play (script, style, layout, paint), and the biggest tasks with their call sites.
//   node design/eval/morning-fixes/motion/trace.mjs <url> <speed> <out-prefix> [--secs=15] [--cpu=1] [--seed=7]
// Writes <out-prefix>.json (the summary). The raw trace is big; keep it with --raw.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const pos = argv.filter(a => !a.startsWith('--'));
const flag = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const [base, speed = 'steady', out = 'trace'] = pos;
const SECS = Number(flag('secs', 15)), CPU = Number(flag('cpu', 1)), SEED = Number(flag('seed', 7)), RAW = argv.includes('--raw');

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1270, height: 700 } });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await p.addInitScript(seed => {
  let s = seed >>> 0;
  Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}, SEED);
await p.goto(`${base}/?intro=0&speed=${speed}`);
await p.click('[data-home="local"]');
await p.click('[data-start]');
await p.waitForSelector('.lt-seat[data-pid]');
// play until the first time it is a bot's turn in round I, then trace while the bots play (you pass, place first open)
const act = async () => {
  const mine = await p.$('.app.game[data-yours="1"]');
  if (!mine) return;
  const ph = await mine.getAttribute('data-phase');
  let el = ph === 'buy' ? await p.$('[data-option="pass"]:not([disabled])') : ph === 'place' ? await p.$('.slot.can .base') : null;
  if (!el) el = await p.$('.prompt [data-option]:not([disabled]), [data-option^="color:"]:not([disabled]), .dialog [data-option]:not([disabled])');
  if (el) await el.click({ timeout: 1000 }).catch(() => {});
};
const t0 = Date.now();
while (Date.now() - t0 < 30000) { if (await p.$('.app.game[data-round="1"][data-bot="1"]')) break; await act(); await p.waitForTimeout(150); }
const events = [];
cdp.on('Tracing.dataCollected', e => events.push(...e.value));
const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.start', { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'blink.user_timing'].join(','), transferMode: 'ReportEvents' });
const t1 = Date.now();
while (Date.now() - t1 < SECS * 1000) { await act(); await p.waitForTimeout(150); }
await cdp.send('Tracing.end');
await done;
await b.close();
if (RAW) writeFileSync(`${out}.trace.json`, JSON.stringify({ traceEvents: events }));

// the renderer main thread
const main = events.find(e => e.name === 'thread_name' && e.args && e.args.name === 'CrRendererMain');
const mt = events.filter(e => main && e.pid === main.pid && e.tid === main.tid && e.ph === 'X');
const sum = {};
const NAMES = ['RunTask', 'FunctionCall', 'EvaluateScript', 'TimerFire', 'FireAnimationFrame', 'UpdateLayoutTree', 'Layout', 'Paint', 'PrePaint', 'Layerize', 'Commit', 'HitTest', 'ParseHTML', 'ScheduleStyleRecalculation', 'MajorGC', 'MinorGC', 'V8.GC_SCAVENGER', 'UpdateLayer', 'CompositeLayers', 'IntersectionObserverController::computeIntersections', 'ProfileCall'];
for (const e of mt) { if (!NAMES.includes(e.name)) continue; const s = (sum[e.name] ||= { n: 0, ms: 0, max: 0 }); s.n++; s.ms += (e.dur || 0) / 1000; s.max = Math.max(s.max, (e.dur || 0) / 1000); }
for (const k in sum) { sum[k].ms = Math.round(sum[k].ms); sum[k].max = Math.round(sum[k].max * 10) / 10; }
// the biggest tasks, with what ran in them
const tasks = mt.filter(e => e.name === 'RunTask' && e.dur > 30000).sort((a, b2) => b2.dur - a.dur).slice(0, 12).map(t => {
  const inside = mt.filter(e => e.ts >= t.ts && e.ts + (e.dur || 0) <= t.ts + t.dur && e !== t);
  const by = {};
  for (const e of inside) if (['FunctionCall', 'UpdateLayoutTree', 'Layout', 'Paint', 'PrePaint', 'Layerize', 'TimerFire', 'FireAnimationFrame'].includes(e.name)) by[e.name] = Math.round(((by[e.name] || 0) + e.dur / 1000) * 10) / 10;
  const fn = inside.filter(e => e.name === 'FunctionCall').sort((a, b2) => b2.dur - a.dur).slice(0, 2).map(e => `${e.args?.data?.functionName || '?'}@${(e.args?.data?.url || '').split('/').pop()}:${e.args?.data?.lineNumber}`);
  const lay = inside.filter(e => e.name === 'UpdateLayoutTree').map(e => e.args?.elementCount || e.args?.beginData?.elementCount).filter(Boolean);
  return { ms: Math.round(t.dur / 1000), by, fn, styleElements: lay.slice(0, 4) };
});
// style recalcs: how many elements each touches
const ult = mt.filter(e => e.name === 'UpdateLayoutTree').map(e => e.args?.elementCount ?? 0);
const res = { speed, cpu: CPU, secs: SECS, totals: sum, styleRecalcElements: { n: ult.length, p50: ult.sort((a, b2) => a - b2)[Math.floor(ult.length / 2)], max: ult[ult.length - 1], over500: ult.filter(x => x > 500).length }, bigTasks: tasks };
writeFileSync(`${out}.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1).slice(0, 4000));
