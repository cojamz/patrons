import { browserPath, launchBrowser } from '../e2e/v4/lib/browser.mjs';
// Hover leak probe: does pointing at things leave nodes behind? A local game (you + 3 bots) to your first turn, then
// rounds of hovers over the wheel's spaces, the shop's cards and the seats' members; after each round a forced GC and
// Chrome's own DOM counters (all nodes, attached or not) beside the live document's count.
//   node scripts/v4-hover-leak.mjs <url> [--rounds=3] [--play=N] [--snapshot=<file>]
// A node count that climbs while the document's stays flat is detached and retained: a leak.
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const base = (argv.find(a => !a.startsWith('--')) || 'http://localhost:5303').replace(/\/$/, '');
const ROUNDS = Number(flag('rounds', 3)), SNAP = flag('snapshot', '');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await launchBrowser({ executablePath: browserPath });
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
const cdp = await ctx.newCDPSession(page);
await page.goto(`${base}/?intro=0&sound=off&botDelay=20`);
await page.click('[data-home="local"]');
await page.waitForSelector('[data-start]');
await page.click('[data-start]');
await page.waitForSelector('.app.game[data-yours="1"]', { timeout: 60000 });
await sleep(2500);
const counters = async () => {
  await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage');
  const c = await cdp.send('Memory.getDOMCounters');
  const live = await page.evaluate(() => document.getElementsByTagName('*').length);
  const h = await cdp.send('Runtime.getHeapUsage');
  await sleep(50); await cdp.send("HeapProfiler.collectGarbage");
  const states = await page.evaluate(() => (window.patronsLiveStates ? window.patronsLiveStates() : null));
  return { nodes: c.nodes, live, listeners: c.jsEventListeners, heapMB: Math.round(h.usedSize / 1e5) / 10, states };
};
const hoverAll = async sel => {
  const boxes = await page.$$eval(sel, els => els.map(e => { const r = e.getBoundingClientRect(); return r.width && r.height ? [r.left + r.width / 2, r.top + r.height / 2] : null; }).filter(Boolean));
  for (const [x, y] of boxes.slice(0, 20)) { await page.mouse.move(x, y, { steps: 2 }); await sleep(260); await page.mouse.move(5, 690); await sleep(120); }
  return boxes.length;
};
const rows = [{ step: 'start', ...(await counters()) }];
console.log(JSON.stringify(rows[0]));
// --play=N: N of your turns played the perf rig's way (hover a space and a shop card, place, recruit or buy, pay),
// bots between; counters on each of your turns
const PLAY = Number(flag('play', 0));
// no element handles anywhere: a Playwright handle pins its node (and a removed node's whole tree) in the page until
// it's disposed, which reads exactly like a leak in the counters (the first rig run's "leak" was its own handles)
const at = (sel, how = 'first') => page.evaluate(([sel, how]) => {
  const els = [...document.querySelectorAll(sel)].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height; });
  const e = how === 'mid' ? els[Math.floor(els.length / 2)] : how === 'last' ? els[els.length - 1] : typeof how === 'number' ? els[how % Math.max(1, els.length)] : els[0];
  if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, n: els.length };
}, [sel, how]).catch(() => null);
const clickAt = async c => { if (c) { await page.mouse.move(c.x, c.y, { steps: 2 }); await page.mouse.click(c.x, c.y); } return !!c; };
const hoverOne = async sel => { const c = await at(sel, 'mid'); if (!c) return; await page.mouse.move(c.x, c.y - 120); await sleep(200); await page.mouse.move(c.x, c.y, { steps: 3 }); await sleep(600); };
let turns = 0, lastSample = -1;
const tPlay = Date.now();
while (turns < PLAY && Date.now() - tPlay < 15 * 60000) {
  if (await page.locator('.results').count()) break;
  if (await clickAt(await at('[data-handoff]'))) continue;
  const next = await at('[data-next-round]'); if (next) { await sleep(500); await clickAt(next); continue; }
  const g = await page.evaluate(() => { const e = document.querySelector('.app.game'); return e ? { yours: e.dataset.yours === '1', phase: e.dataset.phase, moves: Number(e.dataset.moves), round: e.dataset.round } : null; }).catch(() => null);
  if (!g || !g.yours) { await sleep(60); continue; }
  if (g.phase === 'place') {
    if (g.moves !== lastSample) {
      lastSample = g.moves; turns++;
      await sleep(800);
      const row = { step: `turn ${turns} (round ${g.round}, move ${g.moves})`, ...(await counters()) }; rows.push(row); console.log(JSON.stringify(row));
    }
    await hoverOne('.lt-wheel [data-slot][data-option]');
    await hoverOne('.lt-shop .card[data-uid]');
    await clickAt(await at('.lt-wheel [data-slot][data-option]', turns * 3));
    await page.locator('[data-place]').first().waitFor({ timeout: 500 }).catch(() => {});
    await clickAt(await at('[data-place]'));
  } else if (g.phase === 'buy') {
    await clickAt((await at('.lt-shop .card[data-option]')) || (await at('.lt-rates [data-rate][data-option]', 'last')) || (await at('[data-option="pass"]')));
  } else if (g.phase === 'pay') {
    await clickAt((await at('.dialog.pay .btn.pri[data-option]:not([disabled])')) || (await at('.dialog.pay [data-option]:not([disabled]):not([data-option="back"])')));
  } else {
    const ids = await page.$$eval('[data-option]:not([disabled])', els => els.map(e => e.getAttribute('data-option'))).catch(() => []);
    const id = ids.find(i => !/^(back|undo|@unpick|pass)/.test(i)) || ids.find(i => i === 'pass');
    if (id) await clickAt(await at(`[data-option="${id}"]`));
  }
  await sleep(250);
}
for (let r = 1; r <= ROUNDS; r++) {
  for (const [what, sel] of [['wheel spaces', '[data-slot]'], ['shop cards', '[data-region="shop"] [data-uid], .lt-shop-cards [data-uid]'], ['seat members', '.cs-member .fig']]) {
    const n = await hoverAll(sel);
    const row = { step: `${r}: ${what} (${Math.min(n, 20)})`, ...(await counters()) };
    rows.push(row); console.log(JSON.stringify(row));
  }
}
if (SNAP) {
  const { createWriteStream } = await import('node:fs');
  const out = createWriteStream(SNAP);
  const on = c => out.write(c.chunk);
  cdp.on('HeapProfiler.addHeapSnapshotChunk', on);
  await cdp.send('HeapProfiler.collectGarbage');
  await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
  cdp.off('HeapProfiler.addHeapSnapshotChunk', on);
  await new Promise(res => out.end(res));
  console.log('snapshot', SNAP);
}
const a = rows[0], z = rows.at(-1);
console.log(`nodes ${a.nodes} -> ${z.nodes} (document ${a.live} -> ${z.live}); detached growth ${(z.nodes - z.live) - (a.nodes - a.live)}`);
if (errs.length) console.log('errors:', errs.slice(0, 3).join('; '));
await browser.close();
