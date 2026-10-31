import { browserPath, launchBrowser } from './lib/browser.mjs';
// E2E: the reload and two-tab edges a blind saboteur found in RC1 (design/eval/panel-rc1-saboteur.md #1, #3, #5).
//  (t) one local game open in two pages of one browser: the newer page takes it over, the older one freezes behind
//      "This game is open in another tab", nothing it does reaches the save, and "Play here" takes it back with no
//      move lost.
//  (s) a reload during the Reckoning or the round summary reopens the summary, and the bots wait until it's dismissed.
//  (r) a reload of the results shows them again; home then offers "Last game's results" (Copy game record works
//      there) until a new game starts.
// Server: $V4_URL (check:v4's preview) or its own `npx vite`. Shots: $V4_SHOTS (default /tmp/patrons-shots/v4-resume-edge).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { answerChoice } from './lib/answer.mjs';

const SHOTS = process.env.V4_SHOTS || '/tmp/patrons-shots/v4-resume-edge';
mkdirSync(SHOTS, { recursive: true });
const DESKTOP = { width: 1270, height: 700 };

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

const errors = [];
const browser = await launchBrowser({ executablePath: browserPath });
const ctx = await browser.newContext({ viewport: DESKTOP });
const watch = (page, tag) => {
  page.on('console', m => { if (m.type() === 'error') errors.push(`${tag} console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${tag} pageerror: ${e.message}`));
};
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` }).catch(() => {});
const moves = page => page.$eval('.app.game', e => Number(e.dataset.moves)).catch(() => -1);
const savedMoves = page => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('patrons.v4.local')).state.moves; } catch { return -1; } });
const savedHold = page => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('patrons.v4.local')).hold || null; } catch { return null; } });

// one step of play for the person: a handoff, the summary, or the first legal option (as hotseat.mjs does)
async function act(page, { next = true } = {}) {
  const hand = await page.$('[data-handoff]');
  if (hand) { await hand.click().catch(() => {}); return true; }
  // waiting for a round end (next: false) never skips the Reckoning it is waiting for: it now plays ~3s a quadrant
  // (Cory, 2026-10-15), so a step taken in the gap between the wait's check and this one used to skip it unseen
  const skip = await page.$('[data-reckon-skip]');
  if (skip) { if (!next) return false; await skip.click().catch(() => {}); return true; }
  const nx = await page.$('[data-next-round]');
  if (nx) { if (next) await nx.click().catch(() => {}); return next; }
  // anything else: the shared answerer (lib/answer.mjs). Pairs and gifts are picked on the gift card now (2026-10-15),
  // where "@unpick" comes first in the page: the first-option click put the pick back forever (Even Swap stalled here)
  return !!(await answerChoice(page, { timeout: 1000 }));
}
async function playUntil(page, cond, { ms = 120000, next = true, label = 'condition' } = {}) {
  const t0 = Date.now();
  while (!(await cond())) {
    if (Date.now() - t0 > ms) throw new Error(`never reached ${label}`);
    if (!(await act(page, { next }))) await page.waitForTimeout(40); else await page.waitForTimeout(25);
  }
}

let ok = false;
try {
  const url = `${base}/?botDelay=40&intro=0`;
  const p1 = await ctx.newPage(); watch(p1, 'tab 1');
  await p1.goto(url);
  await p1.click('[data-home="local"]');
  await p1.click('[data-start]');
  await p1.waitForSelector('.lt-seat[data-pid]');
  await playUntil(p1, async () => (await moves(p1)) >= 14 && !!(await p1.$('.app.game[data-yours="1"]')), { label: 'a few moves in, your turn' });

  // ---- (t) a second page opens the same game ----
  const p2 = await ctx.newPage(); watch(p2, 'tab 2');
  await p2.goto(url);
  await p2.waitForSelector('[data-home="resume"]');
  const before = await savedMoves(p1);
  await p2.click('[data-home="resume"]');
  await p2.waitForSelector('.lt-seat[data-pid]');
  await p1.waitForSelector('[data-tab-away]', { timeout: 4000 }).catch(() => errors.push('(t) the older tab never said the game is open in another tab'));
  await p1.bringToFront();
  await shot(p1, 'session-two-tabs-away');
  // the older page may still be playing out moves made before the hand-off (every move plays out whole: its view
  // lags the save); it settles there, at most at the save's count when the newer tab took over, and stays put
  await p1.waitForSelector('.app.game:not([data-animating])', { timeout: 8000 }).catch(() => {});
  await p1.waitForTimeout(200);
  const frozen = await moves(p1);
  if (frozen > before) errors.push(`(t) the older tab played past the hand-off (${before} saved → ${frozen} shown)`);
  // the older page tries to move (a click that raced the hand-off): nothing it does reaches the game or the save
  await p1.$$eval('[data-option]', els => els.slice(0, 3).forEach(e => e.click())).catch(() => {});
  await p2.bringToFront();
  await playUntil(p2, async () => (await moves(p2)) >= before + 6, { label: 'moves in the newer tab' });
  await p2.waitForTimeout(400);
  if ((await moves(p1)) !== frozen) errors.push(`(t) the older tab kept playing behind the notice (${frozen} → ${await moves(p1)} moves)`);
  const s2 = await savedMoves(p2);
  if (s2 < before + 6) errors.push(`(t) the save lost the newer tab's moves (saved ${s2}, played to ${await moves(p2)})`);
  // "Play here" takes it back from the save: every move the newer tab made is there
  await p1.bringToFront();
  await p1.click('[data-play-here]');
  await p1.waitForSelector('[data-tab-away]', { state: 'detached', timeout: 3000 }).catch(() => errors.push('(t) Play here left the notice up'));
  await p2.waitForSelector('[data-tab-away]', { timeout: 4000 }).catch(() => errors.push('(t) Play here did not take the game from the newer tab'));
  await p1.waitForTimeout(300);
  const back = await moves(p1);
  if (back < s2) errors.push(`(t) Play here resumed at move ${back}, behind the save's ${s2}: moves lost`);
  await shot(p1, 'session-play-here');
  await shot(p2, 'session-two-tabs-away-2');
  await p2.close();

  // ---- (s) a reload during the Reckoning, then on the summary ----
  await playUntil(p1, async () => !!(await p1.$('.lt-reckon')), { next: false, label: 'the round I Reckoning' });
  const atEnd = await savedMoves(p1);
  if (!(await savedHold(p1))) errors.push('(s) the save has no round-end hold while the Reckoning plays');
  await p1.reload();
  await p1.waitForSelector('.lt-reckon, [data-next-round]', { timeout: 8000 }).catch(() => errors.push('(s) a reload during the Reckoning skipped the round summary'));
  await shot(p1, 'session-reload-reckoning');
  await p1.waitForSelector('[data-reckon-skip]', { timeout: 1000 }).then(b => b.click()).catch(() => {});
  await p1.waitForSelector('[data-next-round]', { timeout: 8000 }).catch(() => errors.push('(s) no summary after the reloaded Reckoning'));
  await p1.waitForTimeout(1500);
  if ((await savedMoves(p1)) !== atEnd) errors.push(`(s) the bots moved behind the summary after a reload (${atEnd} → ${await savedMoves(p1)})`);
  await p1.reload();
  await p1.waitForSelector('.lt-reckon, [data-next-round]', { timeout: 8000 }).catch(() => errors.push('(s) a reload on the summary skipped it'));
  await p1.waitForSelector('[data-reckon-skip]', { timeout: 1000 }).then(b => b.click()).catch(() => {});
  await p1.waitForSelector('[data-next-round]', { timeout: 8000 }).catch(() => {});
  const head = await p1.$eval('.roundend h2', e => e.textContent).catch(() => '');
  if (!/\bI\b/.test(head)) errors.push(`(s) the reopened summary is "${head}", not round I's`);
  await shot(p1, 'session-reload-summary');
  await p1.waitForTimeout(1200);
  if ((await savedMoves(p1)) !== atEnd) errors.push(`(s) the bots moved behind the reopened summary (${atEnd} → ${await savedMoves(p1)})`);
  await p1.click('[data-next-round]');
  await playUntil(p1, async () => (await savedMoves(p1)) > atEnd, { ms: 15000, label: 'play going on after the summary' });
  if (await savedHold(p1)) errors.push('(s) the hold stayed in the save after the summary was dismissed');

  // ---- (r) the end: a reload of the results, then home's "Last game's results" ----
  await playUntil(p1, async () => !!(await p1.$('.results')), { ms: 200000, label: 'the results' });
  await p1.waitForTimeout(300);
  const winner = await p1.$eval('.results .win', e => e.textContent).catch(() => '');
  await p1.reload();
  await p1.waitForSelector('.results', { timeout: 8000 }).catch(() => errors.push('(r) a reload of the results lost them'));
  const again = await p1.$eval('.results .win', e => e.textContent).catch(() => '');
  if (again !== winner) errors.push(`(r) the reloaded results say "${again}", not "${winner}"`);
  await shot(p1, 'session-reload-results');
  await p1.click('.results .row-btns .btn:not([data-play-again])');
  await p1.waitForSelector('[data-home="last"]', { timeout: 4000 }).catch(() => errors.push('(r) home does not offer the last game\'s results'));
  if (await p1.$('[data-home="resume"]')) errors.push('(r) home offers to resume a finished game');
  await shot(p1, 'session-home-last');
  await p1.click('[data-home="last"]');
  await p1.waitForSelector('.results', { timeout: 4000 }).catch(() => errors.push('(r) "Last game\'s results" did not open them'));
  await p1.click('.lt-menu .menu-glyph');
  await p1.click('[data-copy-record]');
  await p1.waitForTimeout(300);
  const copied = await p1.evaluate(() => {
    const b = document.querySelector('[data-copy-record]'); const t = document.querySelector('.record-text');
    return (b && /Copied/.test(b.textContent)) || (t && /patrons\.v4\.record/.test(t.value) && /"over": true/.test(t.value));
  });
  if (!copied) errors.push('(r) Copy game record did nothing on the last game\'s results');
  await p1.keyboard.press('Escape');
  // a new game drops the last one's results from home
  await p1.click('[data-play-again]');
  await p1.waitForSelector('.lt-seat[data-pid]');
  if (await p1.$('.results')) errors.push('(r) Play again from the last results did not start a game');
  const last = await p1.evaluate(() => localStorage.getItem('patrons.v4.last'));
  if (last) errors.push('(r) a new game kept the last game\'s results');
  ok = errors.length === 0;
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
  for (const [k, pg] of ctx.pages().entries()) await shot(pg, `zz-failure-${k}`);
} finally {
  await browser.close();
  if (server) server.kill();
}
if (errors.length) console.error(errors.join('\n'));
console.log(ok ? 'PASS resume-edge' : 'FAIL resume-edge');
process.exit(ok ? 0 : 1);
