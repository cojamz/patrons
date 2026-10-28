import { browserPath, launchBrowser } from '../e2e/v4/lib/browser.mjs';
// Snappiness harness: plays a scripted, human-paced game with the ?trace=1 tracer on (src/v4/perf.js) and writes
// design/eval/perf/<label>.md plus <label>.json.
//   node scripts/v4-perf.mjs <url> <label> [--cpu=4] [--online] [--lag=MS] [--seed=N] [--think=MS] [--turns=N] [--query=a=b&c=d]
// Chromium (/opt/pw-browsers/chromium) at 1270×700 with CDP CPU throttling (default 4×, a mid laptop). One person and
// three Normal bots at normal speed (local), or with --online two people over the RTDB emulator (host + guest, two
// bots), each with their own browser context. The person hovers spaces, a rival's chair, shop cards and a rim;
// spins the wheel (arrow keys and a drag); places; recruits, buys followers or passes; pays; plays through round I's
// end (the Reckoning, the round card) and N turns into round II. Math.random is seeded in the page, so the same
// seed plays the same game. Each run records the load average before and after (this box is shared).
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:net';
import { homedir, loadavg, cpus } from 'node:os';
import { HOVER_DELAY_MS } from '../src/v4/game/hoverDelay.js';

const argv = process.argv.slice(2);
const pos = argv.filter(a => !a.startsWith('--'));
const flag = (name, dflt) => { const a = argv.find(x => x === `--${name}` || x.startsWith(`--${name}=`)); if (!a) return dflt; return a.includes('=') ? a.slice(a.indexOf('=') + 1) : true; };
const [base, label] = pos;
if (!base || !label) { console.error('usage: node scripts/v4-perf.mjs <url> <label> [--cpu=4] [--online] [--lag=MS] [--seed=N] [--think=MS] [--turns=N]'); process.exit(2); }
const CPU = Number(flag('cpu', 4));
const ONLINE = !!flag('online', false);
const LAG = Number(flag('lag', 0));
const SEED = Number(flag('seed', 20261015));
const THINK = Number(flag('think', 650)); // a person's beat before acting (the same every run)
const TURNS_R2 = Number(flag('turns', 2)); // turns played into round II after the round end
const MAX_TURNS = Number(flag('max-turns', 0)); // a smoke run: stop after this many placements each (0: play to round II)
const EXTRA = String(flag('query', '') || '');
const OUT = String(flag('out', 'design/eval/perf'));
const VITE_LOG = flag('vitelog', '');
const CAP_MS = 9 * 60 * 1000;
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const load0 = loadavg();
const t0wall = Date.now();
const viteLines0 = VITE_LOG && existsSync(VITE_LOG) ? readFileSync(VITE_LOG, 'utf8').split('\n').length : 0;

