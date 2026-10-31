import { browserPath, launchBrowser } from '../e2e/v4/lib/browser.mjs';
// Swap picker probe: what opening a member swap costs late in a game (the old Even Swap's picker; Promote's today).
//   node scripts/v4-swap-probe.mjs <url> [--cpu=4] [--members=10] [--runs=3] [--profile] [--diff] [--control] [--shot=<path prefix>]
// --control places on Gather instead (no picker): the placement's own cost, to set beside Promote's.
// A crafted round III save: four cults of <members> members each and a full shop, P1 (you) to place. Clicks Promote,
// then a member, at CPU x, and prints for each step the page's element count and the longest frame (long animation
// frames, else the longest rAF gap) from the click until the card stands.
import { chromium } from 'playwright';
import { seedSave } from '../e2e/v4/lib/seed.mjs';
import { buildStamp } from '../e2e/v4/lib/stamp.mjs';
import { createGame, applyMove, quadrant } from '../src/engine/v4/index.js';
import { resume } from '../src/engine/v4/core.js';

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const base = (argv.find(a => !a.startsWith('--')) || 'http://localhost:5303').replace(/\/$/, '');
const PROFILE = argv.includes('--profile'), DIFF = argv.includes('--diff'), CONTROL = argv.includes('--control'), SHOT = flag('shot', '');
const CPU = Number(flag('cpu', 4)), N = Number(flag('members', 10)), RUNS = Number(flag('runs', 3));
const quads = ['red', 'echo', 'thieves', 'purple'];
const seats = ['You', 'Bo', 'Cy', 'Di'].map(name => ({ name, kind: 'human' }));
const slot = (q, k) => `${quads.indexOf(q)}-${quadrant(q).actions.findIndex(a => a.key === k)}`;

function fixture() {
  let s = createGame({ seats, seed: 7, quadrants: quads });
  Object.assign(s, { round: 3, queue: [], pending: null, slots: {}, squats: {}, order: [], log: [] });
  delete s.echo;
  for (const w of Object.values(s.waiting || {})) { s.pile.push(...w); w.length = 0; }
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  const take = () => s.pile.shift();
  s.players.forEach(p => { p.res = Object.fromEntries(s.resources.map(r => [r, 3])); p.left = 5; for (let k = 0; k < N; k++) p.members.push(take()); });
  for (let k = 0; k < 8; k++) s.shop.push(take());
  s.queue = [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }];
  s = resume(s);
  s.build = buildStamp();
  const after = applyMove(s, { player: 0, option: `slot:${slot('red', 'hireup')}` });
  return { save: { config: { seats, speed: 'fast' }, state: s, undo: null, savedAt: Date.now() }, pairs: after.pending?.options?.length || 0 };
}

