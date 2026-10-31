import { browserPath, launchBrowser } from '../e2e/v4/lib/browser.mjs';
// Frame probe: how smooth the shows are, early and late in a game, at 4x CPU (a mid laptop).
//   node scripts/v4-frames.mjs <url> <label> [--cpu=4] [--secs=40] [--late=III] [--speed=relaxed] [--out=design/eval/perf]
// Four Normal bots play on this device (no one to wait for). "early" watches round I from the start; "late" fast-forwards
// (?botDelay, unthrottled) to the start of round <late>, then resumes that save at the viewer's speed and watches.
// Every frame's gap is recorded with the animations running at the time (sampled 10x a second), so each show gets its
// own frame numbers: p50/p95 gap, the worst frame, and the share of frames over 33 ms (a visible hitch at 60 Hz).
// Also: the page's element count, Chromium's own split of main-thread time (script, style, layout) and long frames
// with the scripts that ran in them. Writes <out>/<label>.md and .json.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const pos = argv.filter(a => !a.startsWith('--'));
const flag = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const [base, label] = pos;
if (!base || !label) { console.error('usage: node scripts/v4-frames.mjs <url> <label> [--cpu=4] [--secs=40] [--late=III]'); process.exit(2); }
const CPU = Number(flag('cpu', 4)), SECS = Number(flag('secs', 40)), LATE = flag('late', 'III'), SPEED = flag('speed', 'relaxed');
const OUT = flag('out', 'design/eval/perf');
const PHASES = (flag('phases', 'early,late')).split(',');
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const url = q => `${base.replace(/\/$/, '')}/?intro=0&sound=off${q ? `&${q}` : ''}`;

// in the page: every frame's gap, tagged with what's animating (sampled every 100 ms), plus long animation frames
const RECORDER = () => {
  const F = (window.__frames = { on: false, frames: [], samples: [], loaf: [] });
  const name = a => {
    const el = a.effect && a.effect.target;
    const what = a.animationName || a.transitionProperty || (a.id) || 'js';
    if (!el || !el.tagName) return what;
    const c = (typeof el.className === 'string' ? el.className : el.className?.baseVal || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    return `${el.tagName.toLowerCase()}${c ? '.' + c : ''}:${what}`;
  };
  let last = 0, lastSample = 0, cur = [];
  const tick = t => {
    if (F.on) {
      if (t - lastSample > 100) {
        lastSample = t;
        try { cur = [...new Set(document.getAnimations().filter(a => a.playState === 'running').map(name))]; } catch { cur = []; }
        F.samples.push({ t, n: document.getElementsByTagName('*').length, a: cur });
      }
      if (last) F.frames.push([Math.round(t), Math.round((t - last) * 10) / 10, F.samples.length - 1]);
    }
    last = t;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  try {
    new PerformanceObserver(l => { if (!F.on) return; for (const e of l.getEntries()) F.loaf.push({ t: Math.round(e.startTime), d: Math.round(e.duration), block: Math.round(e.blockingDuration || 0), style: Math.round(e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0), scripts: (e.scripts || []).slice(0, 4).map(s => ({ d: Math.round(s.duration), f: (s.sourceFunctionName || s.invoker || '').slice(0, 60), src: (s.sourceURL || '').split('/').pop() + ':' + (s.sourceCharPosition ?? '') })) }); }).observe({ type: 'long-animation-frame', buffered: false });
  } catch { /* no LoAF */ }
};

const browser = await launchBrowser({ executablePath: browserPath });
const metrics = async cdp => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));

async function startAllBots(page, q) {
  await page.goto(url(q));
  await page.click('[data-home="local"]');
  await page.waitForSelector('[data-start]');
  for (const k of [0]) await page.locator(`[data-seat-row="${k}"] .seg button`, { hasText: 'Bot' }).click();
  await page.click('[data-start]');
  await page.waitForSelector('.app.game');
}
async function resume(page) {
  await page.waitForSelector('[data-home="resume"], .app.game');
  if (await page.$('[data-home="resume"]')) await page.click('[data-home="resume"]');
  await page.waitForSelector('.app.game');
}
const counters = async cdp => { await cdp.send('HeapProfiler.collectGarbage'); const c = await cdp.send('Memory.getDOMCounters'); const h = await cdp.send('Runtime.getHeapUsage'); return { nodes: c.nodes, listeners: c.jsEventListeners, docs: c.documents, heapMB: Math.round(h.usedSize / 1e5) / 10 }; };
const roundOf = page => page.evaluate(() => (document.querySelector('.hub-label b')?.textContent || '').trim());
const dismiss = page => page.evaluate(() => { const b = document.querySelector('[data-next-round]'); const btn = b && (b.matches('button') ? b : b.querySelector('button')); if (btn) btn.click(); return !!b; });

