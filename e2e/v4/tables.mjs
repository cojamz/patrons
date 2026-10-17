import { browserPath } from './lib/browser.mjs';
// E2E: the table picker, and one hot-seat game on each of 6 tables that between them seat every newer sphere, two of
// them with fewer players (2 and 3 seats play 2 and 3 spheres).
// One person + 3 bots; the person clicks the first legal option each time. The four games run side by side.
// Checks: the picker (custom by clicks, random + reroll, ?table= in the URL), each game reaching results with no
// console or page errors, the wheel using the picked spheres, and every resource color rendering (4 distinct,
// none transparent), and no stall: every step put to the person has something on screen that moves the game on, a
// rival's step never stands for a minute, and the Reckoning never freezes (each fails fast, naming the step and what's
// on screen). Screenshots go to /tmp/patrons-shots/v4/tables/.
//
// Server: $V4_URL if set (npm run check:v4 sets it), else its own `npx vite` on a free port from 5180.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { answerChoice } from './lib/answer.mjs';

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
  // one sphere per player (Cory, 2026-10-15): two seats play Classic's first two; three seats play a 3-sphere table
  { tag: '2p-classic', ids: ['gold', 'red'], how: 'classic', seats: 2 },
  { tag: '3p-thieves-yellow-silver', ids: ['thieves', 'yellow', 'silver'], how: 'url', url: 'thieves,yellow,silver', seats: 3 },
];

