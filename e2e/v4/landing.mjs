import { browserPath, launchBrowser, cdpOk } from './lib/browser.mjs';
// E2E landing gate (Cory, Oct 28: "a lot of the animations dont seem to 'finish' like the follower or the money
// disappears well before making it to its final destination"). Every flight that leaves must arrive: no coin, follower,
// card or member is taken off the screen before its path has played, unless the player pressed to skip the show.
// From a saved game at P1's first placement of round II (bots elsewhere), at Relaxed (what Cory plays) and 4x CPU (a
// slow laptop's long frames, plus a freeze after one flight in 12): P1 answers whatever comes, the round plays to its end, and every flight is watched
// (lib/flightwatch.mjs). Fails on any flight cut short with no press, or a page error. Server: $V4_URL.
import { chromium } from 'playwright';
import { createGame, applyMove, chooseBotMove } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { answerChoice } from './lib/answer.mjs';
import { FLIGHT_WATCH } from './lib/flightwatch.mjs';

const base = process.env.V4_URL;
if (!base) { console.error('landing: set V4_URL'); process.exit(2); }
function roundSave(seed, round) {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  let s = createGame({ seats, seed });
  s.build = buildStamp();
  const rand = seededRandom(seed);
  const there = () => s.round === round && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && s.players[0].left >= 3;
  for (let n = 0; n < 4000 && !there() && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
  if (!there()) throw new Error(`landing: never reached P1's first placement of round ${round}`);
  return { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })) }, state: s, undo: null, savedAt: Date.now() };
}
const SEED = Number(process.env.V4_LAND_SEED || 21), ROUND = Number(process.env.V4_LAND_ROUND || 2), CPU = Number(process.env.V4_LAND_CPU || 4);
const browser = await launchBrowser({ executablePath: browserPath });
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
await ctx.addInitScript(() => { try { localStorage.setItem('patrons.v4.motionSpeed', 'relaxed'); } catch { /* private window */ } });
await ctx.addInitScript(FLIGHT_WATCH);
// one flight in 12 has the page freeze just after it leaves (a long frame on a slow laptop, Firefox's especially)
await ctx.addInitScript(n => { window.__flightStall = n; }, Number(process.env.V4_LAND_STALL || 12));
const page = await ctx.newPage();
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
await seedSave(page, roundSave(SEED, ROUND));
await page.goto(`${base}/?intro=0&sound=off`);
const resume = await page.waitForSelector('[data-home="resume"]', { timeout: 8000 }).catch(() => null);
if (!resume) { console.error('landing: the saved game did not resume'); await browser.close(); process.exit(1); }
await resume.click();
await page.waitForSelector('.app.game', { timeout: 10000 });
// Firefox (V4_ENGINE=firefox) has no CDP: it plays at the box's own speed
const cdp = cdpOk ? await ctx.newCDPSession(page) : { send: async () => ({}) };
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
const t0 = Date.now();
let done = false;
while (!done && Date.now() - t0 < 300000) {
  const s = await page.evaluate(() => {
    const g = document.querySelector('.app.game');
    return { round: Number(g?.dataset.round), card: !!document.querySelector('[data-next-round]'), reckon: g?.dataset.phase === 'reckon', over: !!document.querySelector('.results'), anim: g?.dataset.animating === 'true' };
  }).catch(() => null);
  if (!s) break;
  if (s.round > ROUND || s.card || s.reckon || s.over) { done = true; break; }
  // P1 answers only a settled table, as a person waiting their turn would (a press mid-show skips it, and is allowed)
  const a = s.anim ? null : await answerChoice(page, { domFallback: true }).catch(() => null);
  await page.waitForTimeout(a ? 250 : 120);
}
await page.waitForTimeout(2500); // the round's last flights land
const w = await page.evaluate(() => window.__flightWatch.report());
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }).catch(() => {});
await browser.close();
if (!done) errors.push(`round ${ROUND} never ended within 5 minutes`);
console.log(`landing: ${w.flights} flights in round ${ROUND} at Relaxed, ${cdpOk ? `${CPU}x CPU` : "Firefox, own speed"}: ${w.landed} landed, ${w.skipped} skipped by a press, ${w.cut} cut short; ${w.missed} of ${w.aimed} aimed ended away from their place`);
for (const m of w.misses.slice(0, 8)) errors.push(`a ${m.kind} ended ${m.off}px from its place (${m.target}) at move ${m.moves}`);
for (const c of w.samples.slice(0, 8)) errors.push(`a ${c.kind} left the screen ${c.share}% of the way (${c.at}/${c.end} ms, ${c.state}) at move ${c.moves}: ${c.stack}`);
if (w.flights < 20) errors.push(`only ${w.flights} flights watched: the gate saw too little to judge`);
if (errors.length) { console.error(errors.join('\n')); console.log('FAIL landing'); process.exit(1); }
console.log('PASS landing');