// ---------- the RTDB emulator (as e2e/v4/online.mjs) ----------
const EMU_VERSION = '4.11.2', EMU_NS = 'cornycolonies-default-rtdb';
const freePort = () => new Promise((res, rej) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); }); s.on('error', rej); });
async function startEmulator() {
  if (process.env.V4_RTDB) return { host: process.env.V4_RTDB, stop() {} };
  if (spawnSync('java', ['-version'], { stdio: 'ignore' }).status !== 0) throw new Error('no java: the online run needs the RTDB emulator');
  const jar = process.env.V4_RTDB_JAR || `${homedir()}/.cache/patrons/firebase-database-emulator-v${EMU_VERSION}.jar`;
  if (!existsSync(jar)) throw new Error(`no emulator jar at ${jar} (run e2e/v4/online.mjs once to fetch it)`);
  const port = await freePort();
  const proc = spawn('java', ['-jar', jar, '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' });
  const stop = () => { try { proc.kill('SIGKILL'); } catch { /* gone */ } };
  process.on('exit', stop);
  const at = `http://127.0.0.1:${port}`;
  for (let k = 0; k < 120; k++) {
    await sleep(500);
    if (await fetch(`${at}/.json?ns=${EMU_NS}`).then(r => r.status < 500, () => false)) {
      const rules = readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8');
      if (await fetch(`${at}/.settings/rules.json?ns=${EMU_NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: rules }).then(r => r.ok, () => false)) return { host: `127.0.0.1:${port}`, stop };
    }
  }
  stop();
  throw new Error('the RTDB emulator did not start');
}

// ---------- the browser ----------
const browser = await launchBrowser({ executablePath: browserPath });
const errors = [];
async function openPerson(name, seed) {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  // the same seed plays the same game: a seeded Math.random in the page (seats, bots and emojis follow from it)
  await ctx.addInitScript(s => {
    let a = s >>> 0;
    Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }, seed);
  const page = await ctx.newPage();
  // a reload mid-run (Vite HMR on a tree someone is editing) wipes the tracer's buffer: count it and say so
  let loads = 0; // 'load' fires for full documents only (framenavigated also fires on App's history.pushState)
  page.on('load', () => { if (++loads > 1) errors.push(`${name}: the page reloaded mid-run (HMR?): numbers cover only what came after`); });
  page.on('pageerror', e => errors.push(`${name} pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${name} console: ${m.text().slice(0, 200)}`); });
  const cdp = await ctx.newCDPSession(page);
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  return { name, ctx, page, log: [], turns: 0, roundEnds: [], clicks: [], r2turns: 0, done: false };
}

// ---------- reading the table ----------
const readTable = page => page.evaluate(() => {
  const g = document.querySelector('.app.game');
  if (document.querySelector('.results')) return { phase: 'over' };
  if (document.querySelector('[data-next-round]')) return { phase: 'next-round' };
  if (!g) return { phase: 'none' };
  if (document.querySelector('[data-handoff]')) return { phase: 'handoff' };
  const round = (document.querySelector('.hub-label b')?.textContent || '').trim();
  return { phase: g.dataset.phase, yours: g.dataset.yours === '1', moves: Number(g.dataset.moves), round, reckoning: !!document.querySelector('.reckoning, [data-reckoning]') };
});
const center = async el => { const b = await el.boundingBox().catch(() => null); return b && b.width ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null; };
// dwell: how long the card is read once it's open (the hover delay comes on top: a card opens HOVER_DELAY_MS after the
// pointer rests)
async function hoverEl(p, el, dwell = 420) {
  const c = el && await center(el);
  if (!c) return false;
  await p.page.mouse.move(c.x, c.y, { steps: 5 });
  await sleep(dwell + HOVER_DELAY_MS);
  return true;
}
async function hoverSel(p, sel, n, dwell) {
  const els = await p.page.$$(sel);
  let k = 0;
  for (const el of els) { if (k >= n) break; if (await hoverEl(p, el, dwell)) k++; }
  return k;
}
// a click, then how long until the table shows a new state (the person's view of "it worked")
async function clickAndWait(p, el, what) {
  // what the person sees change: a new move, the round card opening or closing (dismissing it moves nothing when no one
  // has played behind it), or the answers on screen (a pair's first step lifts yours and lights theirs: @pick, no move)
  const look = () => ({
    moves: document.querySelector('.app.game')?.dataset.moves,
    card: !!document.querySelector('[data-next-round]'),
    ids: [...document.querySelectorAll('[data-option]')].map(e => e.getAttribute('data-option')).sort().join(' '),
  });
  const before = await p.page.evaluate(look).catch(() => null);
  const c = await center(el);
  if (!c) return false;
  const t = Date.now();
  await p.page.mouse.move(c.x, c.y, { steps: 3 });
  await p.page.mouse.click(c.x, c.y);
  let ms = null;
  try {
    await p.page.waitForFunction(b => {
      const moves = document.querySelector('.app.game')?.dataset.moves;
      const card = !!document.querySelector('[data-next-round]');
      const ids = [...document.querySelectorAll('[data-option]')].map(e => e.getAttribute('data-option')).sort().join(' ');
      return !b || (moves != null && moves !== b.moves) || card !== b.card || ids !== b.ids || !!document.querySelector('[data-place]');
    }, before, { timeout: 4000, polling: 'raf' });
    ms = Date.now() - t;
  } catch { /* nothing changed: an eaten click, or a step that opens a dialog */ }
  p.clicks.push({ what, ms });
  if (ms == null) {
    // say why on the page (the error line, the prompt) and stop after three dead clicks in a row: never a silent loop
    const why = await p.page.evaluate(() => [document.querySelector('.error')?.textContent, document.querySelector('[data-prompt]')?.textContent].filter(Boolean).join(' / ')).catch(() => '');
    p.dead = (p.dead || 0) + 1;
    errors.push(`${p.name}: ${what} click changed nothing${why ? ` (${why.slice(0, 120)})` : ''}`);
    if (p.dead >= 3) { await p.page.screenshot({ path: `${OUT}/${label}-${p.name}-stuck.png` }).catch(() => {}); p.done = true; errors.push(`${p.name}: three dead clicks in a row, stopped (screenshot ${label}-${p.name}-stuck.png)`); }
  } else p.dead = 0;
  return true;
}

// ---------- one person's turn, human-paced ----------
let spunRound = new Set();
async function spinWheel(p, round) {
  if (spunRound.has(`${p.name}:${round}`)) return;
  spunRound.add(`${p.name}:${round}`);
  const { page } = p;
  await page.mouse.move(640, 690); // off the board, so keys aren't swallowed by a focused control
  await page.keyboard.press('ArrowRight'); await sleep(800);
  await page.keyboard.press('ArrowLeft'); await sleep(800);
  // a drag on the paper between rings I and II, along a seam (no space under it), ~60° then release
  const st = await page.$('.lt-wheel .stage');
  const b = st && await st.boundingBox();
  if (!b) return;
  const vb = await st.evaluate(e => { const v = e.querySelector('svg.wheel-paper').viewBox.baseVal; return { x: v.x, w: v.width }; });
  const px = (x, y) => ({ x: b.x + (x - vb.x) / vb.w * b.width, y: b.y + (y - vb.x) / vb.w * b.height });
  const pt = deg => { const t = (deg - 90) * Math.PI / 180; return px(200 + 128 * Math.cos(t), 200 + 128 * Math.sin(t)); };
  const a0 = 225;
  const s = pt(a0);
  await page.mouse.move(s.x, s.y);
  await page.mouse.down();
  for (let k = 1; k <= 10; k++) { const q = pt(a0 + k * 6); await page.mouse.move(q.x, q.y); await sleep(24); }
  await page.mouse.up();
  await sleep(900);
  await page.keyboard.press('ArrowLeft'); await sleep(800); // back roughly where it was
}

async function takeTurn(p, tab) {
  const { page } = p;
  await sleep(THINK);
  const phase = tab.phase;
  if (phase === 'setup' || phase === 'choose') {
    const opt = await page.$('.prompt.choice [data-option]:not([disabled])');
    if (opt) await clickAndWait(p, opt, phase);
    return;
  }
  if (phase === 'pay') {
    const pay = await page.$('.dialog.pay .btn.pri[data-option]:not([disabled])') || await page.$('.dialog.pay [data-option]:not([disabled]):not([data-option="back"])');
    if (pay) await clickAndWait(p, pay, 'pay');
    return;
  }
  if (phase === 'place') {
    p.turns++;
    if (tab.round === 'II') p.r2turns++;
    // read the board the way a person does: a few spaces, a rival's chair, a card in the shop, a contest's rim
    await hoverSel(p, '.lt-wheel [data-slot][data-option]', 3, 420);
    await hoverSel(p, '.lt-wheel [data-slot].taken', 1, 380);
    await hoverSel(p, '.lt-seat-1 .cs-head, .lt-seat-2 .cs-head', 1, 420);
    await hoverSel(p, '.lt-shop .card[data-uid]', 2, 380);
    const rim = await page.$('.rim-layer [data-rim]');
    if (rim) { try { await rim.hover({ timeout: 800, force: true }); await sleep(420 + HOVER_DELAY_MS); } catch { /* fine */ } }
    // a member in a chair and a keyword's tip (Tip cards)
    await hoverSel(p, '.cs-member .fig', 1, 420);
    await hoverSel(p, '.lt [data-tip][role="button"]:not(.fig)', 1, 380);
    await spinWheel(p, tab.round);
    const legal = await page.$$('.lt-wheel [data-slot][data-option]');
    if (!legal.length) return;
    const el = legal[(p.turns * 2) % legal.length];
    await hoverEl(p, el, 250);
    await clickAndWait(p, el, 'place');
    // online (and touch) placing asks to confirm: "Place here"
    const confirm = await page.waitForSelector('[data-place]', { timeout: 600 }).catch(() => null);
    if (confirm) await clickAndWait(p, confirm, 'place-confirm');
    return;
  }
  if (phase === 'buy') {
    await hoverSel(p, '.lt-shop .card[data-uid]', 2, 380);
    const card = await page.$('.lt-shop .card[data-option]');
    const rates = await page.$$('.lt-rates [data-rate][data-option]');
    const rate = rates.length ? rates[rates.length - 1] : null;
    const pass = await page.$('[data-option="pass"]');
    const pick = card || rate || pass;
    if (pick) await clickAndWait(p, pick, card ? 'recruit' : rate ? 'followers' : 'pass');
    if (MAX_TURNS && p.turns >= MAX_TURNS) p.finishing = true; // a smoke run ends once this turn is through
    return;
  }
  // anything else on your turn: the first live option
  const any = await page.$('[data-option]:not([disabled]):not([data-option="back"])');
  if (any) await clickAndWait(p, any, phase || 'other');
}

async function play(p) {
  let roundEndAt = null, lastNotMine = Date.now();
  const tStart = Date.now();
  while (!p.done && Date.now() - tStart < CAP_MS) {
    const tab = await readTable(p.page).catch(() => ({ phase: 'none' }));
    if (tab.phase === 'over') break;
    if (tab.phase === 'next-round') {
      if (roundEndAt != null) { p.roundEnds.push({ reckonToCardMs: Date.now() - roundEndAt }); roundEndAt = null; }
      await sleep(THINK + 400); // read the round card
      const btn = await p.page.$('[data-next-round]');
      if (btn) await clickAndWait(p, btn, 'next-round');
      continue;
    }
    if (tab.reckoning && roundEndAt == null) roundEndAt = Date.now();
    if (tab.phase === 'handoff') { const h = await p.page.$('[data-handoff]'); if (h) await h.click().catch(() => {}); continue; }
    if (MAX_TURNS && p.turns >= MAX_TURNS && (tab.phase === 'place' || (p.finishing && !tab.yours))) { await sleep(2500); p.done = true; break; }
    if (!tab.yours) { await sleep(40); lastNotMine = Date.now(); continue; }
    if (tab.round === 'II' && p.r2turns >= TURNS_R2 && tab.phase === 'place') { p.done = true; break; }
    await takeTurn(p, tab);
    void lastNotMine;
  }
  p.done = true;
}

// ---------- the run ----------
const people = [];
let emu = null;
const q = s => `${s}${EXTRA ? `&${EXTRA}` : ''}`;
// a page whose main thread is stuck blocks Playwright's input calls forever: a watchdog ends the run and the report
// is written from whatever each page will still answer
const race = (pr, ms, fallback) => Promise.race([pr, sleep(ms).then(() => fallback)]);
const runAll = async () => {
try {
  if (!ONLINE) {
    const p = await openPerson('P1', SEED);
    people.push(p);
    await p.page.goto(`${base}/?${q('trace=1&intro=0')}`);
    await p.page.click('[data-home="local"]');
    await p.page.waitForSelector('[data-start]');
    await p.page.click('[data-start]');
    await p.page.waitForSelector('.app.game', { timeout: 30000 });
    await p.page.evaluate(() => window.__perf && window.__perf.mark('game-start'));
    await play(p);
  } else {
    emu = await startEmulator();
    const params = q(`rtdb=${emu.host}&trace=1&intro=0${LAG ? `&lag=${LAG}` : ''}`);
    const hana = await openPerson('host', SEED), gus = await openPerson('guest', SEED + 7);
    people.push(hana, gus);
    await hana.page.goto(`${base}/?${params}`);
    await hana.page.fill('input[placeholder="Name"]', 'Hana', { timeout: 90000 });
    await hana.page.click('text=Host online game');
    await hana.page.waitForSelector('.code', { timeout: 90000 });
    const code = await hana.page.$eval('.code', e => (/Room code (\S+?),/.exec(e.getAttribute('aria-label') || '') || [])[1] || e.textContent.trim());
    await gus.page.goto(`${base}/?${params}`);
    await gus.page.fill('input[placeholder="Name"]', 'Gus', { timeout: 90000 });
    await gus.page.fill('input[aria-label="Room code"]', code);
    await gus.page.click('text=Join with code');
    await gus.page.waitForSelector('.code', { timeout: 90000 });
    await hana.page.waitForFunction(() => document.querySelectorAll('.seats li').length === 2, null, { timeout: 20000 });
    for (let k = 0; k < 2; k++) { await hana.page.click('[data-add-bot]'); await sleep(600); }
    await hana.page.waitForFunction(() => document.querySelectorAll('.seats li').length === 4, null, { timeout: 20000 });
    await hana.page.click('text=Start game');
    await Promise.all(people.map(p => p.page.waitForSelector('.app.game', { timeout: 30000 })));
    await Promise.all(people.map(p => play(p)));
  }
} catch (err) {
  errors.push(`harness: ${err.message}`);
  console.error(err);
}
};
await race(runAll(), CAP_MS + 4 * 60 * 1000, 'watchdog').then(r => { if (r === 'watchdog') errors.push('watchdog: the run outlived its cap (a page stopped answering); reporting what the pages still give'); });

const load1 = loadavg();
const results = [];
for (const p of people) {
  const raw = await race(p.page.evaluate(() => (window.__perf ? { summary: window.__perf.summary(), entries: window.__perf.entries } : null)).catch(e => ({ error: e.message })), 20000, { error: 'the page did not answer in 20s' });
  results.push({ name: p.name, turns: p.turns, r2turns: p.r2turns, clicks: p.clicks, roundEnds: p.roundEnds, raw });
}
if (emu) emu.stop();
await race(browser.close(), 15000, null);
const viteHmr = VITE_LOG && existsSync(VITE_LOG) ? readFileSync(VITE_LOG, 'utf8').split('\n').slice(viteLines0).filter(l => /hmr update \/src|page reload src\//.test(l)).length : null;

const meta = { label, url: base, cpu: CPU, online: ONLINE, lag: LAG, seed: SEED, think: THINK, boxCpus: cpus().length, loadBefore: load0.map(x => +x.toFixed(2)), loadAfter: load1.map(x => +x.toFixed(2)), wallSec: Math.round((Date.now() - t0wall) / 1000), viteHmrDuringRun: viteHmr, errors: errors.slice(0, 20), at: new Date().toISOString() };
writeFileSync(`${OUT}/${label}.json`, JSON.stringify({ meta, results }, null, 1));

// ---------- the report ----------
const f = v => (v == null ? '–' : Math.round(v));
const L = [];
L.push(`# Perf run: ${label}`, '');
L.push(`${meta.at} · ${ONLINE ? `online (RTDB emulator, 2 people + 2 bots${LAG ? `, lag ${LAG}ms each way` : ''})` : 'local (1 person + 3 Normal bots, normal speed)'} · CPU ${CPU}× · seed ${SEED} · think ${THINK}ms · ${meta.wallSec}s wall`);
L.push(`Load average before ${meta.loadBefore.join(' / ')}, after ${meta.loadAfter.join(' / ')} (box: ${meta.boxCpus} CPUs). Vite HMR/reloads during the run: ${viteHmr ?? 'not watched'}.`);
if (errors.length) L.push('', `Errors: ${errors.slice(0, 5).join(' | ')}`);
for (const r of results) {
  const s = r.raw && r.raw.summary;
  L.push('', `## ${r.name}${ONLINE ? '' : ''}: ${r.turns} placements (${r.r2turns} in round II)`);
  if (!s) { L.push('', `No tracer data (${r.raw && r.raw.error ? r.raw.error : 'window.__perf missing'}).`); continue; }
  L.push('', '### Input → next paint (Event Timing; rAF fallback below 16ms)', '', `All: n ${s.inputToPaint.all.n}, p50 ${f(s.inputToPaint.all.p50)}ms, p95 ${f(s.inputToPaint.all.p95)}ms, max ${f(s.inputToPaint.all.max)}ms`, '');
  L.push('| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |', '|---|---|---|---|---|---|---|');
  for (const x of s.inputToPaint.byKind) L.push(`| ${x.kind} | ${x.n} | ${f(x.p50)} | ${f(x.p95)} | ${f(x.max)} | ${f(x.delay)} | ${f(x.proc)} |`);
  const hc = r.clicks.filter(c => c.ms != null);
  const byWhat = {};
  for (const c of r.clicks) (byWhat[c.what] ||= []).push(c.ms);
  L.push('', '### Click → new state on screen (harness, wall clock)', '', '| click | n | p50 | max | no change in 4s |', '|---|---|---|---|---|');
  for (const [w, xs] of Object.entries(byWhat)) { const ok = xs.filter(x => x != null).sort((a, b) => a - b); L.push(`| ${w} | ${xs.length} | ${f(ok[Math.floor((ok.length - 1) / 2)])} | ${f(ok[ok.length - 1])} | ${xs.length - ok.length} |`); }
  void hc;
  L.push('', `Clicks on a live option that changed nothing (tracer, 1.2s): ${s.clicks.eaten} of ${s.clicks.count}${s.clicks.eatenList.length ? ` (${s.clicks.eatenList.map(c => c.option || c.kind).join(', ')})` : ''}.`);
  L.push('', `### Hover open (from the end of the ${HOVER_DELAY_MS}ms hover delay → card on screen; content = "You'd get" filled; complete = its last change landed while it was still the card up; ·swap = a card already up swapping in place, no delay, timed from the arrival)`, '', '| target | n | p50 | p95 | max | content p95 | complete p95 | pointerover handler p95 |', '|---|---|---|---|---|---|---|---|');
  for (const x of s.hover.byKind) L.push(`| ${x.kind} | ${x.n} | ${f(x.p50)} | ${f(x.p95)} | ${f(x.max)} | ${f(x.content)} | ${f(x.settled)} | ${f(x.handler)} |`);
  L.push('', `Hovers whose card never showed (moved on first, or no card): ${s.hover.missed}.`);
  L.push('', '### Long animation frames', '', `LoAF: ${s.loaf.count} frames ≥50ms, ${s.loaf.over100} over 100ms, total blocking ${f(s.loaf.totalBlocking)}ms. Long tasks: ${s.longtasks.count}, ${f(s.longtasks.total)}ms total, max ${f(s.longtasks.max)}ms.`, '');
  L.push('| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |', '|---|---|---|---|---|');
  for (const l of s.loaf.top) L.push(`| ${l.t} | ${l.duration} | ${l.blockingDuration} | ${l.renderMs} | ${l.scripts.slice(0, 3).map(x => `${x.invoker || x.type} · ${x.fn || '?'} · ${x.src.split('/').slice(-2).join('/')}:${x.char ?? ''} · ${x.ms}${x.forcedLayoutMs ? ` (forced layout ${x.forcedLayoutMs})` : ''}`).join('<br>') || '(no script: style/layout/paint)'} |`);
  L.push('', '### React commits per component (dev build actualDuration, inclusive of children)', '', `Commits: ${s.react.commits}; whole-tree commit p50 ${f(s.react.commitTotal.p50)}ms, p95 ${f(s.react.commitTotal.p95)}ms, max ${f(s.react.commitTotal.max)}ms.`, '');
  L.push('| component | renders | p50 | p95 | max |', '|---|---|---|---|---|');
  for (const c of s.react.components.slice(0, 18)) L.push(`| ${c.component} | ${c.renders} | ${f(c.p50)} | ${f(c.p95)} | ${f(c.max)} |`);
  for (const pr of s.react.profiler) L.push('', `React.Profiler ${pr.id}: n ${pr.n}, p50 ${f(pr.p50)}ms, p95 ${f(pr.p95)}ms, max ${f(pr.max)}ms.`);
  L.push('', '### Wheel spins (rAF-driven: one React render of the Wheel per frame)', '');
  if (!s.spins.length) L.push('None seen.');
  else { L.push('| from° → to° | ms | frames | worst frame gap |', '|---|---|---|---|'); for (const sp of s.spins) L.push(`| ${f(sp.from)} → ${f(sp.to)} | ${f(sp.ms)} | ${sp.frames} | ${f(sp.maxGap)} |`); }
  L.push('', '### Animations and transitions (every one that ran)', '', '| animation | count | duration p50 | max | total ms | easing | loop |', '|---|---|---|---|---|---|---|');
  for (const a of s.animations.slice(0, 40)) L.push(`| ${a.anim} | ${a.count} | ${f(a.durationMs)} | ${f(a.maxMs)} | ${f(a.totalMs)} | ${a.easing} | ${a.loop ? 'yes' : ''} |`);
  L.push('', '### Waiting', '', `Your turn ends → your next turn painted: p50 ${f(s.waits.turnWait.p50)}ms, p95 ${f(s.waits.turnWait.p95)}ms, max ${f(s.waits.turnWait.max)}ms (n ${s.waits.turnWait.n}).`);
  L.push(`Still moving when your turn came (finite animations running, time left): p50 ${f(s.waits.settleAfterTurn.p50)}ms, max ${f(s.waits.settleAfterTurn.max)}ms.`);
  if (r.roundEnds.length) L.push(`Round end: the Reckoning until the round card's button: ${r.roundEnds.map(x => `${f(x.reckonToCardMs)}ms`).join(', ')}.`);
  L.push('', '### Bot pacing', '', `A bot's state → its move applied: p50 ${f(s.pacing.botSteps.p50)}ms, p95 ${f(s.pacing.botSteps.p95)}ms. Applied → shown on the table: p50 ${f(s.pacing.botToShown.p50)}ms, p95 ${f(s.pacing.botToShown.p95)}ms, max ${f(s.pacing.botToShown.max)}ms. Shown → painted p95 ${f(s.pacing.shownToPaint.p95)}ms. Gap between table steps: p50 ${f(s.pacing.shownGap.p50)}ms, p95 ${f(s.pacing.shownGap.p95)}ms.`);
  if (ONLINE) {
    L.push('', '### Online round trips (this person\'s moves)', '', `States received: ${s.online.states}. Sent → host applied p50 ${f(s.online.hostApplied.p50)}ms, p95 ${f(s.online.hostApplied.p95)}ms; → received p50 ${f(s.online.received.p50)}ms, p95 ${f(s.online.received.p95)}ms, max ${f(s.online.received.max)}ms; → painted p50 ${f(s.online.painted.p50)}ms, p95 ${f(s.online.painted.p95)}ms.`);
    const bytes = s.online.trips.map(t => t.bytes).filter(Boolean);
    if (bytes.length) L.push(`State snapshot size: ${Math.min(...bytes)}–${Math.max(...bytes)} bytes (the whole game state as JSON, every move).`);
  }
}
writeFileSync(`${OUT}/${label}.md`, L.join('\n') + '\n');
console.log(`wrote ${OUT}/${label}.md and .json (${meta.wallSec}s, load ${meta.loadBefore[0]} → ${meta.loadAfter[0]}, errors ${errors.length})`);
for (const r of results) { const s = r.raw && r.raw.summary; if (s) console.log(`${r.name}: in→paint p50 ${f(s.inputToPaint.all.p50)} p95 ${f(s.inputToPaint.all.p95)} · hover p50 ${f(s.hover.byKind.map(x => x.p50).sort((a, b) => b - a)[0])} · LoAF ${s.loaf.count} · turnWait p50 ${f(s.waits.turnWait.p50)} · spins ${s.spins.length}`); }
process.exit(0);
