import { browserPath } from './lib/browser.mjs';
// E2E: rule-bending members and Release, played through the real UI at 1270×700.
// From a saved round-I game where P1 (the only person) already holds Squatter, Insider, Straggler and a gold member:
//  (b1) Squatter: every squat:<q>-<i> option the engine offers is a clickable, labelled space (wheel + panel), and
//       clicking one places there;
//  (b2) Insider: the top-of-pile cards the engine offers show in the shop, marked "From the pile", and can be recruited;
//  (b3) Release: your releasable member's card offers "Release: +N ●" (no header dropdown); pressing it leads to the color choice and
//       finishes the release;
//  (b4) Straggler: it asks only where your last minion goes (Cory, 2026-10-15); the open spaces light on the wheel (every
//       choice is picked on the board), "Stay put" stays a button, and picking a lit space works.
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5188.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { answerChoice } from './lib/answer.mjs';
import { createGame, applyMove, chooseBotMove } from '../../src/engine/v4/index.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { buildStamp } from './lib/stamp.mjs';
import { seedSave } from './lib/seed.mjs';
import { freeCard } from './lib/deal.mjs';

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
  s.build = buildStamp(); // this build's stamp, or the app sets the save aside as "older version"
  const rand = seededRandom(seed);
  for (let n = 0; n < 800 && !(s.round === 1 && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && Object.keys(s.slots).length > 0); n++) {
    s = applyMove(s, s.pending.player === 0 ? chooseBotMove(s, rand) : chooseBotMove(s, rand));
  }
  if (!(s.round === 1 && s.pending && s.pending.player === 0 && s.pending.kind === 'place' && Object.keys(s.slots).length)) return null;
  const take = def => {
    const uid = freeCard(s, def); // a member the cull leaves out of the deck (Insider) is minted (lib/deal.mjs)
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
const browser = await chromium.launch({ executablePath: browserPath });
const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
const shot = n => page.screenshot({ path: `${SHOTS}/${n}.png` }).catch(() => {});

try {
  await seedSave(page, save); // before the app runs (lib/seed.mjs): the page's own save-on-leave can't overwrite it
  await page.goto(`${base}/?botDelay=30`);
  await page.click('[data-home="resume"]');
  await page.waitForSelector('.lt-seat[data-pid]');
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

    if (await page.$('.lt[data-phase="buy"][data-yours="1"]')) {
      // (b2) Insider: pile cards in the shop
      if (!seen.has('pile')) {
        const pile = await page.$$('.lt-shop .card .from-pile');
        if (pile.length) {
          seen.add('pile');
          await shot('b2-pile-cards');
          const card = await page.$('.lt-shop .card.can:has(.from-pile)');
          if (card) {
            const n0 = await page.$eval('.lt-seat[data-pid="0"]', e => e.textContent);
            await card.click();
            // the pay sheet: its Pay button (the suggested way), as a person would (lib/answer.mjs)
            const pay = await page.waitForSelector('.dialog.pay', { timeout: 2500 }).catch(() => null);
            if (pay) { await page.waitForTimeout(300); await answerChoice(page); }
            await page.waitForTimeout(500);
            const n1 = await page.$eval('.lt-seat[data-pid="0"]', e => e.textContent);
            if (n0 === n1) errors.push('(b2) recruiting from the pile changed nothing on P1');
            seen.add('pile-bought');
            continue;
          }
        }
      }
      // (b3) Release, a seat action (dialogs pod, wave-2 #11): in your buy step, your member's card offers
      // "Release: +N ●"; no header dropdown
      const relUid = !seen.has('release') && await page.$('.lt[data-phase="buy"][data-yours="1"]') ? await page.evaluate(() => {
        try { const s = JSON.parse(localStorage.getItem('patrons.v4.local')).state; const o = s.pending && s.pending.options.find(x => x.kind === 'release'); return o ? o.uid : null; } catch { return null; }
      }) : null;
      if (relUid != null && await page.$('.lt-prompt .rel-toggle')) errors.push('(b3) the header still has a Release dropdown');
      let rel = null;
      if (relUid != null) {
        const fig = await page.$(`.lt-seat.mine .cs-member[data-uids~="${relUid}"] .fig`);
        if (fig) { await fig.hover(); rel = await page.waitForSelector('[data-release]', { timeout: 2000 }).catch(() => null); }
        if (!rel) errors.push('(b3) your releasable member\'s card offers no Release');
      }
      if (rel && !seen.has('release')) {
        seen.add('release');
        await shot('b3-release-offered');
        const txt = ((await rel.getAttribute('aria-label')) || '').trim();
        if (!/^Release .+: it goes to the bottom of the pile and you get back \d+ \w+/.test(txt) || /undefined/.test(txt)) errors.push(`(b3) the release button says "${txt}"`);
        if (!(await rel.$('.pip'))) errors.push('(b3) the release refund is not shown as a dot');
        await rel.click();
        await page.waitForTimeout(400);
        // the color pick(s) come next as a normal choice
        let k = 0;
        // (a button by the caption, or your own lit stack: pick-on-board)
        for (; k < 12 && await page.$('.prompt.choice') && await page.$('.lt[data-phase="choose"][data-yours="1"]'); k++) {
          if (k === 0) await shot('b3-release-colors');
          await answerChoice(page);
          await page.waitForTimeout(350);
        }
        if (!k) errors.push('(b3) Release did not ask which colors');
        seen.add('released');
        continue;
      }
    }

    // (b4) Straggler: the open spaces light on the wheel, "Stay put" is a button, and picking a lit space moves it
    const prompt = await page.$eval('.prompt.choice', e => e.textContent).catch(() => '');
    if (/Straggler/.test(prompt) && !seen.has(`straggler-${prompt.slice(0, 30)}`)) {
      seen.add(`straggler-${prompt.slice(0, 30)}`);
      seen.add('straggler');
      await shot(`b4-straggler-${seen.size}`);
      if (/which (one|minion)|move one of your minions/i.test(prompt)) errors.push(`(b4) Straggler still asks which minion: "${prompt.slice(0, 80)}"`);
      const stay = await page.$('.prompt.choice button[data-option="no"]');
      if (!stay) errors.push('(b4) Straggler has no "Stay put" button');
      const onBoard = await page.$$eval('.slot[data-option]', els => els.map(e => e.getAttribute('data-option')).filter(id => /^to:/.test(id)));
      if (!onBoard.length) errors.push('(b4) Straggler\'s destinations are not lit on the wheel');
      if (onBoard.length) await page.click(`.slot[data-option="${onBoard[0]}"]`).catch(e => errors.push(`(b4) could not pick ${onBoard[0]} on the wheel: ${e.message}`));
      await page.waitForTimeout(350);
      continue;
    }

    // otherwise: the first answer in page order (lib/answer.mjs: board picks, pairs, the pay sheet; never a toggle or
    // Back), and no more releases after the first
    const did = await answerChoice(page, { avoid: ['release:'] });
    await page.waitForTimeout(did ? 60 : 80);
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
