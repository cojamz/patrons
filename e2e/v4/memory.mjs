import { browserPath } from './lib/browser.mjs';
// E2E: page memory over a full hot-seat game (1 person + 3 bots, first-pick clicks; laptop viewport).
// Reviewers' Chromium tabs crashed ("Target crashed") on a box near its RAM limit: this proves whether the page
// itself grows. Every ~20 game moves (and at each round end, and the results) it forces a GC and reads Chrome's own
// counters over CDP (Performance.getMetrics): JS heap used, DOM nodes, event listeners, documents.
// Fails when, after GC, the heap passes 300 MB or 3x its round-I level, or DOM nodes / listeners pass 3x their
// round-I level (growth without limit). Prints the curve; writes it as JSON to $V4_SHOTS/memory.json.
// The leak control (leak pass, 2026-10-28): on your first turn of round III it reloads the page on that same turn and
// measures again (a reload drops anything leaked). Fails when the unbroken page has more than 10% more elements in it
// or twice the heap of the reloaded one (a warm page's compiled code alone is ~1.7x), or when, after a GC on a settled
// table, more than LIVE_AT_CONTROL of the game states the session published are still alive (LIVE_MAX at any sample):
// the page should hold the one on screen and a few it keeps on purpose (undo, the round's start, the last turn stories,
// the shows still queued). Before the pass a round III table kept ~40, one per member figure, space and shop card.
// Chrome's own node count is printed but not gated: it also counts each sprite's image document, more of them the more
// members a game has shown.
// Server: $V4_URL (check:v4 sets it), else a vite dev server inside this process (dies with it).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { answerChoice } from './lib/answer.mjs';

const SHOTS = `${process.env.V4_SHOTS || '/tmp/patrons-shots/v4'}/memory`;
mkdirSync(SHOTS, { recursive: true });
const HEAP_MAX_MB = 300, GROWTH = 3, EVERY = 20;
const LEAK_ELEMENTS = 1.1, LEAK_HEAP = 2, LIVE_AT_CONTROL = 24, LIVE_MAX = 40;

let base = process.env.V4_URL, dev = null;
if (!base) {
  const { createServer } = await import('vite');
  dev = await createServer({ server: { port: 0, strictPort: false }, logLevel: 'warn' });
  await dev.listen();
  base = dev.resolvedUrls.local[0].replace(/\/$/, '');
}

const fails = [];
const browser = await chromium.launch({ executablePath: browserPath });
const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
page.on('pageerror', e => fails.push(`pageerror: ${e.message}`));
page.on('crash', () => fails.push('the page crashed (Target crashed)'));
const cdp = await page.context().newCDPSession(page);
await cdp.send('Performance.enable');

const curve = [];
// where the game stands, from the engine's own record (round 0 is the setup picks)
const at = () => page.evaluate(() => { try { return JSON.parse(window.patronsRecord()).at || {}; } catch { return {}; } }).catch(() => ({}));
const moves = async () => (await at()).moves ?? 0;
async function sample(tag) {
  // a settled table: the shows still to play hold the states they show (the director's queue), which is no leak
  await page.locator('.app.game[data-animating]').first().waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
  await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
  // the states the collector let go are counted a task later (FinalizationRegistry): a beat, and once more
  await page.waitForTimeout(60);
  await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
  const states = await page.evaluate(() => (typeof window.patronsLiveStates === 'function' ? window.patronsLiveStates() : null)).catch(() => null);
  const { metrics } = await cdp.send('Performance.getMetrics');
  const m = Object.fromEntries(metrics.map(x => [x.name, x.value]));
  const where = await at();
  const inDoc = await page.evaluate(() => document.getElementsByTagName('*').length).catch(() => null);
  const row = { inDoc, tag, moves: where.moves ?? 0, round: where.over ? 'over' : where.round ?? '?', heapMB: +(m.JSHeapUsedSize / 2 ** 20).toFixed(1), totalMB: +(m.JSHeapTotalSize / 2 ** 20).toFixed(1), nodes: m.Nodes, listeners: m.JSEventListeners, documents: m.Documents, states };
  curve.push(row);
  return row;
}

