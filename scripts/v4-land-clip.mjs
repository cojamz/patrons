// A clip of rivals' turns from the landing gate's saved game (round II, Relaxed, 4x CPU, a long frame after one flight in
// 12), for showing flights land: node scripts/v4-land-clip.mjs <url> <out.webm> [--secs=24] [--stall=12]
// Bots' choices come from a seeded Math.random, so two builds play the same turns side by side.
import { chromium } from 'playwright';
import { renameSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { browserPath } from '../e2e/v4/lib/browser.mjs';
import { createGame, applyMove, chooseBotMove } from '../src/engine/v4/index.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { buildStamp } from '../e2e/v4/lib/stamp.mjs';
import { seedSave } from '../e2e/v4/lib/seed.mjs';
import { answerChoice } from '../e2e/v4/lib/answer.mjs';
import { FLIGHT_WATCH } from '../e2e/v4/lib/flightwatch.mjs';

const argv = process.argv.slice(2);
const flag = (n, d) => { const a = argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const [base, out] = argv.filter(a => !a.startsWith('--'));
const SECS = Number(flag('secs', 24)), STALL = Number(flag('stall', 12));
const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
let s = createGame({ seats, seed: 21 });
s.build = buildStamp();
const rand = seededRandom(21);
for (let n = 0; n < 4000 && !(s.round === 2 && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && s.players[0].left >= 3); n++) s = applyMove(s, chooseBotMove(s, rand));
const dir = mkdtempSync(join(tmpdir(), 'clip-'));
const browser = await chromium.launch({ executablePath: browserPath });
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 }, recordVideo: { dir, size: { width: 1270, height: 700 } } });
await ctx.addInitScript(() => { try { localStorage.setItem('patrons.v4.motionSpeed', 'relaxed'); } catch { /* */ } });
await ctx.addInitScript(sd => { let a = sd >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, 7);
await ctx.addInitScript(FLIGHT_WATCH);
await ctx.addInitScript(n => { window.__flightStall = n; }, STALL);
const page = await ctx.newPage();
await seedSave(page, { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })) }, state: s, undo: null, savedAt: Date.now() });
await page.goto(`${base}/?intro=0&sound=off`);
await (await page.waitForSelector('[data-home="resume"]')).click();
await page.waitForSelector('.app.game');
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const t0 = Date.now();
while (Date.now() - t0 < SECS * 1000) {
  const anim = await page.evaluate(() => document.querySelector('.app.game')?.dataset.animating === 'true').catch(() => true);
  const a = anim ? null : await answerChoice(page, { domFallback: true }).catch(() => null);
  await page.waitForTimeout(a ? 250 : 120);
}
const w = await page.evaluate(() => window.__flightWatch.report());
await ctx.close();
await browser.close();
const f = readdirSync(dir).find(x => x.endsWith('.webm'));
renameSync(join(dir, f), out);
console.log(`${out}: ${w.flights} flights, ${w.landed} landed, ${w.cut} cut short`);
for (const c of w.samples) console.log(`  cut: a ${c.kind} left at ${c.share}% of its way, ${(c.born / 1000).toFixed(1)}s to ${(c.t / 1000).toFixed(1)}s into the page`);