const errors = [];
const browser = await chromium.launch({ executablePath: browserPath });

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
    // fewer players: empty the last seats; the table follows the seats (one sphere each)
    for (let i = 3; i >= (t.seats || 4); i--) await page.click(`[data-seat-row="${i}"] [role="radio"]:has-text("Empty")`);
    if (t.seats) {
      const hint = await page.$eval('.table-pick', e => e.textContent).catch(() => '');
      if (!hint.includes(`Random ${t.seats}`)) err(`the picker doesn't offer "Random ${t.seats}" with ${t.seats} seats: ${hint.slice(0, 120)}`);
    }
    if (t.how === 'click') {
      // wave f4 (blind panel): the click that opened setup focused P4's name box under the pointer; the page held one
      // width at 520px and jumped to 1000px on Custom, moving every control; a fifth sphere's click said nothing
      if (await page.evaluate(() => document.activeElement && document.activeElement.tagName === 'INPUT')) err('opening setup put the focus in a name box');
      const box = () => page.evaluate(() => { const d = document.querySelector('.dialog.page').getBoundingClientRect(), s = document.querySelector('[data-start]').getBoundingClientRect(); return { w: Math.round(d.width), left: Math.round(d.left), start: [Math.round(s.left), Math.round(s.top)] }; });
      const sizes = [await box()];
      // Classic by default; Random 4 offers a fresh table on Reroll; Custom picks by clicks, in wheel order.
      const classic = await page.$eval('[data-table]', e => e.getAttribute('data-table'));
      if (classic !== 'gold,red,market,echo') err(`default table is ${classic}`);
      await page.click('.table-pick [role="radio"]:has-text("Random 4")');
      sizes.push(await box());
      const r1 = await page.$eval('[data-table]', e => e.getAttribute('data-table'));
      await page.click('[data-reroll]');
      const r2 = await page.$eval('[data-table]', e => e.getAttribute('data-table'));
      if (r1 === r2 || r1.split(',').length !== 4 || r2.split(',').length !== 4) err(`random/reroll gave ${r1} then ${r2}`);
      await page.click('.table-pick [role="radio"]:has-text("Custom")');
      sizes.push(await box());
      if (new Set(sizes.map(z => `${z.w}|${z.left}`)).size > 1) err(`the setup page changes width with the table mode: ${JSON.stringify(sizes)}`);
      if (new Set(sizes.map(z => z.start.join())).size > 1) err(`Start moves with the table mode: ${JSON.stringify(sizes.map(z => z.start))}`);
      // four picked: a fifth swaps in for the last one picked, in its place, and says so quietly by the count (live panel
      // r1, G4: "you can't swap a colour once 4 are picked"; it used to say only "take one off")
      const fifth = await page.$('.sphere.over');
      if (!fifth) err('with four picked, no fifth sphere offers a swap');
      else {
        const id5 = await fifth.getAttribute('data-sphere');
        await fifth.click();
        const now = await page.$eval('[data-table]', e => e.getAttribute('data-table'));
        if (now !== [...r2.split(',').slice(0, 3), id5].join(',')) err(`a fifth sphere's click with four picked didn't swap out the last one: ${r2} then ${now}`);
        if (!(await page.waitForSelector('[data-full-note]', { timeout: 2000 }).catch(() => null))) err('a swap with four picked says nothing');
      }
      // Clear takes all four off in one click (live panel r1: setup had no "clear")
      const clearBtn = await page.$('[data-table-clear]');
      if (!clearBtn) err('the custom table has no Clear');
      else await clearBtn.click();
      if ((await page.$eval('[data-table]', e => e.getAttribute('data-table'))) !== '') err('Clear left spheres picked');
      if (await page.$('[data-full-note]')) err('the swap note stays after Clear');
      if (!(await page.$('[data-start][disabled]'))) err('Start was enabled with fewer than 4 spheres');
      for (const id of t.ids) await page.click(`[data-sphere="${id}"]`);
      // the plain Blue can't join a table that already has a blue (v0.6.0 leaves Basic Blue out of normal setup, so
      // it may not be offered at all; offered, it must be disabled)
      if (await page.$('[data-sphere="blue"]:not([disabled])')) err('a second blue sphere was still pickable');
    }
    const picked = await page.$eval('[data-table]', e => e.getAttribute('data-table'));
    if (picked !== t.ids.join(',')) err(`picker shows ${picked}, wanted ${t.ids.join(',')}`);
    await shot('setup');
    await page.click('[data-start]');
    await page.waitForSelector('.lt-seat[data-pid]');

    // every resource renders: 4 distinct, visible colors on P1's cult (each dot carries its color, filled, or as a hollow
    // ring when P1 holds none of it)
    const cols = await page.$$eval('.lt-seat[data-pid="0"] [data-res] .res-glyph', els => els.map(e => getComputedStyle(e).color));
    if (cols.length !== t.ids.length || new Set(cols).size !== t.ids.length || cols.some(c => !c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent')) err(`resource colors: ${cols.join(' | ')}`);
    const tabs = await page.$$eval('.lt-wheel .plaque', els => els.map(e => getComputedStyle(e).getPropertyValue('--c').trim()));
    const unresolved = await page.evaluate(ids => ids.filter(id => !getComputedStyle(document.documentElement).getPropertyValue(`--${id}`).trim()), t.ids);
    if (unresolved.length) err(`no color for ${unresolved.join(', ')}`);
    // the wheel has one quadrant per sphere: its rims, and 6 spaces each
    const rims = await page.$$eval('[data-rim]', els => els.map(e => e.getAttribute('data-rim')));
    const slots = await page.$$eval('.stage > [data-slot]', els => els.length);
    if (rims.join(',') !== t.ids.join(',') || slots !== 6 * t.ids.length) err(`the wheel has rims ${rims.join(',')} and ${slots} spaces, wanted ${t.ids.join(',')} and ${6 * t.ids.length}`);
    await page.waitForTimeout(400);
    await shot('wheel');

    const t0 = Date.now();
    let clicks = 0, shotMid = false;
    // The stall guard: every step put to the person offers something on screen that moves the game on, and the round's
    // Reckoning tells its quadrants and ends by itself. Either standing still fails fast, naming the step and what's on
    // screen, instead of running out a blind time budget.
    const where = () => page.evaluate(() => {
      const g = document.querySelector('.app.game');
      const rk = document.querySelector('.lt-reckon .reckon-head');
      const ids = [...document.querySelectorAll('[data-option]')].map(e => `${e.getAttribute('data-option')}${e.disabled || e.getAttribute('aria-disabled') === 'true' ? '(off)' : ''}`);
      return { moves: g ? g.dataset.moves : '?', phase: g ? g.dataset.phase : '?', yours: g ? g.dataset.yours === '1' : false, reckon: rk ? rk.textContent.replace(/\s+/g, ' ').trim() : '',
        prompt: (document.querySelector('[data-prompt]') || {}).textContent || '', ids };
    }).catch(() => null);
    let step = { key: '', since: Date.now(), clicks: 0, tried: new Set() };
    while (!(await page.$('.results'))) {
      // a time budget only: a game standing still fails within a minute (below), so a slow box isn't a stall
      if (Date.now() - t0 > 480000) throw new Error(`game did not finish in 8 minutes; at ${JSON.stringify(await where())}`);
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
      // a rival's step (or anything not yours) that stands for a minute: the bots or the table stopped
      if (at && !at.yours && !at.reckon && Date.now() - step.since > 60000) {
        await shot('zz-stuck');
        throw new Error(`the table stood still for 60s at move ${at.moves} (${at.phase}); on screen: ${at.ids.join(' ')}`);
      }
      // your step: 30 clicks that moved nothing (over at least 15s), or 45s with nothing clickable, means nothing on
      // screen answers it
      if (at && at.yours && ((step.clicks >= 30 && Date.now() - step.since > 15000) || Date.now() - step.since > 45000)) {
        await shot('zz-stuck');
        throw new Error(`stuck at move ${at.moves} (${at.phase}, "${at.prompt.trim().slice(0, 80)}"): ${step.clicks} clicks on [${[...step.tried].join(', ')}] moved nothing; on screen: ${at.ids.join(' ')}`);
      }
      // the first answer in page order, as a person would give it (lib/answer.mjs: board picks, pairs, the pay sheet)
      const did = await answerChoice(page);
      if (did) { clicks++; step.clicks++; step.tried.add(did.id); }
      await page.waitForTimeout(did ? 20 : 40);
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