async function watch(page, cdp, secs) {
  await page.evaluate(() => { window.__frames.on = true; });
  const m0 = await metrics(cdp);
  const end = Date.now() + secs * 1000;
  while (Date.now() < end) { await dismiss(page).catch(() => {}); if (await page.$('.results')) break; await sleep(500); }
  const m1 = await metrics(cdp);
  const F = await page.evaluate(() => { window.__frames.on = false; return window.__frames; });
  const d = k => Math.round(((m1[k] || 0) - (m0[k] || 0)) * 1000);
  return { F, split: { script: d('ScriptDuration'), style: d('RecalcStyleDuration'), layout: d('LayoutDuration'), task: d('TaskDuration'), wall: secs * 1000 }, round: await roundOf(page) };
}

const pct = (xs, p) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
function summarise(F) {
  const by = new Map();
  const add = (k, g) => { if (!by.has(k)) by.set(k, []); by.get(k).push(g); };
  for (const [, g, si] of F.frames) {
    const s = F.samples[si];
    const anims = s ? s.a : [];
    add('(all frames)', g);
    if (!anims.length) add('(nothing animating)', g);
    // group by the element kind and animation, not every instance
    for (const a of new Set(anims)) add(a, g);
  }
  const rows = [...by].map(([k, gs]) => ({ k, n: gs.length, p50: pct(gs, 0.5), p95: pct(gs, 0.95), max: Math.max(...gs), hitch: Math.round(100 * gs.filter(g => g > 33.4).length / gs.length) }));
  rows.sort((a, b) => (a.k.startsWith('(') ? -1 : b.k.startsWith('(') ? 1 : b.n * b.hitch - a.n * a.hitch));
  const nodes = F.samples.map(s => s.n);
  const loaf = [...F.loaf].sort((a, b) => b.d - a.d).slice(0, 12);
  const fns = new Map();
  for (const l of F.loaf) for (const s of l.scripts) fns.set(s.f || s.src, (fns.get(s.f || s.src) || 0) + s.d);
  return { rows, nodes: { min: Math.min(...nodes), max: Math.max(...nodes) }, loaf, loafTotal: F.loaf.reduce((a, l) => a + l.d, 0), loafCount: F.loaf.length, topScripts: [...fns].sort((a, b) => b[1] - a[1]).slice(0, 12) };
}

