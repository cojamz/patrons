import { browserPath, launchBrowser, cdpOk } from './lib/browser.mjs';
// E2E round-end gate (v0.9.807: on a slowed Firefox the end of round II sat on the rivals' turn for an hour, the round's
// scoring waiting on a show's end that a later show had taken over). From a saved game at P1's first placement of round
// II, at Relaxed and 4x CPU with a long frame after one flight in 6, P1 answers whatever comes and the round must reach
// its next-round button within 4 minutes. Server: $V4_URL.
import { createGame, applyMove, chooseBotMove } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { answerChoice } from './lib/answer.mjs';
import { FLIGHT_WATCH } from './lib/flightwatch.mjs';

const base = process.env.V4_URL;
if (!base) { console.error('round-end: set V4_URL'); process.exit(2); }
const SEED = Number(process.env.V4_END_SEED || 21), ROUND = 2, CPU = Number(process.env.V4_END_CPU || 4);
const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
let s = createGame({ seats, seed: SEED });
s.build = buildStamp();
const rand = seededRandom(SEED);
const there = () => s.round === ROUND && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && s.players[0].left >= 3;
for (let n = 0; n < 4000 && !there() && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
if (!there()) { console.error(`round-end: never reached P1's first placement of round ${ROUND}`); process.exit(1); }
const browser = await launchBrowser({ executablePath: browserPath });
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
await ctx.addInitScript(() => { try { localStorage.setItem('patrons.v4.motionSpeed', 'relaxed'); } catch { /* private window */ } });
await ctx.addInitScript(FLIGHT_WATCH);
await ctx.addInitScript(n => { window.__flightStall = n; }, Number(process.env.V4_END_STALL || 6));
const page = await ctx.newPage();
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
await seedSave(page, { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })) }, state: s, undo: null, savedAt: Date.now() });
await page.goto(`${base}/?intro=0&sound=off`);
const resume = await page.waitForSelector('[data-home="resume"]', { timeout: 8000 }).catch(() => null);
if (!resume) { console.error('round-end: the saved game did not resume'); await browser.close(); process.exit(1); }
await resume.click();
await page.waitForSelector('.app.game', { timeout: 10000 });
const cdp = cdpOk ? await ctx.newCDPSession(page) : { send: async () => ({}) };
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const t0 = Date.now();
let done = false, reckonAt = 0, last = null;
while (Date.now() - t0 < 240000) {
  last = await page.evaluate(() => {
    const g = document.querySelector('.app.game');
    return { round: Number(g?.dataset.round), phase: g?.dataset.phase, card: !!document.querySelector('[data-next-round]'), over: !!document.querySelector('.results'), anim: g?.dataset.animating === 'true', caption: (document.querySelector('.turn-caption, .caption')?.textContent || '').trim().slice(0, 60) };
  }).catch(() => null);
  if (!last) break;
  if (last.card || last.over || last.round > ROUND) { done = true; break; }
  if (last.phase === 'reckon' && !reckonAt) reckonAt = Date.now();
  const a = last.anim || last.phase === 'reckon' ? null : await answerChoice(page, { domFallback: true }).catch(() => null);
  await page.waitForTimeout(a ? 250 : 150);
}
if (!done) {
  await page.screenshot({ path: `${process.env.V4_SHOTS || '.'}/round-end-stuck.png` }).catch(() => {});
  const wait = await page.evaluate(() => window.__tableWait && window.__tableWait()).catch(() => null);
  errors.push(`waiting on: ${JSON.stringify(wait)}`);
  errors.push(`round ${ROUND} never reached its next-round button in 4 minutes (${reckonAt ? `scoring began ${Math.round((Date.now() - reckonAt) / 1000)}s before` : 'scoring never began'}; last seen ${JSON.stringify(last)})`);
}
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }).catch(() => {});
await browser.close();
console.log(`round-end: round ${ROUND} at Relaxed, ${cdpOk ? `${CPU}x CPU` : 'Firefox, own speed'}, a long frame after one flight in 6: ${done ? `next-round button after ${Math.round((Date.now() - t0) / 1000)}s` : 'stuck'}`);
if (errors.length) { console.error(errors.join('\n')); console.log('FAIL round-end'); process.exit(1); }
console.log('PASS round-end');
