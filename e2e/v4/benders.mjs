// E2E: rule-bending members and Release, played through the real UI at 1270×700.
// From a saved round-I game where P1 (the only person) already holds Squatter, Insider, Straggler and a gold member:
//  (b1) Squatter: every squat:<q>-<i> option the engine offers is a clickable, labelled space (wheel + panel), and
//       clicking one places there;
//  (b2) Insider: the top-of-pile cards the engine offers show in the shop, marked "From the pile", and can be recruited;
//  (b3) Release: every release:<uid> buy option is a labelled button; pressing one leads to the color choice and
//       finishes the release;
//  (b4) Straggler: its from/to choices render as a labelled list (never mapped onto the board), and picking works.
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5188.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { createGame, applyMove, chooseBotMove } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { BUILD } from '../../src/v4/session/record.js';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/benders';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5188;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

/** Round I, P1 to place with at least one rival worker down; P1 holds the benders and plenty of every color. */
function benderSave(seed) {
  const seats = [{ name: 'P1', kind: 'human' }, { name: 'P2', kind: 'bot' }, { name: 'P3', kind: 'bot' }, { name: 'P4', kind: 'bot' }];
  let s = createGame({ seats, seed });
  s.build = { ...BUILD }; // this build's stamp, or the app sets the save aside as "older version"
  const rand = seededRandom(seed);
  for (let n = 0; n < 800 && !(s.round === 1 && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && Object.keys(s.slots).length > 0); n++) {
    s = applyMove(s, s.pending.player === 0 ? chooseBotMove(s, rand) : chooseBotMove(s, rand));
  }
  if (!(s.round === 1 && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && Object.keys(s.slots).length)) return null;
  const take = def => {
    const uid = Object.values(s.cards).find(c => c.def === def && !s.players.some(p => p.members.includes(c.uid)))?.uid;
    if (uid == null) return false;
    s.pile = s.pile.filter(u => u !== uid);
    if (s.shop.includes(uid)) return false; // keep the shop at 6: only take cards still in the pile
    s.players[0].members.push(uid);
    return true;
  };
  for (const def of ['benders.squatter', 'benders.insider', 'benders.straggler']) if (!take(def)) return null;
  for (const r of s.resources) s.players[0].res[r] = 8;
  return { config: { seats, speed: 'normal' }, state: s, undo: null, savedAt: Date.now() };
}

let save = null;
for (let seed = 1; seed < 60 && !save; seed++) save = benderSave(seed);
if (!save) { console.error('could not build a bender save'); process.exit(1); }

const errors = [];
const seen = new Set();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
const shot = n => page.screenshot({ path: `${SHOTS}/${n}.png` }).catch(() => {});

