// E2E: the end-game scoring on the results' cults, at 1270×700 (Cory, 2026-10-15; taste rule 11: "points arrive where
// they come from: followers on their own, then a +x over each member's head for its people, then pop-ups for the
// followers it grants. Never a total that just appears."). From a saved game at P1's last placement of round III
// (lib/late-save.mjs, seed 21, with Mob and Tycoon handed to P1 so the end-game bonuses never hang on the cull's deal), played to the results:
//  (s1) every seat's total starts below its final count and counts up (never the total at once);
//  (s2) a "+x" pops over each member figure of every seat with members, after the leader's followers and before
//       what members grant;
//  (s3) the members that score at game end pop what they grant over their own figure, and those pops add up to the
//       table's End-game column;
//  (s4) every seat's pops add up to its final total, the table's Followers and the seat's own count, once landed;
//  (s5) Play again is there to press throughout (the scoring never makes anyone wait);
//  (s6) a click mid-scoring lands every total at once.
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5196.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { lateSave } from './lib/late-save.mjs';
import { seedSave } from './lib/seed.mjs';
import { freeCard } from './lib/deal.mjs';

/** Seed 21 at P1's last placement of round III, with Mob (+1 per red member; P1 holds two more) and Tycoon (+1 per 2
 *  gold; P1 gets 10) in P1's cult, minted if the cull leaves them out of the deck (lib/deal.mjs). */
function scoringSave() {
  const save = lateSave(21, 3);
  const s = save.state;
  for (const def of ['red.mob', 'gold.tycoon']) {
    const uid = freeCard(s, def);
    s.shop = s.shop.filter(u => u !== uid); s.pile = s.pile.filter(u => u !== uid);
    s.players[0].members.push(uid); s.cards[uid].recruitedRound = 0; s.cards[uid].recruitedBy = 0;
  }
  while (s.shop.length < 10 && s.pile.length) s.shop.push(s.pile.shift()); // a shop copy taken is refilled
  s.players[0].res.gold = 10;
  return save;
}

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/scoring';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5196;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 60 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

// in-page: every pop as it's added (with the seat totals at that moment) and every value each seat's count shows
const WATCH = () => {
  window.__fs = { pops: [], seen: {} };
  const tick = () => {
    for (const s of document.querySelectorAll('.over-cults .over-seat[data-pid]')) {
      const v = (s.querySelector('.cs-total .tv') || {}).textContent;
      const seq = window.__fs.seen[s.dataset.pid] || (window.__fs.seen[s.dataset.pid] = []);
      if (v != null && seq[seq.length - 1] !== v) seq.push(v);
    }
    requestAnimationFrame(tick);
  };
  addEventListener('DOMContentLoaded', () => {
    new MutationObserver(ms => {
      for (const m of ms) for (const g of m.addedNodes) {
        if (!g.dataset || !g.dataset.scorePop) continue;
        const [pid, beat, n] = g.dataset.scorePop.split(':');
        const seat = g.closest('.over-seat');
        const fig = (g.dataset.uids || '').split(' ').filter(Boolean)[0];
        const onFig = !!fig && !!(seat && seat.querySelector(`.cs-member[data-uids~="${fig}"], .cs-more`));
        const playAgain = document.querySelector('[data-play-again]');
        window.__fs.pops.push({ pid, beat, n: Number(n), uids: g.dataset.uids || '', onFig, t: performance.now(), canPlay: !!playAgain && !playAgain.disabled });
      }
    }).observe(document.body, { childList: true, subtree: true });
    requestAnimationFrame(tick);
  });
};

/** A tab on the saved game, played to the round-III summary (the Reckoning skipped), then "See results". */
async function toResults() {
  const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.addInitScript(WATCH);
  await seedSave(page, scoringSave());
  // Steady, the default speed (botDelay alone would make it Quick)
  await page.goto(`${base}/?botDelay=20&intro=0&speed=steady`);
  await page.click('[data-home="resume"]');
  await page.waitForSelector('.lt-wheel .slot');
  const t0 = Date.now();
  while (!(await page.$('.roundend')) && Date.now() - t0 < 60000) {
    const sk = await page.$('[data-reckon-skip]');
    if (sk) { await sk.click().catch(() => {}); continue; }
    const o = await page.$('.slot.can, [data-option]:not([disabled]):not([data-option^="toggle:"]):not([data-option^="release:"]):not([data-option="back"])');
    if (o) await o.click({ timeout: 800 }).catch(() => {});
    await page.waitForTimeout(80);
  }
  if (!(await page.$('.roundend'))) throw new Error('the round-III summary never appeared');
  await page.click('[data-next-round]');
  await page.waitForSelector('.over-cults');
  return page;
}

