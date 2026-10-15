// Clips of the table's motion, for watching the chain of animations at each speed (motion engineer, 2026-10-15).
//   node scripts/v4-clips.mjs <base url> <tag> [speed=steady]   → design/eval/perf/<clip>-<tag>.mp4 (+ .gif)
// Clips: your turn (a gain, then a +6 follower buy) · rivals' turns with a steal and a member trigger (seed 5, round II:
// P3's Prospector, then P3 takes 3 gold from two rivals) · a round's end (the Reckoning, then the minions walk home).
// (A build older than the live rules refuses these saves: run a copy of this script from that build's worktree.)
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createGame, applyMove, chooseBotMove } from '../src/engine/v4/index.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { buildStamp } from '../e2e/v4/lib/stamp.mjs';
import { richSave } from '../e2e/v4/lib/rich-save.mjs';

const [base, tag, speed = 'steady'] = process.argv.slice(2);
if (!base || !tag) { console.error('usage: node scripts/v4-clips.mjs <base url> <tag> [quick|steady|relaxed]'); process.exit(2); }
const OUT = 'design/eval/perf';
mkdirSync(OUT, { recursive: true });
const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];

/** A save where P1 is about to place: the `nth` time in the game (seed's bots play everything else, P1 too until then). */
function saveAt(seed, pick) {
  let s = createGame({ seats: SEATS, seed });
  s.build = buildStamp();
  const rand = seededRandom(seed);
  for (let n = 0; n < 2000 && !s.over && !pick(s, n); n++) s = applyMove(s, chooseBotMove(s, rand));
  s.build = buildStamp();
  return { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
}
const p1Places = s => s.pending && s.pending.player === 0 && s.pending.kind === 'place';

async function clip(name, save, act) {
  const vdir = join(tmpdir(), `v4-clip-${name}-${tag}-${process.pid}`);
  rmSync(vdir, { recursive: true, force: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 1270, height: 700 }, recordVideo: { dir: vdir, size: { width: 1270, height: 700 } } });
  const p = await ctx.newPage();
  await p.goto(`${base}/?intro=0&speed=${speed}`);
  await p.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), save);
  await p.reload();
  await (await p.waitForSelector('[data-home="resume"]', { timeout: 20000 })).click();
  await p.waitForSelector('.lt[data-phase="place"][data-yours="1"] .slot.can .base', { timeout: 20000 });
  await p.waitForTimeout(700);
  await act(p);
  await ctx.close();
  await b.close();
  const src = join(vdir, readdirSync(vdir).find(f => f.endsWith('.webm')));
  const mp4 = join(OUT, `${name}-${tag}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vf', 'scale=1270:-2:flags=neighbor', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', mp4]);
  rmSync(vdir, { recursive: true, force: true });
  console.log(`${name}: ${mp4}`);
}

const plainSpace = p => p.evaluateHandle(() => [...document.querySelectorAll('.slot.can')].find(e => /: \+\d+ \w+\.( Open)/.test(e.getAttribute('aria-label') || '')) || document.querySelector('.slot.can'));
async function place(p, re = null) {
  const h = re ? await p.evaluateHandle(src => [...document.querySelectorAll('.slot.can')].find(e => new RegExp(src).test(e.getAttribute('aria-label') || '')), re.source) : await plainSpace(p);
  const el = h.asElement() || await p.$('.slot.can');
  const bb = await (await el.$('.base')).boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 4 });
  await p.waitForTimeout(250);
  await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  for (let k = 0; k < 12 && !(await p.$('.lt[data-phase="buy"][data-yours="1"]')); k++) {
    const opt = await p.$('.prompt.choice button[data-option]:not([disabled])');
    if (opt) { await p.waitForTimeout(300); await opt.click().catch(() => {}); }
    await p.waitForTimeout(250);
  }
}
const waitChain = p => p.waitForFunction(() => !document.querySelector('.app.game').dataset.chain, null, { timeout: 10000 }).catch(() => {});
async function pass(p) { const b = await p.waitForSelector('.lt[data-phase="buy"][data-yours="1"] [data-option="pass"]', { timeout: 10000 }).catch(() => null); if (b) await b.click(); }

await clip('your-turn', richSave(), async p => {
  await place(p, /Tide/);
  await waitChain(p);
  await p.waitForTimeout(500);
  const big = await p.waitForSelector('[data-option^="tier:"][data-rate="big"]', { timeout: 8000 });
  const bb = await big.boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 4 });
  await p.waitForTimeout(250);
  await big.click();
  const go = await p.waitForSelector('.dialog.pay .pay-go[data-option]', { timeout: 3000 }).catch(() => null);
  if (go) { await p.waitForTimeout(500); await go.click(); }
  await p.waitForTimeout(3500);
});
// seed 5, round II: after P1's turn, P3's Prospector pays out and P3 steals 3 gold (1 from P2, 2 from P4)
await clip('rivals-steal-trigger', saveAt(5, (s, n) => n >= 44 && p1Places(s)), async p => {
  await place(p);
  await waitChain(p);
  await pass(p);
  await p.waitForSelector('.lt[data-phase="place"][data-yours="1"] .slot.can .base', { timeout: 40000 }).catch(() => {});
  await p.waitForTimeout(600);
});
// a round's end: P1's last placement of round I, the rest of the round, the Reckoning, the minions walking home
await clip('round-end', saveAt(5, s => p1Places(s) && s.round === 1 && s.players[0].left === 1), async p => {
  await place(p);
  await waitChain(p);
  await pass(p);
  const next = await p.waitForSelector('[data-next-round]', { timeout: 60000 }).catch(() => null);
  if (next) { await p.waitForTimeout(1200); await next.click(); }
  await p.waitForTimeout(2500);
});