try {
  await page.goto(`${base}/?botDelay=30`);
  await page.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), save);
  await page.reload();
  await page.click('[data-home="resume"]');
  await page.waitForSelector('.players');
  await page.waitForTimeout(400);

  const t0 = Date.now();
  while (!(await page.$('.results')) && Date.now() - t0 < 240000) {
    const next = await page.$('[data-next-round]');
    if (next) { await next.click().catch(() => {}); continue; }
    const hand = await page.$('[data-handoff]');
    if (hand) { await hand.click().catch(() => {}); continue; }

    // (b1) squat: once per round, join a rival's space
    if (!seen.has('squat') && await page.$('.app.game .slot[data-option^="squat:"]')) {
      seen.add('squat');
      await shot('b1-squat-offered');
      const ids = await page.$$eval('.slot[data-option^="squat:"]', els => els.map(e => e.getAttribute('data-option')));
      const label = await page.$eval('.slot[data-option^="squat:"]', e => e.getAttribute('aria-label'));
      if (!/you can join/.test(label)) errors.push(`(b1) a joinable space doesn't say so: "${label}"`);
      const key = ids[0].slice('squat:'.length);
      const before = await page.$eval('.app.game', e => e.dataset.moves);
      const base0 = await page.$(`.slot[data-slot="${key}"] .base`);
      const bb = await base0.boundingBox();
      await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
      await page.waitForTimeout(400);
      const conf = await page.$('[data-place]'); if (conf) await conf.click();
      await page.waitForTimeout(400);
      const after = await page.$eval('.app.game', e => e.dataset.moves);
      if (after === before) errors.push(`(b1) clicking the joinable space ${key} did nothing`);
      continue;
    }

    if (await page.$('.fbuy.live')) {
      // (b2) Insider: pile cards in the shop
      if (!seen.has('pile')) {
        const pile = await page.$$('.lt-shop .card .from-pile');
        if (pile.length) {
          seen.add('pile');
          await shot('b2-pile-cards');
          const card = await page.$('.lt-shop .card.can:has(.from-pile)');
          if (card) {
            const n0 = await page.$eval('.pl[data-pid="0"]', e => e.textContent);
            await card.click();
            const pay = await page.waitForSelector('.dialog.pay .btn.pri[data-option]', { timeout: 2500 }).catch(() => null);
            if (pay) { await page.waitForTimeout(300); await pay.click(); }
            await page.waitForTimeout(500);
            const n1 = await page.$eval('.pl[data-pid="0"]', e => e.textContent);
            if (n0 === n1) errors.push('(b2) recruiting from the pile changed nothing on P1');
            seen.add('pile-bought');
            continue;
          }
        }
      }
      // (b3) Release
      const fold = !seen.has('release') && await page.$('.fbuy.live .release-row:not(.open) .rel-toggle');
      if (fold) { await fold.click(); await page.waitForTimeout(150); }
      const rel = await page.$('.fbuy.live [data-option^="release:"]');
      if (rel && !seen.has('release')) {
        seen.add('release');
        if (!(await rel.isVisible())) errors.push('(b3) the Release buttons did not open from their row');
        await shot('b3-release-offered');
        const txt = (await rel.textContent()).trim();
        if (!txt || /undefined/.test(txt)) errors.push(`(b3) release button label is "${txt}"`);
        await rel.click();
        await page.waitForTimeout(400);
        // the color pick(s) come next as a normal choice
        let k = 0;
        for (; k < 12 && await page.$('.prompt.choice button[data-option]:not([disabled])'); k++) {
          if (k === 0) await shot('b3-release-colors');
          await (await page.$('.prompt.choice button[data-option]:not([disabled])')).click().catch(() => {});
          await page.waitForTimeout(350);
        }
        if (!k) errors.push('(b3) Release did not ask which colors');
        seen.add('released');
        continue;
      }
    }

    // (b4) Straggler: a labelled list, nothing on the board
    const prompt = await page.$eval('.prompt.choice', e => e.textContent).catch(() => '');
    if (/Straggler/.test(prompt) && !seen.has(`straggler-${prompt.slice(0, 30)}`)) {
      seen.add(`straggler-${prompt.slice(0, 30)}`);
      seen.add('straggler');
      await shot(`b4-straggler-${seen.size}`);
      const btns = await page.$$eval('.prompt.choice button[data-option]', els => els.map(e => [e.getAttribute('data-option'), e.textContent.trim()]));
      if (btns.length < (/move one of your workers/.test(prompt) ? 2 : 1)) errors.push(`(b4) Straggler choice shows ${btns.length} buttons`);
      for (const [id, t] of btns) if (!t || /undefined/.test(t)) errors.push(`(b4) Straggler option ${id} has label "${t}"`);
      const onBoard = await page.$$eval('.slot[data-option]', els => els.map(e => e.getAttribute('data-option')).filter(id => /^(from|to):/.test(id)));
      if (onBoard.length) errors.push(`(b4) Straggler options mapped onto the board: ${onBoard.join(', ')}`);
      // move (the first "from"), not "Stay put"
      const pick = btns.find(([id]) => id !== 'no');
      if (pick) await page.click(`.prompt.choice button[data-option="${pick[0]}"]`).catch(e => errors.push(`(b4) could not pick ${pick[0]}: ${e.message}`));
      await page.waitForTimeout(350);
      continue;
    }

    // otherwise: first legal option (skip toggles, back, and releases after the first)
    const els = await page.$$('[data-option]:not([disabled])');
    let clicked = false;
    for (const el of els) {
      const id = await el.getAttribute('data-option').catch(() => null);
      if (!id || id.startsWith('toggle:') || id === 'back' || id.startsWith('release:')) continue;
      try { await el.click({ timeout: 1500 }); clicked = true; break; } catch { /* moved */ }
    }
    await page.waitForTimeout(clicked ? 60 : 80);
  }
  if (!(await page.$('.results'))) errors.push('the game did not finish');
  for (const why of ['squat', 'pile', 'release', 'released', 'straggler']) if (!seen.has(why)) errors.push(`never exercised ${why}`);
  await shot('results');
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
  await shot('zz-failure');
}
await browser.close();
if (server) server.kill();
if (errors.length) console.error(errors.join('\n'));
console.log(`exercised: ${[...seen].filter(x => !x.startsWith('straggler-')).join(', ')}`);
console.log(errors.length ? 'FAIL benders' : 'PASS benders');
process.exit(errors.length ? 1 : 0);
