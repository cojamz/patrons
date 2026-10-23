// What the wheel really prints for every space at 1270×700, round by round: which of a panel's lines (the gain or
// verb, line 2, the small note) show, and which drop because they don't fit. A dropped line is text the player never
// sees on the board; if it carries a number, a condition or a second effect, the space reads wrong.
//   node .claude/skills/review-text/scripts/wheel-fit.mjs [--out file.md] [--shots dir]
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5296.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { writeFileSync } from 'node:fs';
import { createGame, applyMove, chooseBotMove, quadrant } from '../../../../src/engine/v4/index.js';
import { seededRandom } from '../../../../src/engine/v4/rng.js';
import { panelText, lineText } from '../../../../src/v4/game/panelText.js';
import { browserPath } from '../../../../e2e/v4/lib/browser.mjs';
import { buildStamp } from '../../../../e2e/v4/lib/stamp.mjs';
import { seedSave } from '../../../../e2e/v4/lib/seed.mjs';

const argv = process.argv.slice(2);
const oi = argv.indexOf('--out'), out = oi < 0 ? null : argv[oi + 1];
const si = argv.indexOf('--shots'), shots = si < 0 ? null : argv[si + 1]; // a screenshot per table and round
if (shots) (await import('node:fs')).mkdirSync(shots, { recursive: true });
let base = process.env.V4_URL, server = null;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5296;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe', detached: true });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

// P1 (the only person) to place in round `round`, rivals down, as the browser gates seed it
function save(quadrants, round) {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  for (let seed = 1; seed < 80; seed++) {
    let s = createGame({ seats, seed, quadrants });
    s.build = buildStamp();
    const rand = seededRandom(seed);
    const ready = x => x.round === round && x.pending && x.pending.player === 0 && x.pending.kind === 'place' && Object.keys(x.slots).length >= 2;
    for (let n = 0; n < 3000 && !ready(s) && !(s.round > round) && !s.over; n++) s = applyMove(s, chooseBotMove(s, rand));
    if (!ready(s)) continue;
    for (const r of s.resources) s.players[0].res[r] = 6;
    return { config: { seats: seats.map(x => ({ kind: x.kind, name: x.name })), speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
  }
  throw new Error(`no position for ${quadrants.join('/')} round ${round}`);
}

const TABLES = [['gold', 'red', 'purple', 'silver'], ['yellow', 'market', 'thieves', 'trading'], ['echo', 'red', 'trading', 'purple']];
const browser = await chromium.launch({ executablePath: browserPath });
const rows = [], drops = new Map();
try {
  for (const quads of TABLES) for (const round of [1, 2, 3]) {
    const sv = save(quads, round);
    const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
    await seedSave(page, sv);
    await page.goto(`${base}/?botDelay=40`);
    await page.click('[data-home="resume"]');
    await page.waitForTimeout(400);
    { const skip = await page.$('[data-intro-skip]'); if (skip) await skip.click(); }
    await page.waitForSelector('.lt[data-yours="1"][data-phase="place"] .lt-wheel .slot[data-option]', { timeout: 15000 });
    await page.waitForTimeout(700);
    if (shots) await page.screenshot({ path: `${shots}/${quads[0]}-r${round}.png` });
    const seen = await page.$$eval('.lt-wheel .slot[data-slot]', els => els.map(e => ({
      key: e.dataset.slot, panel: e.dataset.panel || '', taken: e.classList.contains('taken'),
      one: e.querySelector('[data-yield]')?.textContent || '', two: e.querySelector('[data-second]')?.textContent || '', note: e.querySelector('[data-note]')?.textContent || '',
    })));
    for (const v of seen) {
      const [q, i] = v.key.split('-').map(Number), qid = sv.state.quadrants[q], a = quadrant(qid).actions[i];
      if (a.ring > round) continue;
      const said = panelText(qid, a, round);
      const full = [said.main || said.verb, said.second, said.note && lineText(said.note)];
      const [ol, tl, nl] = v.panel.split(/[. ]/).map(Number);
      const lost = [];
      if (!v.taken && said.second && !tl) lost.push(`line 2 "${said.second}"`);
      if (!v.taken && said.note && !nl) lost.push(`note "${lineText(said.note)}"`);
      if (!ol && !v.taken) lost.push(`line 1 "${full[0]}"`);
      rows.push(`- round ${['', 'I', 'II', 'III'][round]} ${a.name} (${qid}): shows "${[v.one, v.two, v.note].filter(Boolean).join(' / ')}"${v.taken ? ' (taken: minion over the lines)' : ''}${lost.length ? ` · DROPPED ${lost.join(', ')}` : ''}${/tight/.test(v.panel) ? ' · tight' : ''}`);
      if (lost.length) { const k = `${a.name} round ${['', 'I', 'II', 'III'][round]}`; drops.set(k, [...(drops.get(k) || []), ...lost]); }
    }
    await page.close();
  }
} finally { await browser.close(); if (server) try { process.kill(-server.pid); } catch { server.kill(); } }
const text = `# Wheel print at 1270×700\n\n## Dropped lines\n${[...drops].map(([k, v]) => `- ${k}: ${[...new Set(v)].join(', ')}`).join('\n') || '- none'}\n\n## Every space\n${rows.join('\n')}\n`;
if (out) { writeFileSync(out, text); console.log(`wrote ${out} (${drops.size} spaces drop a line)`); } else process.stdout.write(text);
process.exit(0); // vite's own children can hold the event loop open
