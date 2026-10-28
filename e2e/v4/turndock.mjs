import { browserPath, launchBrowser } from './lib/browser.mjs';
// E2E turn-card dock gate (2026-10-15: "Maximum update depth exceeded" in TurnCard on a market/echo/yellow/gold table,
// right after a buy step, with "You took Echo" docked under the since-strip; the game fell to "Something went wrong").
// The card docks at a foot that never depends on the story (layout.css --turn-dock), and the story leaves it room
// (--turn-h). On that table, at 1270×700 and 1100×700:
//  (d1) no page error, no console "Maximum update depth", no recovery screen;
//  (d2) whenever a turn card is up, it never covers the since-strip (≤ 1px), and stays on screen;
//  (d3) in each buy step, "Done, no recruit" and every shop card are on screen and inside the shop.
// It plays until 52+ rival placements have happened (from the save's log) with 8+ distinct rival turn cards seen (the chain paces bot moves, so several share a card).
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5186.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { answerChoice } from './lib/answer.mjs';

const TABLE = ['market', 'echo', 'yellow', 'gold'];
const WANT = Number(process.env.V4_DOCK_TURNS || 52); // rival placements played through per size
const CARDS = Number(process.env.V4_DOCK_CARDS || 8); // distinct rival turn cards seen per size (bots that move in one
// commit share one card, so cards are fewer than placements)
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5186;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const browser = await launchBrowser({ executablePath: browserPath });
async function run(size) {
  const tag = `${size.width}x${size.height}`;
  const turns = new Set();
  let worst = 0, off = 0, games = 0, placed = 0;
  while (placed < WANT && games < 3) {
    games++;
    // a fresh browser per game: a reload resumes the saved game, so "home" would never show
    const ctx = await browser.newContext({ viewport: size });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`[${tag}] (d1) pageerror: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && /Maximum update depth/i.test(m.text())) errors.push(`[${tag}] (d1) console: ${m.text().slice(0, 160)}`); });
    await page.addInitScript(() => {
      try { localStorage.setItem('patrons.v4.introSeen', '1'); } catch { /* ignore */ }
      // every turn card that appears is recorded in the page (a short one can live between two polls), and the cover
      // and on-screen checks run every frame while one is up
      const D = window.__dock = { turns: [], worst: 0, off: 0 };
      const seen = new Set();
      const scan = () => {
        const c = document.querySelector('.turn-card');
        if (c) {
          const lt = document.querySelector('.lt');
          const head = (c.dataset.turnStory || '').split(' · ')[0];
          const key = `${lt ? lt.dataset.round : ''}:${head}`;
          if (head && !/^You\b/.test(head) && !seen.has(key)) { seen.add(key); D.turns.push(key); }
          const a = c.getBoundingClientRect(), sv = document.querySelector('.lt > .lt-since');
          if (sv) { const b = sv.getBoundingClientRect(); const cover = Math.min(a.right, b.right) > Math.max(a.left, b.left) ? Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) : 0; if (cover > D.worst) D.worst = cover; }
          if (a.top < 0 || a.bottom > innerHeight + 1) D.off++;
        }
        requestAnimationFrame(scan);
      };
      requestAnimationFrame(scan);
    });
    try {
      await page.goto(`${base}/?intro=0&botDelay=20&speed=quick`);
      await page.click('[data-home="local"]', { timeout: 60000 });
      await page.waitForSelector('[data-start]');
      // the custom table, in this order
      await page.getByText(/^Custom$/).first().click();
      for (let k = 0; k < 6 && await page.$('.sphere.on'); k++) await page.click('.sphere.on'); // start from none
      for (const q of TABLE) await page.click(`.sphere[data-sphere="${q}"]`);
      await page.click('[data-start]');
      const t0 = Date.now();
      let lastMoves = null, still = 0, here = 0;
      while (Date.now() - t0 < 420000 && placed + here < WANT) {
        if (await page.getByText('Something went wrong').count()) { errors.push(`[${tag}] (d1) the game fell to "Something went wrong"`); break; }
        const s = await page.evaluate(() => {
          const c = document.querySelector('.turn-card'), sv = document.querySelector('.lt > .lt-since');
          const lt = document.querySelector('.lt');
          const out = { over: !!document.querySelector('.results') || (lt && lt.dataset.phase === 'over'), phase: lt ? lt.dataset.phase : '', yours: lt ? lt.dataset.yours : '', round: lt ? lt.dataset.round : '', moves: lt ? lt.dataset.moves : '', card: null };
          if (c) {
            const a = c.getBoundingClientRect(), b = sv ? sv.getBoundingClientRect() : null;
            const cover = b ? Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) * (Math.min(a.right, b.right) > Math.max(a.left, b.left) ? 1 : 0) : 0;
            out.card = { head: (c.dataset.turnStory || '').split(' · ')[0], cover, off: a.top < 0 || a.bottom > innerHeight + 1 };
          }
          return out;
        });
        // rival placements so far in this game, from the saved game's own log
        here = Math.max(here, await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('patrons.v4.local')).state.log.filter(l => /^P[2-4] took /.test(l)).length; } catch { return 0; } }).catch(() => 0));
        const d = await page.evaluate(() => window.__dock).catch(() => null);
        if (d) { for (const k of d.turns) turns.add(`${games}:${k}`); worst = Math.max(worst, d.worst); off = Math.max(off, d.off); }
        if (s.over) break;
        still = s.moves === lastMoves ? still + 1 : 0;
        lastMoves = s.moves;
        if (s.yours === '1') {
          if (s.phase === 'place') { const sl = await page.$('.lt-wheel .slot.can .base'); const bb = sl && await sl.boundingBox().catch(() => null); if (bb) await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); }
          else if (s.phase === 'buy') {
            // (d3) the whole market is on screen in a buy step: "Done, no recruit" and every shop card sit inside the
            // window and inside the shop (1100x700 ran the strip off the right edge in v0.9.2), and Done is pressed
            // where it stands, never scrolled to
            const m = await page.evaluate(() => {
              const box = document.querySelector('.lt-shop-body')?.getBoundingClientRect();
              const done = document.querySelector('[data-option="pass"]');
              const inside = (r, b) => r.left >= b.left - 1 && r.right <= b.right + 1 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1;
              const win = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
              const bad = [];
              for (const e of document.querySelectorAll('.lt-shop-cards .lt-cards > .lt-card, .lt-shop-cards .lt-cards > .lt-deck, .lt-shop-cards .lt-rate, [data-option="pass"]')) {
                const r = e.getBoundingClientRect();
                if (!r.width) continue;
                if (!inside(r, win) || (box && !inside(r, box))) bad.push(`${(e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24)} at ${Math.round(r.left)}-${Math.round(r.right)}`);
              }
              const d = done && done.getBoundingClientRect();
              return { bad, done: d && d.width ? { x: d.left + d.width / 2, y: d.top + d.height / 2 } : null };
            }).catch(() => ({ bad: [], done: null }));
            if (m.bad.length) errors.push(`[${tag}] (d3) off screen in the shop: ${m.bad.slice(0, 4).join('; ')}`);
            if (m.done) await page.mouse.click(m.done.x, m.done.y);
          }
          // a choice or a payment: any answer but undoing; if one doesn't move the game, try the next
          else await answerChoice(page, { avoid: ['release:', 'undo', 'back'], skip: Math.floor(still / 4), domFallback: still > 8, timeout: 1500 }).catch(() => {});
        }
        const next = await page.$('[data-next-round]');
        if (next) await next.click({ timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(120);
      }
      placed += here;
    } catch (e) {
      errors.push(`[${tag}] run (game ${games}): ${e.message.split('\n')[0]}`);
      await page.screenshot({ path: `/tmp/turndock-${tag}-fail.png` }).catch(() => {});
    }
    await ctx.close();
  }
  if (worst > 1) errors.push(`[${tag}] (d2) a turn card covered the since-strip by ${Math.round(worst)}px`);
  if (off) errors.push(`[${tag}] (d2) a turn card ran off the screen ${off} time(s)`);
  if (placed < WANT) errors.push(`[${tag}] played through only ${placed} rival placements in ${games} game(s) (want ${WANT})`);
  if (turns.size < CARDS) errors.push(`[${tag}] saw only ${turns.size} rival turn cards (want ${CARDS})`);
  console.log(`turndock [${tag}]: ${placed} rival placements, ${turns.size} rival turn cards, ${games} game(s), worst cover ${Math.round(worst)}px`);
}
// V4_DOCK_SIZES=1100x700 runs one size (bisecting a size-only failure)
const SIZES = (process.env.V4_DOCK_SIZES || '1270x700,1100x700').split(',').map(x => { const [width, height] = x.split('x').map(Number); return { width, height }; });
await Promise.all(SIZES.map(run));
await browser.close();
if (server) server.kill();
if (errors.length) console.error([...new Set(errors)].join('\n'));
console.log(errors.length ? 'FAIL turndock' : 'PASS turndock');
process.exit(errors.length ? 1 : 0);
