import { browserPath, launchBrowser } from './lib/browser.mjs';
// E2E step-hold gate (Mike, 2026-10-26: the game "locks up" a lot in late round II). At Relaxed, a late-game recruit set
// off 4–6 members one after another (Doorman, Recruiter, Recruit Bonus, Host…) and the table waited for every one: bot
// steps held 7–9s each and the screen fell minutes behind the game, sitting on "Bot 3 is choosing…". Now no step in a
// round holds the table past stepHoldCap (director.js); the rest of its chain lands at once, as a click does.
// From a saved game at P1's first placement of round II (bots elsewhere), at Relaxed: P1 places and answers whatever
// comes, and every step the table shows while nobody here is deciding must hand on within the cap plus a margin, to the
// end of the round. Fails on a page error. Server: $V4_URL (check:v4 serves one).
import { chromium } from 'playwright';
import { createGame, applyMove, chooseBotMove } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { answerChoice } from './lib/answer.mjs';

const base = process.env.V4_URL;
if (!base) { console.error('step-hold: set V4_URL'); process.exit(2); }
// stepHoldCap at Relaxed is Steady's cap: 2400 × 1.62 + 400 ≈ 4.3s. The margin covers the landing, the next step's
// commit and a loaded box; before the cap this save held steps 6.7–6.8s (the live games, 7–9s).
const LIMIT = 5500;
// a saved hot-seat game at P1's first placement of round `round` (bots elsewhere): the whole round to watch
function roundSave(seed, round) {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  let s = createGame({ seats, seed });
  s.build = buildStamp();
  const rand = seededRandom(seed);
  const there = () => s.round === round && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && s.players[0].left >= 3;
  for (let n = 0; n < 4000 && !there() && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
  if (!there()) throw new Error(`step-hold: never reached P1's first placement of round ${round}`);
  return { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })) }, state: s, undo: null, savedAt: Date.now() };
}
const SEED = Number(process.env.V4_HOLD_SEED || 21), ROUND = Number(process.env.V4_HOLD_ROUND || 2);
const browser = await launchBrowser({ executablePath: browserPath });
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
await ctx.addInitScript(() => {
  try { localStorage.setItem('patrons.v4.motionSpeed', 'relaxed'); } catch { /* private window */ }
  // each table step's time on screen, while nobody at this device is deciding (no live choice, no scoring)
  window.__holds = [];
  let at = null, since = 0, idle = true;
  const look = () => {
    const g = document.querySelector('.app.game');
    if (g) {
      const now = performance.now(), m = g.dataset.moves;
      const busy = !!document.querySelector('[data-option]:not([disabled]), [data-next-round], .dialog.pay') || g.dataset.phase === 'reckon' || g.dataset.yours === '1';
      if (m !== at) { if (at != null && idle) window.__holds.push({ moves: Number(at), ms: Math.round(now - since), head: (document.querySelector('.lt-head, header, h1')?.textContent || '').replace(/\s+/g, ' ').slice(0, 60) }); at = m; since = now; idle = true; }
      if (busy) idle = false;
    }
    requestAnimationFrame(look);
  };
  requestAnimationFrame(look);
});
const page = await ctx.newPage();
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
await seedSave(page, roundSave(SEED, ROUND));
await page.goto(`${base}/?intro=0`);
const resume = await page.waitForSelector('[data-home="resume"]', { timeout: 8000 }).catch(() => null);
if (!resume) { console.error('step-hold: the saved game did not resume'); await browser.close(); process.exit(1); }
await resume.click();
await page.waitForSelector('.app.game', { timeout: 10000 });
const t0 = Date.now();
let done = false;
while (!done && Date.now() - t0 < 240000) {
  const s = await page.evaluate(() => {
    const g = document.querySelector('.app.game');
    return { round: Number(g?.dataset.round), card: !!document.querySelector('[data-next-round]'), reckon: g?.dataset.phase === 'reckon', over: !!document.querySelector('.results') };
  }).catch(() => null);
  if (!s) break;
  if (s.round > ROUND || s.card || s.reckon || s.over) { done = true; break; }
  const a = await answerChoice(page, { domFallback: true }).catch(() => null);
  await page.waitForTimeout(a ? 200 : 100);
}
const holds = await page.evaluate(() => window.__holds);
await browser.close();
if (!done) errors.push(`round ${ROUND} never ended within 4 minutes`);
const slow = holds.filter(h => h.ms > LIMIT);
for (const h of slow) errors.push(`a step held the table ${h.ms}ms (limit ${LIMIT}): move ${h.moves}, "${h.head}"`);
const longest = holds.reduce((a, h) => Math.max(a, h.ms), 0);
console.log(`step-hold: ${holds.length} steps watched to the end of round ${ROUND}, longest ${longest}ms (limit ${LIMIT})`);
if (process.env.V4_DEBUG) console.log(JSON.stringify(holds.sort((a, b) => b.ms - a.ms).slice(0, 8)));
if (holds.length < 5) errors.push(`only ${holds.length} steps watched: the gate saw too little to judge`);
if (errors.length) { console.error(errors.join('\n')); console.log('FAIL step-hold'); process.exit(1); }
console.log('PASS step-hold');