const report = { label, cpu: CPU, secs: SECS, speed: SPEED, phases: {} };
for (const phase of PHASES) {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  // not on the idle phase: the recorder's rAF loop turns every frame into a main-thread frame, which restyles every
  // running animation each frame, so an idle table would look busy only because it's being watched
  if (phase !== 'idle') await ctx.addInitScript(RECORDER);
  await ctx.addInitScript(s => { try { localStorage.setItem('patrons.v4.motionSpeed', s); } catch { /* */ } }, SPEED);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  if (phase === 'idle') {
    // P1 is a person (first sensible option each turn), three bots, fast. On each of P1's turns the table waits: measure
    // what the idle page costs for 3 s (CPU x) and what it holds. At round LATE, reload on the same turn and measure again.
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable');
    await page.goto(url('botDelay=20'));
    await page.click('[data-home="local"]');
    await page.waitForSelector('[data-start]');
    await page.click('[data-start]');
    await page.waitForSelector('.app.game');
    const idle = async () => {
      await sleep(2500); // the turn's chain settles
      if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
      const m0 = await metrics(cdp); await sleep(3000); const m1 = await metrics(cdp);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const d = k => Math.round(((m1[k] || 0) - (m0[k] || 0)) * 1000);
      return { busyPct: Math.round(d('TaskDuration') / 30), script: d('ScriptDuration'), style: d('RecalcStyleDuration'), layout: d('LayoutDuration'), anims: await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), timers: await page.evaluate(() => window.__timers || 0), ...(await counters(cdp)) };
    };
    const rows = [];
    const t0 = Date.now();
    let lastSampled = -1, reloaded = false;
    while (!(await page.$('.results')) && Date.now() - t0 < 12 * 60 * 1000) {
      const hand = await page.$('[data-handoff]'); if (hand) { await hand.click().catch(() => {}); continue; }
      if (await dismiss(page).catch(() => false)) { await sleep(300); continue; }
      const g = await page.evaluate(() => { const e = document.querySelector('.app.game'); return e ? { yours: e.dataset.yours === '1', moves: Number(e.dataset.moves), phase: e.dataset.phase } : null; }).catch(() => null);
      const ids = await page.$$eval('[data-option]:not([disabled])', els => els.map(e => e.getAttribute('data-option'))).catch(() => []);
      if (!g || !ids.length) { await sleep(60); continue; }
      if (g.yours && g.moves !== lastSampled && g.phase && /place/.test(g.phase) && ids.some(i => /^space:|^slot:/.test(i) || true)) {
        lastSampled = g.moves;
        const r = await roundOf(page);
        rows.push({ moves: g.moves, round: r, ...(await idle()) });
        console.log(JSON.stringify(rows.at(-1)));
        if (r === LATE && !reloaded) {
          reloaded = true;
          const hist = () => page.evaluate(() => { const m = {}; for (const e of document.querySelectorAll('*')) { const c = (typeof e.className === 'string' ? e.className : e.className?.baseVal || '').trim().split(/\s+/)[0]; const k = e.tagName.toLowerCase() + (c ? '.' + c : ''); m[k] = (m[k] || 0) + 1; } return m; });
          const h0 = await hist();
          const snap = async file => {
            const { createWriteStream } = await import('node:fs');
            const out = createWriteStream(file);
            const on = c => out.write(c.chunk);
            cdp.on('HeapProfiler.addHeapSnapshotChunk', on);
            await cdp.send('HeapProfiler.collectGarbage');
            await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
            cdp.off('HeapProfiler.addHeapSnapshotChunk', on);
            await new Promise(r => out.end(r));
          };
          if (flag('snapshot', '')) await snap(flag('snapshot', ''));
          await page.reload(); await resume(page); await sleep(2500);
          const h1 = await hist();
          if (flag('snapshot', '')) await snap(flag('snapshot', '') + '.after');
          report.domDiff = Object.keys({ ...h0, ...h1 }).map(k => [k, (h0[k] || 0) - (h1[k] || 0)]).filter(([, d]) => d).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 40);
          console.log('DOMDIFF', JSON.stringify(report.domDiff));
          rows.push({ moves: 'reload', round: r, ...(await idle()) });
          console.log(JSON.stringify(rows.at(-1)));
          // experiments on the same turn: what the idle cost is made of
          const css = async (tag, text) => { await page.addStyleTag({ content: text }); rows.push({ moves: tag, round: r, ...(await idle()) }); console.log(JSON.stringify(rows.at(-1))); };
          await css('no infinite idle loops', '.lt-ring .lead .leader,.leader .blink,.cs-member .fig .sprite,.cs-min,.lt-cult-seat .cs-leader .lead,.dots{animation:none!important}');
          await css('no animations at all', '*,*::before,*::after{animation:none!important;transition:none!important}');
          break;
        }
      }
      const rank = id => (/^card:/.test(id) ? 0 : /^pay:/.test(id) ? 0 : /^tier:/.test(id) ? 1 : /^(back|undo|pass|@unpick)/.test(id) ? 9 : /^@pick/.test(id) ? 3 : 2);
      ids.sort((a, b) => rank(a) - rank(b));
      const id = ids.find(i => rank(i) < 9) || ids.find(i => !/^(back|undo|@unpick)/.test(i));
      if (!id) { await sleep(60); continue; }
      await page.locator(`[data-option="${id}"]`).first().click({ timeout: 2000 }).catch(() => {});
    }
    report.idle = rows;
    await ctx.close();
    continue;
  }
  if (phase === 'leak') {
    // one unbroken game, fast, sampling what the page holds after a GC; then the same spot measured twice at CPU x:
    // straight on, and after a reload (a reload drops anything leaked)
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable');
    await startAllBots(page, 'botDelay=20');
    const growth = [];
    const t0 = Date.now();
    let lastMoves = -1;
    while ((await roundOf(page)) !== LATE && Date.now() - t0 < 8 * 60 * 1000) {
      await dismiss(page).catch(() => {});
      const moves = await page.evaluate(() => Number(document.querySelector('.app.game')?.dataset.moves || 0)).catch(() => 0);
      if (moves - lastMoves >= 10) { lastMoves = moves; growth.push({ moves, round: await roundOf(page), anims: await page.evaluate(() => document.getAnimations().length), ...(await counters(cdp)) }); }
      await sleep(400);
    }
    growth.push({ moves: 'R' + LATE, anims: await page.evaluate(() => document.getAnimations().length), ...(await counters(cdp)) });
    if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    const straight = await watch(page, cdp, SECS);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await page.reload();
    await resume(page);
    await sleep(1500);
    const fresh = await counters(cdp);
    if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    const reloaded = await watch(page, cdp, SECS);
    report.growth = growth; report.freshAfterReload = fresh;
    report.phases['late, unbroken game'] = { ...straight, errors: [...errs], sum: summarise(straight.F) };
    report.phases['late, after a reload'] = { ...reloaded, errors: [], sum: summarise(reloaded.F) };
    await ctx.close();
    continue;
  }
  if (phase === 'late') {
    await startAllBots(page, 'botDelay=20');
    const t0 = Date.now();
    while ((await roundOf(page)) !== LATE && Date.now() - t0 < 6 * 60 * 1000) { await dismiss(page).catch(() => {}); await sleep(300); }
    await page.goto(url('trace=0'));
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable');
    if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    await resume(page);
    await sleep(1500);
    report.phases[phase] = await watch(page, cdp, SECS);
  } else {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable');
    if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    await startAllBots(page, '');
    await sleep(1500);
    report.phases[phase] = await watch(page, cdp, SECS);
  }
  report.phases[phase].errors = errs;
  report.phases[phase].sum = summarise(report.phases[phase].F);
  await ctx.close();
}
await browser.close();