/** What the results' table and seats say each player ended on. */
const finals = page => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.res-t tbody tr')].map(tr => {
  const pid = tr.querySelector('[data-cult]').dataset.cult;
  const cells = [...tr.querySelectorAll('td')];
  const heads = [...document.querySelectorAll('.res-t th')].map(th => th.textContent);
  const at = h => { const k = heads.indexOf(h); return k < 0 ? 0 : Number(cells[k].textContent.replace('−', '-').replace('+', '')); };
  const seat = document.querySelector(`.over-seat[data-pid="${pid}"]`);
  return [pid, { table: at('Followers'), endGame: at('End-game'), members: Number(tr.querySelector('.who small').textContent.match(/\d+/)?.[0] || 0),
    seat: Number(seat?.querySelector('.cs-total .tv')?.textContent), final: Number(seat?.dataset.final), figs: seat ? seat.querySelectorAll('.cs-member').length : 0 }];
})));

let ok = false;
try {
  const page = await toResults();
  const t1 = Date.now();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/s1-scoring.png` }).catch(() => {});
  await page.waitForSelector('.over-cults[data-scored="done"]', { timeout: 20000 }).catch(() => errors.push('the scoring never finished (20s)'));
  const took = Date.now() - t1;
  await page.waitForTimeout(800); // the last counts roll home
  await page.screenshot({ path: `${SHOTS}/s4-scored.png` }).catch(() => {});
  const fs = await page.evaluate(() => window.__fs);
  const end = await finals(page);
  for (const [pid, f] of Object.entries(end)) {
    const mine = fs.pops.filter(p => p.pid === pid);
    const sum = mine.reduce((t, p) => t + p.n, 0);
    // (s1) counted up, not shown at once
    const seen = (fs.seen[pid] || []).map(Number);
    if (!(seen[0] < f.table) || new Set(seen).size < 3) errors.push(`(s1) P${+pid + 1}'s count didn't climb to ${f.table} (showed ${seen.join(' → ')})`);
    // (s2) members pop over their own figures, in order
    const mem = mine.filter(p => p.beat === 'members');
    if (f.figs && !mem.length) errors.push(`(s2) P${+pid + 1} has ${f.figs} member figures and none popped a "+x"`);
    if (mem.some(p => !p.onFig)) errors.push(`(s2) P${+pid + 1}: a member's "+x" popped away from its figure`);
    const beats = mine.map(p => ['followers', 'members', 'grants'].indexOf(p.beat));
    if (beats.some((b, k) => k && b < beats[k - 1])) errors.push(`(s2) P${+pid + 1}'s pops out of order: ${mine.map(p => p.beat).join(', ')}`);
    if (!mine.length || mine[0].beat !== 'followers') errors.push(`(s2) P${+pid + 1}'s scoring didn't start with its followers`);
    // (s3) what members grant at game end, over their own figures, adds up to the End-game column
    const grants = mine.filter(p => p.beat === 'grants');
    const g = grants.reduce((t, p) => t + p.n, 0);
    if (g !== f.endGame) errors.push(`(s3) P${+pid + 1}'s end-game pops add to ${g}, the table says ${f.endGame}`);
    if (grants.some(p => !p.onFig)) errors.push(`(s3) P${+pid + 1}: an end-game "+x" popped away from its member`);
    // (s4) every pop adds up to the total, everywhere it's shown
    if (sum !== f.table || f.seat !== f.table || f.final !== f.table) errors.push(`(s4) P${+pid + 1}: pops add to ${sum}, table ${f.table}, seat ${f.seat}, engine ${f.final}`);
  }
  const granted = fs.pops.filter(p => p.beat === 'grants').length;
  if (!granted) errors.push('(s3) no member popped an end-game bonus (P1 ends holding Mob and Tycoon)');
  // (s5) Play again stood ready all along
  if (fs.pops.some(p => !p.canPlay)) errors.push('(s5) Play again was missing or disabled during the scoring');
  console.log(`scoring: ${fs.pops.length} pops (${fs.pops.filter(p => p.beat === 'members').length} members, ${granted} end-game) in ${took}ms; totals ${Object.entries(end).map(([pid, f]) => `P${+pid + 1} ${f.table}`).join(', ')}`);
  await page.close();

  // (s6) a click mid-scoring lands every total at once
  {
    const p2 = await toResults();
    await p2.waitForFunction(() => window.__fs.pops.some(p => p.beat === 'members'), null, { timeout: 8000 }).catch(() => errors.push('(s6) no member popped within 8s'));
    await p2.mouse.click(640, 80);
    const tc = Date.now();
    await p2.waitForSelector('.over-cults[data-scored="done"]', { timeout: 1000 }).catch(() => errors.push('(s6) a click did not land the scoring'));
    if (Date.now() - tc > 600) errors.push(`(s6) the scoring took ${Date.now() - tc}ms to land after a click`);
    await p2.waitForTimeout(900);
    for (const [pid, f] of Object.entries(await finals(p2))) if (f.seat !== f.table) errors.push(`(s6) after the click P${+pid + 1}'s seat shows ${f.seat}, the table ${f.table}`);
    await p2.close();
  }
  ok = errors.length === 0;
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
}
await browser.close();
if (server) server.kill();
if (errors.length) console.error(errors.join('\n'));
console.log(ok ? 'PASS scoring' : 'FAIL scoring');
process.exit(ok ? 0 : 1);
