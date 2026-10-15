// Before/after clips of the table's motion (snappy pod): a gain + a follower buy, a recruit, a steal.
//   node .snap-probe/record.mjs <base url> <tag>   → design/eval/perf/<clip>-<tag>.mp4 + .gif
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createGame, applyMove, chooseBotMove } from '../src/engine/v4/index.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { buildStamp } from '../e2e/v4/lib/stamp.mjs';
import { richSave } from '../e2e/v4/lib/rich-save.mjs';

const [base, tag] = process.argv.slice(2);
const OUT = 'design/eval/perf';
mkdirSync(OUT, { recursive: true });

function roundTwoSave(seed = 4) {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  let s = createGame({ seats, seed });
  s.build = buildStamp();
  const rand = seededRandom(seed);
  for (let n = 0; n < 2000 && !(s.round === 2 && s.pending && s.pending.player === 0 && s.pending.kind === 'place'); n++) s = applyMove(s, chooseBotMove(s, rand));
  for (const r of s.resources) s.players[0].res[r] = 6;
  for (const p of s.players.slice(1)) p.res.gold = Math.max(p.res.gold || 0, 3);
  return { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
}

async function clip(name, save, act) {
  const vdir = join('.snap-probe', `v-${name}-${tag}`);
  rmSync(vdir, { recursive: true, force: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 1270, height: 700 }, recordVideo: { dir: vdir, size: { width: 1270, height: 700 } } });
  const p = await ctx.newPage();
  await p.goto(`${base}/?intro=0`);
  await p.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), save);
  await p.reload();
  await (await p.waitForSelector('[data-home="resume"]')).click();
  await p.waitForSelector('.slot.can .base');
  await p.waitForTimeout(800);
  const t0 = Date.now();
  await act(p);
  const ms = Date.now() - t0;
  await ctx.close();
  await b.close();
  const webm = readdirSync(vdir).find(f => f.endsWith('.webm'));
  const src = join(vdir, webm);
  // the clip: from 1.2s before the first action (the page's load trimmed) to the end
  const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]).toString().trim();
  const start = Math.max(0, Number(dur) - ms / 1000 - 0.6);
  const mp4 = join(OUT, `${name}-${tag}.mp4`), gif = join(OUT, `${name}-${tag}.gif`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(start), '-i', src, '-vf', 'scale=1270:-2:flags=neighbor', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', mp4]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(start), '-i', src, '-vf', 'fps=15,scale=960:-1:flags=neighbor,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=none', '-loop', '0', gif]);
  rmSync(vdir, { recursive: true, force: true });
  console.log(`${name}: ${mp4} (${(ms / 1000).toFixed(1)}s of play)`);
}

const spaceNamed = (p, re) => p.evaluateHandle(src => [...document.querySelectorAll('.slot.can')].find(e => new RegExp(src, 'i').test(e.getAttribute('aria-label') || '')), re.source);
async function place(p, re) {
  const h = await spaceNamed(p, re);
  const el = h.asElement() || await p.$('.slot.can');
  const bb = await (await el.$('.base')).boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 4 });
  await p.waitForTimeout(250);
  await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  for (let k = 0; k < 8 && !(await p.$('.lt[data-phase="buy"][data-yours="1"]')); k++) {
    const opt = await p.$('.prompt.choice button[data-option]:not([disabled])');
    if (opt) { await p.waitForTimeout(400); await opt.click().catch(() => {}); }
    await p.waitForTimeout(250);
  }
}
async function pay(p) {
  const btn = await p.waitForSelector('.dialog.pay .btn.pri[data-option]', { timeout: 2500 }).catch(() => null);
  if (btn) { await p.waitForTimeout(500); await btn.click(); }
}

await clip('gain-and-follower-buy', richSave(), async p => {
  await place(p, /Tide/);
  await p.waitForTimeout(1200);
  const big = await p.waitForSelector('[data-option^="tier:"]:has-text("→ 6")', { timeout: 8000 });
  const bb = await big.boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 4 });
  await p.waitForTimeout(200);
  await big.click();
  await pay(p);
  await p.waitForTimeout(2200);
});
await clip('recruit', richSave(), async p => {
  await place(p, /Sprout/);
  await p.waitForTimeout(1000);
  const card = await p.waitForSelector('.lt-shop .card.can[data-option]', { timeout: 8000 });
  const bb = await card.boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 4 });
  await p.waitForTimeout(300);
  await card.click();
  await pay(p);
  await p.waitForTimeout(2200);
});
await clip('steal', roundTwoSave(), async p => {
  await place(p, /steal|Collect Debts|from each|take .* from/);
  await p.waitForTimeout(2200);
});