if (report.idle) {
  const L = ['# Idle cost through one game: ' + label, '', `On P1's turns, the table waiting; ${CPU}x CPU, 3 s each.`, '', '| moves | round | busy % | script | style | layout | running animations | elements | listeners | heap MB |', '|---|---|---|---|---|---|---|---|---|---|'];
  for (const r of report.idle) L.push(`| ${r.moves} | ${r.round} | ${r.busyPct} | ${r.script} | ${r.style} | ${r.layout} | ${r.anims} | ${r.nodes} | ${r.listeners} | ${r.heapMB} |`);
  writeFileSync(`${OUT}/${label}.md`, L.join('\n')); writeFileSync(`${OUT}/${label}.json`, JSON.stringify(report, null, 1)); console.log(L.join('\n'));
  process.exit(0);
}
const lines = [`# Frames: ${label}`, '', `${CPU}x CPU, 1270x700, four Normal bots, ${SPEED}, ${SECS}s watched per phase. Gaps in ms (16.7 = smooth 60 fps); hitch = share of frames over 33 ms.`, ''];
if (report.growth) {
  lines.push('## What the page holds as one game goes on (after a GC)', '', '| moves | round | elements | listeners | heap MB | animations |', '|---|---|---|---|---|---|');
  for (const g of report.growth) lines.push(`| ${g.moves} | ${g.round || ''} | ${g.nodes} | ${g.listeners} | ${g.heapMB} | ${g.anims} |`);
  const f = report.freshAfterReload;
  lines.push(`| after reload | | ${f.nodes} | ${f.listeners} | ${f.heapMB} | |`, '');
}
for (const [phase, r] of Object.entries(report.phases)) {
  const s = r.sum;
  lines.push(`## ${phase} (ended in round ${r.round})`, '', `Elements ${s.nodes.min} to ${s.nodes.max}. Main thread over ${r.split.wall} ms: task ${r.split.task}, script ${r.split.script}, style ${r.split.style}, layout ${r.split.layout}. Long frames: ${s.loafCount}, ${s.loafTotal} ms.`, '');
  lines.push('| animating | frames | p50 | p95 | worst | hitch % |', '|---|---|---|---|---|---|');
  for (const x of s.rows.slice(0, 30)) lines.push(`| ${x.k} | ${x.n} | ${x.p50} | ${x.p95} | ${Math.round(x.max)} | ${x.hitch} |`);
  lines.push('', 'Scripts in long frames (ms total):', ...s.topScripts.map(([f, ms]) => `- ${f}: ${ms}`), '');
  lines.push('Worst frames:', ...s.loaf.slice(0, 8).map(l => `- ${l.d} ms (style+layout ${l.style}) ${l.scripts.map(x => `${x.f || x.src} ${x.d}`).join(', ')}`), '');
  if (r.errors.length) lines.push('Errors:', ...r.errors.map(e => `- ${e}`), '');
  delete r.F;
}
writeFileSync(`${OUT}/${label}.md`, lines.join('\n'));
writeFileSync(`${OUT}/${label}.json`, JSON.stringify(report, null, 1));
console.log(lines.join('\n'));
