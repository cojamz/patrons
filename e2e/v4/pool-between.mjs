import { browserPath, launchBrowser } from './lib/browser.mjs';
// E2E spare-minions gate (Cory, Oct 29: "between rounds the spare minions count is HUGE"). From a saved game at P1's last
// placement of round I, P1 answers whatever comes, starts round II, and the spare minions are read every frame through
// the round change: the count may never pass 8 (a round's real count is a few; the bug showed every space, 20 and more).
// Server: $V4_URL.
import { createGame, applyMove, chooseBotMove } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { answerChoice } from './lib/answer.mjs';

const base = process.env.V4_URL;
if (!base) { console.error('pool-between: set V4_URL'); process.exit(2); }
const MAX = 8;
const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
let s = createGame({ seats, seed: 21 });
s.build = buildStamp();
const rand = seededRandom(21);
const there = () => s.round === 1 && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && s.players[0].left === 1;
for (let n = 0; n < 4000 && !there() && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
if (!there()) { console.error('pool-between: never reached P1\'s last placement of round I'); process.exit(1); }
const browser = await launchBrowser({ executablePath: browserPath });
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
// every frame, the biggest spare-minions count the page has drawn
await ctx.addInitScript(() => {
  window.__poolMax = 0;
  const look = () => { const p = document.querySelector('.lt-pool'); if (p) window.__poolMax = Math.max(window.__poolMax, Number(p.dataset.pool) || 0, p.querySelectorAll('.pool-min').length); requestAnimationFrame(look); };
  requestAnimationFrame(look);
});
await seedSave(page, { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })) }, state: s, undo: null, savedAt: Date.now() });
await page.goto(`${base}/?intro=0&sound=off`);
await (await page.waitForSelector('[data-home="resume"]', { timeout: 8000 })).click();
await page.waitForSelector('.app.game', { timeout: 10000 });
const t0 = Date.now();
let card = false;
while (Date.now() - t0 < 120000) {
  card = await page.$('[data-next-round]').then(Boolean);
  if (card) break;
  const st = await page.evaluate(() => document.querySelector('.app.game')?.dataset.phase);
  const a = st === 'reckon' ? null : await answerChoice(page, { domFallback: true }).catch(() => null);
  await page.waitForTimeout(a ? 250 : 200);
}
if (!card) { console.error('pool-between: round I never reached its next-round button'); await browser.close(); process.exit(1); }
await page.click('[data-next-round]');
await page.waitForFunction(() => document.querySelector('.app.game')?.dataset.round === '2' && document.querySelector('.lt-pool'), null, { timeout: 15000 });
await page.waitForTimeout(3000);
const most = await page.evaluate(() => window.__poolMax);
if (process.env.V4_SHOTS) { const { mkdirSync } = await import('node:fs'); mkdirSync(process.env.V4_SHOTS, { recursive: true }); await page.screenshot({ path: `${process.env.V4_SHOTS}/round2.png` }); }
const now = await page.evaluate(() => Number(document.querySelector('.lt-pool')?.dataset.pool));
await browser.close();
console.log(`pool-between: round II spare minions ${now}, the most drawn through the round change ${most}`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
if (most > MAX) { console.error(`pool-between: FAIL, the spare minions showed ${most} between rounds (most allowed ${MAX})`); process.exit(1); }
console.log('pool-between: PASS');