const RECORD = () => {
  window.__probe = { loaf: [], gaps: [], on: false };
  let last = 0;
  const tick = t => { if (window.__probe.on && last) window.__probe.gaps.push(t - last); last = t; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  try { new PerformanceObserver(l => { if (window.__probe.on) for (const e of l.getEntries()) window.__probe.loaf.push(Math.round(e.duration)); }).observe({ type: 'long-animation-frame' }); } catch { /* none */ }
};

const browser = await launchBrowser({ executablePath: browserPath });
const rows = [];
for (let run = 0; run < RUNS; run++) {
  const { save, pairs } = fixture();
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  await ctx.addInitScript(RECORD);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await seedSave(page, save);
  await page.goto(`${base}/?intro=0&sound=off&botDelay=50`);
  await page.locator('[data-home="resume"]').click();
  await page.waitForSelector('.app.game');
  if (await page.locator('[data-handoff]').isVisible().catch(() => false)) await page.locator('[data-handoff]').click();
  await page.waitForTimeout(2500);
  const cdp = await ctx.newCDPSession(page);
  const count = () => page.evaluate(() => document.getElementsByTagName('*').length);
  const step = async (name, act, ready) => {
    await page.evaluate(() => { window.__probe.loaf = []; window.__probe.gaps = []; window.__probe.on = true; });
    const n0 = await count();
    const hist = () => page.evaluate(() => { const m = {}; for (const e of document.querySelectorAll('*')) { const c = (typeof e.className === 'string' ? e.className : e.className?.baseVal || '').trim().split(/\s+/)[0]; const k = e.tagName.toLowerCase() + (c ? '.' + c : ''); m[k] = (m[k] || 0) + 1; } return m; });
    const h0 = DIFF ? await hist() : null;
    await cdp.send('Performance.enable');
    const met = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
    const m0 = await met();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    if (PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start'); }
    await act();
    await page.waitForSelector(ready, { timeout: 30000 });
    await page.waitForTimeout(1500);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    if (PROFILE) {
      // self time by function (an unminified build names them: vite build --minify false)
      const { profile } = await cdp.send('Profiler.stop');
      const self = new Map(), dt = new Map();
      profile.samples.forEach((id, k) => dt.set(id, (dt.get(id) || 0) + (profile.timeDeltas[k] || 0)));
      for (const nd of profile.nodes) { const f = nd.callFrame; const key = `${f.functionName || '(anon)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}`; self.set(key, (self.get(key) || 0) + (dt.get(nd.id) || 0)); }
      console.log(`  ${name}: top self time (ms, throttled)`);
      for (const [k, v] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`    ${(v / 1000).toFixed(0).padStart(6)}  ${k}`);
    }
    const p = await page.evaluate(() => { window.__probe.on = false; return window.__probe; });
    const m1 = await met(); const d = k => Math.round(((m1[k] || 0) - (m0[k] || 0)) * 1000);
    const row = { run, step: name, pairs, before: n0, after: await count(), script: d('ScriptDuration'), style: d('RecalcStyleDuration'), layout: d('LayoutDuration'), worstLoaf: Math.max(0, ...p.loaf), worstGap: Math.round(Math.max(0, ...p.gaps)) };
    rows.push(row); console.log(JSON.stringify(row));
    if (DIFF) { const h1 = await hist(); console.log('  added:', Object.keys({ ...h0, ...h1 }).map(k => [k, (h1[k] || 0) - (h0[k] || 0)]).filter(([, d]) => d).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 30).map(([k, d]) => `${k} ${d > 0 ? '+' : ''}${d}`).join(', ')); }
  };
  const press = async id => {
    await page.locator(`[data-option=${JSON.stringify(id)}]:not([disabled])`).first().click();
    const place = page.getByRole('button', { name: 'Place here', exact: true });
    if (await place.isVisible().catch(() => false)) await place.click();
  };
  if (CONTROL) { await step('control: place on Gather', () => press(`slot:${slot('red', 'turnout')}`), '.app.game[data-phase="buy"]'); await ctx.close(); continue; }
  await step('open Promote', () => press(`slot:${slot('red', 'hireup')}`), '.gift-card[data-gift="trade"]');
  if (SHOT) { await page.locator('.gift-card').screenshot({ path: `${SHOT}-open.png` }); }
  await step('pick a member', () => page.locator('.gift-card .gc-row[data-row="1"] button.gc-member:not([disabled])').first().click(), '.gift-card[data-step="2"]');
  if (SHOT) { await page.locator('.gift-card').screenshot({ path: `${SHOT}-picked.png` }); }
  if (errs.length) console.log('errors:', errs.join('; '));
  await ctx.close();
}
await browser.close();
const med = (k, s) => { const v = rows.filter(r => r.step === s).map(r => r[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
for (const s of CONTROL ? ['control: place on Gather'] : ['open Promote', 'pick a member']) console.log(`${s}: elements ${med('before', s)} -> ${med('after', s)}, worst frame (median of ${RUNS}) ${med('worstLoaf', s)} ms LoAF, ${med('worstGap', s)} ms rAF gap`);
