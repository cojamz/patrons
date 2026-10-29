import { browserPath, launchBrowser } from '../e2e/v4/lib/browser.mjs';
// The round's end, timed beat by beat at a speed (Cory, Oct 29: "end of round scoring could be a bit smoother, a bit
// quicker"). From a save at P1's last placement of round I (seed 5), P1 places and passes; the probe records when the
// round's last move rests, when the scoring card shows, each rim, the summary, and (after a 1s read) how long Start
// round II takes to hand the table back.
//   node scripts/v4-roundend-time.mjs <base url> [quick|steady|relaxed] [--video=<file.mp4>]
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createGame, applyMove, chooseBotMove } from '../src/engine/v4/index.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { buildStamp } from '../e2e/v4/lib/stamp.mjs';

const args = process.argv.slice(2);
const [base, speed = 'steady'] = args.filter(a => !a.startsWith('--'));
const video = (args.find(a => a.startsWith('--video=')) || '').slice(8);
const SEED = Number((args.find(a => a.startsWith('--seed=')) || '--seed=5').slice(7));
const ROUND = Number((args.find(a => a.startsWith('--round=')) || '--round=1').slice(8));
const SEATS = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
let s = createGame({ seats: SEATS, seed: SEED });
const rand = seededRandom(SEED);
const there = () => s.round === ROUND && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && s.players[0].left === 1;
for (let n = 0; n < 4000 && !there() && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
s.build = buildStamp();
const save = { config: { seats: SEATS.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };

const vdir = join(tmpdir(), `v4-re-${process.pid}`);
const b = await launchBrowser({ executablePath: browserPath });
const ctx = await b.newContext({ viewport: { width: 1270, height: 700 }, ...(video ? { recordVideo: { dir: vdir, size: { width: 1270, height: 700 } } } : {}) });
await ctx.addInitScript(() => {
  const T = window.__re = [];
  let last = {};
  const mark = (k, v) => { if (last[k] !== v) { last[k] = v; T.push([Math.round(performance.now()), k, v]); } };
  const tick = () => {
    const g = document.querySelector('.app.game');
    if (g) { mark('phase', g.dataset.phase || ''); mark('chain', g.dataset.chain ? 1 : 0); mark('round', g.dataset.round); }
    const rk = document.querySelector('.lt-reckon');
    mark('reckon', rk ? (rk.classList.contains('waiting') ? 'waiting' : rk.dataset.reckon || 'on') : '');
    const v = document.querySelector('.reckon-verdict.on');
    mark('verdict', v ? v.textContent : '');
    mark('summary', document.querySelector('[data-next-round]') ? 1 : 0);
    mark('yours', document.querySelector('.lt[data-yours="1"]') ? 1 : 0);
    requestAnimationFrame(tick);
  };
  addEventListener('DOMContentLoaded', () => requestAnimationFrame(tick));
});
const p = await ctx.newPage();
await p.goto(`${base}/?intro=0&sound=off&speed=${speed}`);
await p.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), save);
await p.reload();
await (await p.waitForSelector('[data-home="resume"]', { timeout: 20000 })).click();
await p.waitForSelector('.lt[data-phase="place"][data-yours="1"] .slot.can .base', { timeout: 20000 });
await p.waitForTimeout(500);
const t0 = await p.evaluate(() => performance.now());
await (await p.$('.slot.can .base')).click();
for (let k = 0; k < 40 && !(await p.$('.lt[data-phase="buy"][data-yours="1"]')); k++) {
  const opt = await p.$('.lt[data-phase="choose"] .prompt.choice button[data-option]:not([disabled]):not([data-option="pass"]):not(.undo)');
  if (opt) await opt.click().catch(() => {});
  await p.waitForTimeout(150);
}
const pass = await p.waitForSelector('.lt[data-phase="buy"][data-yours="1"] [data-option="pass"]', { timeout: 10000 }).catch(() => null);
if (pass) await pass.click();
const next = await p.waitForSelector('[data-next-round]', { timeout: 120000 }).catch(() => null);
let clickAt = null;
if (next) { await p.waitForTimeout(1000); clickAt = await p.evaluate(() => performance.now()); await next.click(); }
await p.waitForTimeout(speed === 'relaxed' ? 9000 : 5000);
const T = await p.evaluate(() => window.__re);
await ctx.close(); await b.close();
if (video) {
  const src = join(vdir, readdirSync(vdir).find(f => f.endsWith('.webm')));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', video]);
  rmSync(vdir, { recursive: true, force: true });
}
const rel = t => ((t - t0) / 1000).toFixed(2);
const firstReckon = T.find(e => e[1] === 'reckon' && e[2] && e[2] !== 'waiting');
// the round's last move resting: the last chain end before the scoring card
const restBefore = T.filter(e => e[1] === 'chain' && e[2] === 0 && (!firstReckon || e[0] <= firstReckon[0])).pop();
const summary = T.find(e => e[1] === 'summary' && e[2] === 1);
console.log(`speed ${speed}, seed ${SEED}, round ${ROUND}`);
for (const e of T) if (['reckon', 'verdict', 'summary', 'round', 'yours'].includes(e[1]) || (e[1] === 'phase')) console.log(`${rel(e[0]).padStart(7)}s  ${e[1]} ${e[2]}`);
if (restBefore && firstReckon) console.log(`last move at rest → scoring shows: ${((firstReckon[0] - restBefore[0]) / 1000).toFixed(2)}s`);
if (firstReckon && summary) console.log(`scoring (all rims): ${((summary[0] - firstReckon[0]) / 1000).toFixed(2)}s`);
if (clickAt) {
  const back = T.find(e => e[0] > clickAt && e[1] === 'chain' && e[2] === 0 && T.some(f => f[0] > clickAt && f[0] < e[0] && f[1] === 'chain' && f[2] === 1));
  const r2 = T.find(e => e[0] > clickAt && e[1] === 'round');
  if (r2) console.log(`Start round → round shows: ${((r2[0] - clickAt) / 1000).toFixed(2)}s`);
  if (back) console.log(`Start round → new round's show at rest: ${((back[0] - clickAt) / 1000).toFixed(2)}s`);
}
