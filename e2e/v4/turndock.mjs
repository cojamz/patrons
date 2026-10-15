// E2E turn-card dock gate (2026-10-15: "Maximum update depth exceeded" in TurnCard on a market/echo/yellow/gold table,
// right after a buy step, with "You took Echo" docked under the since-strip; the game fell to "Something went wrong").
// The card docks at a foot that never depends on the story (layout.css --turn-dock), and the story leaves it room
// (--turn-h). Over 50+ rival turns on that table, at 1270×700 and 1100×700:
//  (d1) no page error, no console "Maximum update depth", no recovery screen;
//  (d2) whenever a turn card is up, it never covers the since-strip (≤ 1px), and stays on screen.
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5186.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { answerChoice } from './lib/answer.mjs';

const TABLE = ['market', 'echo', 'yellow', 'gold'];
const WANT = Number(process.env.V4_DOCK_TURNS || 52); // rival turn cards to see per size
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
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const size of [{ width: 1270, height: 700 }, { width: 1100, height: 700 }]) {
  const tag = `${size.width}x${size.height}`;
  const page = await (await browser.newContext({ viewport: size })).newPage();
  page.on('pageerror', e => errors.push(`[${tag}] (d1) pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && /Maximum update depth/i.test(m.text())) errors.push(`[${tag}] (d1) console: ${m.text().slice(0, 160)}`); });
  await page.addInitScript(() => { try { localStorage.setItem('patrons.v4.introSeen', '1'); } catch { /* ignore */ } });
  const rivals = new Set();
  let worst = 0, off = 0, games = 0;
  try {
    while (rivals.size < WANT && games < 3) {
      games++;
      await page.goto(`${base}/?intro=0&botDelay=20&speed=quick`);
      await page.click('[data-home="local"]');
      await page.waitForSelector('[data-start]');
      // the custom table, in this order
      await page.getByText(/^Custom$/).first().click();
      for (let k = 0; k < 6 && await page.$('.sphere.on'); k++) await page.click('.sphere.on'); // start from none
      for (const q of TABLE) await page.click(`.sphere[data-sphere="${q}"]`);
      await page.click('[data-start]');
      const t0 = Date.now();
      while (Date.now() - t0 < 300000 && rivals.size < WANT) {
        if (await page.getByText('Something went wrong').count()) { errors.push(`[${tag}] (d1) the game fell to "Something went wrong"`); break; }
        const s = await page.evaluate(() => {
          const c = document.querySelector('.turn-card'), sv = document.querySelector('.lt > .lt-since');
          const lt = document.querySelector('.lt');
          const out = { over: !!document.querySelector('.results, [data-phase="over"]'), phase: lt ? lt.dataset.phase : '', yours: lt ? lt.dataset.yours : '', card: null };
          if (c) {
            const a = c.getBoundingClientRect();
            const cover = sv ? Math.max(0, Math.min(a.bottom, sv.getBoundingClientRect().bottom) - Math.max(a.top, sv.getBoundingClientRect().top)) * (Math.min(a.right, sv.getBoundingClientRect().right) > Math.max(a.left, sv.getBoundingClientRect().left) ? 1 : 0) : 0;
            out.card = { text: c.dataset.turnStory || '', cover, off: a.top < 0 || a.bottom > innerHeight + 1 };
          }
          return out;
        });
        if (s.card) {
          if (!/^You\b/.test(s.card.text) && s.card.text) rivals.add(`${games}:${s.card.text}`);
          worst = Math.max(worst, s.card.cover);
          if (s.card.off) off++;
        }
        if (s.over) break;
        if (s.yours === '1') {
          if (s.phase === 'place') { const sl = await page.$('.lt-wheel .slot.can .base'); const bb = sl && await sl.boundingBox().catch(() => null); if (bb) await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); }
          else if (s.phase === 'buy') await page.click('[data-option="pass"]').catch(() => {});
          else await answerChoice(page, { avoid: ['release:'] }).catch(() => {});
        }
        const next = await page.$('[data-next-round]');
        if (next) await next.click().catch(() => {});
        await page.waitForTimeout(120);
      }
    }
    if (worst > 1) errors.push(`[${tag}] (d2) a turn card covered the since-strip by ${Math.round(worst)}px`);
    if (off) errors.push(`[${tag}] (d2) a turn card ran off the screen ${off} time(s)`);
    if (rivals.size < WANT) errors.push(`[${tag}] saw only ${rivals.size} rival turn cards in ${games} game(s) (want ${WANT})`);
    console.log(`turndock [${tag}]: ${rivals.size} rival turn cards over ${games} game(s), worst cover ${Math.round(worst)}px`);
  } catch (e) {
    errors.push(`[${tag}] run: ${e.message}`);
    await page.screenshot({ path: `/tmp/turndock-${tag}-fail.png` }).catch(() => {});
  }
  await page.context().close();
}
await browser.close();
if (server) server.kill();
if (errors.length) console.error([...new Set(errors)].join('\n'));
console.log(errors.length ? 'FAIL turndock' : 'PASS turndock');
process.exit(errors.length ? 1 : 0);
