import { browserPath, launchBrowser } from './lib/browser.mjs';
// End-game bonuses must arrive during round III's Reckoning, named by member, after contests.
// Results must immediately show those already-landed totals without a second recount.
// A second run skips during a bonus and verifies every remaining bonus is settled.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { lateSave } from './lib/late-save.mjs';
import { seedSave } from './lib/seed.mjs';
import { freeCard } from './lib/deal.mjs';
import { countMembersOfColor } from '../../src/engine/v4/core.js';

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
const browser = await launchBrowser({ executablePath: browserPath });

// Observe actual rendered totals and source captions on every animation frame.
const WATCH = () => {
  window.__fs = { bonuses: [], order: [], results: [], resultPops: 0 };
  addEventListener('DOMContentLoaded', () => {
    const seenOrder = [];
    const tick = () => {
      const log = window.__fs;
      const r = document.querySelector('.lt-reckon:not(.waiting)');
      if (r && !r.querySelector('.opening') && (r.hasAttribute('data-bonus-member') || r.dataset.reckon)) {
        const uid = r.getAttribute('data-bonus-member');
        const key = uid == null ? `contest:${r.dataset.reckon}` : `bonus:${uid}`;
        if (seenOrder.at(-1) !== key) { seenOrder.push(key); log.order.push(key); }
        if (uid != null) {
          const pid = r.querySelector('[data-reckon-col]')?.dataset.reckonCol;
          if (pid != null) {
            let b = log.bonuses.at(-1);
            if (!b || b.uid !== uid) {
              b = { uid, pid, name: r.querySelector('.reckon-rule')?.textContent, values: [], verdict: '' };
              log.bonuses.push(b);
            }
            const value = Number(document.querySelector(`.lt-seat[data-pid="${pid}"] .cs-total .tv`)?.textContent);
            if (Number.isFinite(value) && b.values.at(-1) !== value) b.values.push(value);
            const verdict = r.querySelector('[data-reckon-head]')?.textContent.trim();
            if (verdict) b.verdict = verdict;
          }
        }
      }
      const results = document.querySelector('.over-cults');
      if (results) {
        const totals = Object.fromEntries([...results.querySelectorAll('.over-seat')].map(el => [el.dataset.pid, {
          expected: Number(el.dataset.final), shown: Number(el.querySelector('.cs-total .tv')?.textContent),
        }]));
        log.results.push({ done: results.dataset.scored, totals });
        log.resultPops += results.querySelectorAll('[data-score-pop]').length;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
};

/** Play the fixture's final turn, then leave the Reckoning running so its bonuses can be observed. */
async function toReckoning() {
  const page = await browser.newPage({ viewport: { width: 1270, height: 700 } });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  const save = scoringSave();
  const sources = ['red.mob', 'gold.tycoon'].map(def => ({ uid: save.state.players[0].members.find(u => save.state.cards[u].def === def), def }));
  await page.addInitScript(WATCH);
  await seedSave(page, save);
  await page.goto(`${base}/?botDelay=20&intro=0&speed=steady`);
  await page.click('[data-home="resume"]');
  await page.waitForSelector('.lt-wheel .slot');
  const t0 = Date.now();
  while (!(await page.$('.lt-reckon')) && Date.now() - t0 < 60000) {
    const o = await page.$('.slot.can, [data-option]:not([disabled]):not([data-option^="toggle:"]):not([data-option^="release:"]):not([data-option="back"])');
    if (o) await o.click({ timeout: 800 }).catch(() => {});
    await page.waitForTimeout(80);
  }
  if (!(await page.$('.lt-reckon'))) throw new Error('round-III Reckoning never appeared');
  return { page, sources };
}

async function results(page) {
  await page.waitForSelector('.roundend', { timeout: 60000 });
  // Flush the real final state; compare the browser's bonus steps with the engine's saved source ledger.
  const state = await page.evaluate(() => { dispatchEvent(new Event('pagehide')); return JSON.parse(localStorage.getItem('patrons.v4.local')).state; });
  await page.click('[data-next-round]');
  await page.waitForSelector('.over-cults[data-scored="done"]', { timeout: 1000 });
  await page.waitForTimeout(700);
  return state;
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
  const { page, sources } = await toReckoning();
  await page.waitForSelector('[data-bonus-member]', { timeout: 40000 });
  await page.screenshot({ path: `${SHOTS}/s1-member-bonus.png` });
  const state = await results(page);
  const fs = await page.evaluate(() => window.__fs);
  const end = await finals(page);
  const expected = state.players.flatMap(p => (p.final?.cards || []).filter(g => g.n).map(g => ({ ...g, pid: String(p.id), uid: String(g.uid) })));
  for (const source of sources) {
    const grant = expected.find(g => g.uid === String(source.uid) && g.pid === '0');
    const amount = source.def === 'gold.tycoon' ? Math.floor(state.players[0].res.gold / 2) : countMembersOfColor(state, state.players[0], 'red');
    if (!grant || grant.n <= 0 || grant.n !== amount) errors.push(`fixture: ${source.def} should grant ${amount}, engine recorded ${grant?.n}`);
  }
  if (fs.bonuses.length !== expected.length) errors.push(`showed ${fs.bonuses.length} bonus steps; engine granted ${expected.length}`);
  for (const g of expected) {
    const seen = fs.bonuses.filter(b => b.uid === g.uid && b.pid === g.pid);
    if (seen.length !== 1) { errors.push(`${g.name}: expected one sourced step, saw ${seen.length}`); continue; }
    const b = seen[0];
    if (b.name !== g.name || !b.verdict.includes(`from ${g.name}`)) errors.push(`${g.name}: missing source name in bonus caption (${b.verdict})`);
    const amount = b.verdict.match(/([+−-])(\d+) follower/);
    const n = amount ? Number(amount[2]) * (amount[1] === '+' ? 1 : -1) : NaN;
    if (n !== g.n) errors.push(`${g.name}: caption grants ${n}, engine grants ${g.n}`);
    if (b.values.length < 2 || b.values.at(-1) - b.values[0] !== g.n) errors.push(`${g.name}: chair should gain ${g.n} during its step, showed ${b.values.join(' → ')}`);
  }
  const firstBonus = fs.order.findIndex(k => k.startsWith('bonus:'));
  if (firstBonus !== state.quadrants.length || fs.order.slice(firstBonus).some(k => k.startsWith('contest:'))) errors.push(`bonuses did not follow every contest: ${fs.order.join(', ')}`);
  for (const [pid, f] of Object.entries(end)) {
    const sum = expected.filter(g => g.pid === pid).reduce((n, g) => n + g.n, 0);
    if (sum !== f.endGame || f.seat !== f.table || f.final !== f.table) errors.push(`P${+pid + 1}: bonuses ${sum}, end-game column ${f.endGame}, table ${f.table}, chair ${f.seat}, engine ${f.final}`);
  }
  for (const frame of fs.results) {
    if (frame.done !== 'done' || Object.values(frame.totals).some(t => t.shown !== t.expected)) errors.push('results reset/recounted totals instead of immediately showing final followers');
  }
  if (!fs.results.length || fs.resultPops) errors.push('results were missing or replayed scoring pops');
  if (!(await page.locator('[data-play-again]').isEnabled())) errors.push('Play again is unavailable');
  await page.screenshot({ path: `${SHOTS}/s4-final.png` });
  console.log(`scoring: ${fs.bonuses.length} sourced bonuses after ${state.quadrants.length} contests; final totals ${Object.values(end).map(f => f.table).join(', ')}`);
  await page.close();

  // Skipping mid-bonus settles the current bonus and every unpaid bonus before results.
  const skipped = await toReckoning();
  await skipped.page.waitForSelector('[data-bonus-member]', { timeout: 40000 });
  await skipped.page.click('[data-reckon-skip]');
  await skipped.page.waitForSelector('.roundend', { timeout: 1500 });
  await results(skipped.page);
  for (const [pid, f] of Object.entries(await finals(skipped.page))) if (f.seat !== f.table || f.final !== f.table) errors.push(`skip: P${+pid + 1} did not settle all bonuses (${JSON.stringify(f)})`);
  const skippedFrames = await skipped.page.evaluate(() => window.__fs.results);
  if (!skippedFrames.length || skippedFrames.some(frame => frame.done !== 'done' || Object.values(frame.totals).some(t => t.shown !== t.expected))) errors.push('skip: results restarted or omitted final followers');
  await skipped.page.close();
  ok = errors.length === 0;
} catch (e) {
  errors.push(`run: ${e.stack || e.message}`);
}
await browser.close();
if (server) server.kill();
if (errors.length) console.error(errors.join('\n'));
console.log(ok ? 'PASS scoring' : 'FAIL scoring');
process.exit(ok ? 0 : 1);
