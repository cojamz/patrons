// E2E: the table picker, and one hot-seat game on each of 4 tables that between them seat every newer sphere.
// One person + 3 bots; the person clicks the first legal option each time. The four games run side by side.
// Checks: the picker (custom by clicks, random + reroll, ?table= in the URL), each game reaching results with no
// console or page errors, the wheel using the picked spheres, and every resource color rendering (4 distinct,
// none transparent). Screenshots go to /tmp/patrons-shots/v4/tables/.
//
// Server: $V4_URL if set (npm run check:v4 sets it), else its own `npx vite` on a free port from 5180.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/tables';
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5180;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

// Between them: Blue (market), Green (echo), Magenta, Purple, Silver, White, Yellow.
const TABLES = [
  { tag: 'market-echo', ids: ['gold', 'red', 'market', 'echo'], how: 'click' },
  { tag: 'thieves-purple-silver', ids: ['gold', 'thieves', 'purple', 'silver'], how: 'url' },
  { tag: 'trading-yellow-echo', ids: ['red', 'trading', 'yellow', 'echo'], how: 'url' },
  { tag: 'yellow-market-thieves-trading', ids: ['yellow', 'market', 'thieves', 'trading'], how: 'url', url: 'yellow,market,magenta,white' },
];

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function play(t) {
  const err = m => errors.push(`[${t.tag}] ${m}`);
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') err(`console: ${m.text()}`); });
  page.on('pageerror', e => err(`pageerror: ${e.message}`));
  const shot = name => page.screenshot({ path: `${SHOTS}/${t.tag}-${name}.png` }).catch(() => {});
  try {
    await page.goto(`${base}/?botDelay=30&intro=0${t.how === 'url' ? `&table=${t.url || t.ids.join(',')}` : ''}`);
    await page.click('[data-home="local"]');
    await page.waitForSelector('[data-start]');
    if (t.how === 'click') {
      // Classic by default; Random 4 offers a fresh table on Reroll; Custom picks by clicks, in wheel order.
      const classic = await page.$eval('[data-table]', e => e.getAttribute('data-table'));
      if (classic !== 'gold,red,market,echo') err(`default table is ${classic}`);
      await page.click('.table-pick [role="radio"]:has-text("Random 4")');
      const r1 = await page.$eval('[data-table]', e => e.getAttribute('data-table'));
      await page.click('[data-reroll]');
      const r2 = await page.$eval('[data-table]', e => e.getAttribute('data-table'));
      if (r1 === r2 || r1.split(',').length !== 4 || r2.split(',').length !== 4) err(`random/reroll gave ${r1} then ${r2}`);
      await page.click('.table-pick [role="radio"]:has-text("Custom")');
      for (const id of r2.split(',')) await page.click(`[data-sphere="${id}"]`); // clear
      if (!(await page.$('[data-start][disabled]'))) err('Start was enabled with fewer than 4 spheres');
      for (const id of t.ids) await page.click(`[data-sphere="${id}"]`);
      // the plain Blue can't join a table that already has a blue
      if (!(await page.$('[data-sphere="blue"][disabled]'))) err('a second blue sphere was still pickable');
    }
    const picked = await page.$eval('[data-table]', e => e.getAttribute('data-table'));
    if (picked !== t.ids.join(',')) err(`picker shows ${picked}, wanted ${t.ids.join(',')}`);
    await shot('setup');
    await page.click('[data-start]');
    await page.waitForSelector('.lt-seat[data-pid]');

    // every resource renders: 4 distinct, visible colors on P1's cult (each resource's shape, filled in its color)
    const cols = await page.$$eval('.lt-seat[data-pid="0"] [data-res] .res-glyph path:first-of-type', els => els.map(e => getComputedStyle(e).fill));
    if (cols.length !== 4 || new Set(cols).size !== 4 || cols.some(c => !c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent')) err(`resource colors: ${cols.join(' | ')}`);
    const tabs = await page.$$eval('.lt-wheel .plaque', els => els.map(e => getComputedStyle(e).getPropertyValue('--c').trim()));
    const unresolved = await page.evaluate(ids => ids.filter(id => !getComputedStyle(document.documentElement).getPropertyValue(`--${id}`).trim()), t.ids);
    if (unresolved.length) err(`no color for ${unresolved.join(', ')}`);

    const t0 = Date.now();
    let clicks = 0, shotMid = false;
    // The stall guard: every step put to the person offers something on screen that moves the game on, and the round's
    // Reckoning tells its quadrants and ends by itself. Either standing still fails fast, naming the step and what's on
    // screen, instead of a blind 5-minute timeout.
    const where = () => page.evaluate(() => {
      const g = document.querySelector('.app.game');
      const rk = document.querySelector('.lt-reckon .reckon-head');
      const ids = [...document.querySelectorAll('[data-option]')].map(e => `${e.getAttribute('data-option')}${e.disabled || e.getAttribute('aria-disabled') === 'true' ? '(off)' : ''}`);
      return { moves: g ? g.dataset.moves : '?', phase: g ? g.dataset.phase : '?', yours: g ? g.dataset.yours === '1' : false, reckon: rk ? rk.textContent.replace(/\s+/g, ' ').trim() : '',
        prompt: (document.querySelector('[data-prompt]') || {}).textContent || '', ids };
    }).catch(() => null);
    let step = { key: '', since: Date.now(), clicks: 0, tried: new Set() };
    while (!(await page.$('.results'))) {
      if (Date.now() - t0 > 300000) throw new Error(`game did not finish in 5 minutes; at ${JSON.stringify(await where())}`);
      const hand = await page.$('[data-handoff]');
      if (hand) { await hand.click().catch(() => {}); continue; }
      const next = await page.$('[data-next-round]');
      if (next) { if (!shotMid) { shotMid = true; await page.waitForTimeout(600); await shot('round-end'); } await next.click().catch(() => {}); continue; }
      const at = await where();
      const key = at ? `${at.moves}|${at.phase}|${at.reckon}` : step.key;
      if (key !== step.key) step = { key, since: Date.now(), clicks: 0, tried: new Set() };
      // a Reckoning that stops telling (the same quadrant on screen for 20s) is a frozen round end: say so, then Skip on
      if (at && at.reckon && Date.now() - step.since > 20000) {
        err(`the Reckoning stood still for 20s at "${at.reckon}"`);
        await shot('zz-reckoning-frozen');
        await page.click('[data-reckon-skip]', { timeout: 1500 }).catch(() => {});
        step.since = Date.now();
        continue;
      }
      // your step: 30 clicks that moved nothing (over at least 15s) means nothing on screen answers it
      if (at && at.yours && step.clicks >= 30 && Date.now() - step.since > 15000) {
        await shot('zz-stuck');
        throw new Error(`stuck at move ${at.moves} (${at.phase}, "${at.prompt.trim().slice(0, 80)}"): ${step.clicks} clicks on [${[...step.tried].join(', ')}] moved nothing; on screen: ${at.ids.join(' ')}`);
      }
      const els = await page.$$('[data-option]:not([disabled])');
      const ids = await Promise.all(els.map(el => el.getAttribute('data-option').catch(() => null)));
      // a pair is picked in two steps, like a person: yours (@pick:x), then theirs. Once one is lifted (@unpick on
      // screen), putting it back or switching to another of yours would only go round in circles.
      const second = ids.includes('@unpick');
      let clicked = false;
      for (let k = 0; k < els.length; k++) {
        const id = ids[k];
        if (!id || id.startsWith('toggle:') || id === 'back' || id === '@unpick' || (second && id.startsWith('@pick:'))) continue;
        try { await els[k].click({ timeout: 1500 }); clicked = true; clicks++; step.clicks++; step.tried.add(id); break; } catch { /* covered or gone */ }
      }
      await page.waitForTimeout(clicked ? 20 : 40);
    }
    await page.waitForTimeout(300);
    await shot('results');
    const winner = await page.$eval('.results .win', e => e.textContent).catch(() => '?');
    console.log(`${t.tag}: ${clicks} clicks, ${tabs.length} rim plaques, ${winner}`);
  } catch (e) {
    err(`run: ${e.stack || e.message}`);
    await shot('zz-failure');
  } finally {
    await ctx.close();
  }
}

try {
  await Promise.all(TABLES.map(play));
} finally {
  await browser.close();
  if (server) server.kill();
}
if (errors.length) console.error(errors.join('\n'));
console.log(errors.length ? 'FAIL tables' : 'PASS tables');
process.exit(errors.length ? 1 : 0);