const t0 = Date.now();
try {
  await page.goto(`${base}/?botDelay=20&intro=0`);
  await page.click('[data-home="local"]');
  await page.waitForSelector('[data-start]');
  await page.click('[data-start]');
  // the setup draft (an artifact or a resource) can stop for the player before round I starts: take the first pick
  for (const until = Date.now() + 15000; !(await page.locator('header .round').count()) && Date.now() < until;) {
    if (await page.locator('[data-handoff]').count()) await page.locator('[data-handoff]').first().click().catch(() => {});
    else await page.locator('[data-option]:not([disabled])').first().click({ timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(150);
  }
  await page.waitForSelector('header .round', { timeout: 15000 });
  await sample('start');
  let next = EVERY, lastMoves = -1, movedAt = Date.now(), leakChecked = false;
  const seenEnds = new Set();
  while (!(await page.$('.results')) && Date.now() - t0 < 420000) {
    // a stall fails fast with what was on screen, instead of running out the clock
    if (Date.now() - movedAt > 45000) {
      const prompt = await page.$eval('.lt-prompt', e => e.textContent.slice(0, 120)).catch(() => '?');
      const ids = await page.$$eval('[data-option]:not([disabled])', els => els.map(e => e.getAttribute('data-option'))).catch(() => []);
      mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: `${SHOTS}/stalled.png` }).catch(() => {});
      fails.push(`no move for 45s at move ${lastMoves}: "${prompt}" options [${ids.join(' ')}] (${SHOTS}/stalled.png)`);
      break;
    }
    // no element handles held across steps (a handle pins its element, and a removed one its whole old tree: this gate
    // measures DOM nodes): locators here, and the answer helper lets its handles go
    if (await page.locator('[data-handoff]').count()) { await page.locator('[data-handoff]').first().click().catch(() => {}); continue; }
    // the leak control: your first settled turn of round III, measured straight on and again after a reload
    if (!leakChecked && (await at()).round === 3 && (await page.locator('.app.game[data-yours="1"][data-phase="place"]:not([data-animating])').count())) {
      leakChecked = true;
      await page.waitForTimeout(1500);
      await sample('round III, unbroken');
      await page.reload();
      await page.locator('[data-home="resume"], .app.game').first().waitFor({ timeout: 15000 });
      if (await page.locator('[data-home="resume"]').count()) await page.locator('[data-home="resume"]').first().click();
      await page.locator('.app.game').first().waitFor({ timeout: 15000 });
      await page.waitForTimeout(2500);
      await sample('round III, reloaded');
      movedAt = Date.now();
      continue;
    }
    const end = (await page.locator('[data-next-round]').count()) ? page.locator('[data-next-round]').first() : null;
    if (end) {
      const r = await page.$eval('.roundend h2', e => e.textContent).catch(() => 'round end');
      if (!seenEnds.has(r)) { seenEnds.add(r); await sample(`end of ${r}`); }
      await end.click().catch(() => {});
      continue;
    }
    // prefer recruiting (cults with members are the heavier screen), then followers, Pass last; never back/undo or a
    // member's on/off switch (a free toggle: flipping it forever would stall the game). lib/answer.mjs answers board
    // picks, pairs and the pay sheet; a hover card over the target gets a plain DOM click.
    await answerChoice(page, { prefer: [/^(card|pay):/, /^tier:/], last: [/^pass$/], avoid: [/^undo/], domFallback: true }).then(did => (did ? null : page.waitForTimeout(40)));
    const n = await moves();
    if (n !== lastMoves) { lastMoves = n; movedAt = Date.now(); }
    if (n >= next) { await sample(`move ${n}`); next = n - (n % EVERY) + EVERY; }
  }
  if (!(await page.$('.results'))) fails.push(`no results screen after ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await page.waitForTimeout(1500);
  await sample('results');
} catch (err) {
  fails.push(`run: ${err.message}`);
}

// the curve, then the bounds
console.log('memory over a full hot-seat game (after GC):');
console.log('  tag                 round      moves   heap MB  nodes  listeners  docs  states  in page');
for (const r of curve) console.log(`  ${r.tag.padEnd(19)} ${String(r.round).padEnd(10)} ${String(r.moves).padStart(5)}  ${String(r.heapMB).padStart(7)}  ${String(r.nodes).padStart(5)}  ${String(r.listeners).padStart(9)}  ${String(r.documents).padStart(4)}  ${String(r.states ?? '?').padStart(6)}  ${String(r.inDoc ?? '?').padStart(7)}`);
// (another run's hotseat e2e may have wiped the shared shots folder meanwhile)
try { mkdirSync(SHOTS, { recursive: true }); writeFileSync(`${SHOTS}/memory.json`, JSON.stringify(curve, null, 1)); } catch (err) { console.log(`couldn't save the curve: ${err.message}`); }
const r1 = curve.filter(r => r.round === 1);
const base1 = r1.length ? r1 : curve.slice(0, 2);
const top = k => Math.max(...base1.map(r => r[k]));
if (curve.length < 4) fails.push(`only ${curve.length} samples: the game did not get far enough to measure`);
else {
  const peak = k => curve.reduce((a, r) => (r[k] > a[k] ? r : a), curve[0]);
  const h = peak('heapMB'), nd = peak('nodes'), ls = peak('listeners');
  if (h.heapMB > HEAP_MAX_MB) fails.push(`JS heap reached ${h.heapMB} MB (${h.tag}), over ${HEAP_MAX_MB} MB`);
  if (h.heapMB > GROWTH * top('heapMB')) fails.push(`JS heap grew to ${h.heapMB} MB (${h.tag}), over ${GROWTH}x its round-I level of ${top('heapMB')} MB`);
  if (nd.nodes > GROWTH * top('nodes')) fails.push(`DOM nodes grew to ${nd.nodes} (${nd.tag}), over ${GROWTH}x their round-I level of ${top('nodes')}`);
  if (ls.listeners > GROWTH * top('listeners')) fails.push(`event listeners grew to ${ls.listeners} (${ls.tag}), over ${GROWTH}x their round-I level of ${top('listeners')}`);
  const un = curve.find(r => r.tag === 'round III, unbroken'), re = curve.find(r => r.tag === 'round III, reloaded');
  if (!un || !re) fails.push('the leak control never ran (no settled turn of yours in round III)');
  else {
    if (un.inDoc > LEAK_ELEMENTS * re.inDoc) fails.push(`leak: the unbroken game has ${un.inDoc} elements on the page, over ${LEAK_ELEMENTS}x the ${re.inDoc} of a reload on the same turn`);
    if (un.states > LIVE_AT_CONTROL) fails.push(`leak: ${un.states} game states alive after a GC on round III's settled table, over ${LIVE_AT_CONTROL}`);
    if (un.heapMB > LEAK_HEAP * re.heapMB) fails.push(`leak: the unbroken game's heap is ${un.heapMB} MB, over ${LEAK_HEAP}x the ${re.heapMB} MB of a reload on the same turn`);
    console.log(`leak control (round III): ${un.states} live states; elements ${un.inDoc} vs ${re.inDoc} after a reload (${(un.inDoc / re.inDoc).toFixed(2)}x), nodes ${un.nodes} vs ${re.nodes} (${(un.nodes / re.nodes).toFixed(2)}x), heap ${un.heapMB} vs ${re.heapMB} MB (${(un.heapMB / re.heapMB).toFixed(2)}x)`);
  }
  const live = curve.filter(r => r.states != null);
  if (!live.length) fails.push('no live-state count (window.patronsLiveStates missing)');
  const most = live.reduce((a, r) => (!a || r.states > a.states ? r : a), null);
  if (most && most.states > LIVE_MAX) fails.push(`${most.states} game states still alive after a GC (${most.tag}), over ${LIVE_MAX}: something keeps old states (a closure made in a render, a cache keyed by state)`);
  console.log(`round-I level: heap ${top('heapMB')} MB, ${top('nodes')} nodes, ${top('listeners')} listeners · peak: heap ${h.heapMB} MB (${h.tag}), ${nd.nodes} nodes (${nd.tag}), ${ls.listeners} listeners (${ls.tag})`);
}

await browser.close();
if (dev) await dev.close();
if (fails.length) { console.error(`\nMEMORY E2E FAILED (${fails.length}):\n  ${fails.join('\n  ')}`); process.exit(1); }
console.log(`\nmemory e2e passed in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
