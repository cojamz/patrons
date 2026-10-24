import { browserPath } from './lib/browser.mjs';
// E2E: page memory over a full hot-seat game (1 person + 3 bots, first-pick clicks; laptop viewport).
// Reviewers' Chromium tabs crashed ("Target crashed") on a box near its RAM limit: this proves whether the page
// itself grows. Every ~20 game moves (and at each round end, and the results) it forces a GC and reads Chrome's own
// counters over CDP (Performance.getMetrics): JS heap used, DOM nodes, event listeners, documents.
// Fails when, after GC, the heap passes 300 MB or 3x its round-I level, or DOM nodes / listeners pass 3x their
// round-I level (growth without limit). Prints the curve; writes it as JSON to $V4_SHOTS/memory.json.
// Server: $V4_URL (check:v4 sets it), else a vite dev server inside this process (dies with it).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { answerChoice } from './lib/answer.mjs';

const SHOTS = `${process.env.V4_SHOTS || '/tmp/patrons-shots/v4'}/memory`;
mkdirSync(SHOTS, { recursive: true });
const HEAP_MAX_MB = 300, GROWTH = 3, EVERY = 20;

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
  await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
  const { metrics } = await cdp.send('Performance.getMetrics');
  const m = Object.fromEntries(metrics.map(x => [x.name, x.value]));
  const where = await at();
  const row = { tag, moves: where.moves ?? 0, round: where.over ? 'over' : where.round ?? '?', heapMB: +(m.JSHeapUsedSize / 2 ** 20).toFixed(1), totalMB: +(m.JSHeapTotalSize / 2 ** 20).toFixed(1), nodes: m.Nodes, listeners: m.JSEventListeners, documents: m.Documents };
  curve.push(row);
  return row;
}

const t0 = Date.now();
try {
  await page.goto(`${base}/?botDelay=20&intro=0`);
  await page.click('[data-home="local"]');
  await page.waitForSelector('[data-start]');
  await page.click('[data-start]');
  await page.waitForSelector('header .round', { timeout: 15000 });
  await sample('start');
  let next = EVERY, lastMoves = -1, movedAt = Date.now();
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
console.log('  tag                 round      moves   heap MB  nodes  listeners  docs');
for (const r of curve) console.log(`  ${r.tag.padEnd(19)} ${String(r.round).padEnd(10)} ${String(r.moves).padStart(5)}  ${String(r.heapMB).padStart(7)}  ${String(r.nodes).padStart(5)}  ${String(r.listeners).padStart(9)}  ${String(r.documents).padStart(4)}`);
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
  console.log(`round-I level: heap ${top('heapMB')} MB, ${top('nodes')} nodes, ${top('listeners')} listeners · peak: heap ${h.heapMB} MB (${h.tag}), ${nd.nodes} nodes (${nd.tag}), ${ls.listeners} listeners (${ls.tag})`);
}

await browser.close();
if (dev) await dev.close();
if (fails.length) { console.error(`\nMEMORY E2E FAILED (${fails.length}):\n  ${fails.join('\n  ')}`); process.exit(1); }
console.log(`\nmemory e2e passed in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
