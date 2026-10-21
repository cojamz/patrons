import { browserPath } from './lib/browser.mjs';
// E2E board-picker gate: a choice is answered on the board (src/v4/game/boardPick.js), at laptop size (1270×700).
// Steals and recruits from a space ask on the card beside that space (live panel round 1: their targets sat 420–600 px
// from the space while the prompt sat top centre), and their targets stay lit on the board as well.
//  (s1) Help Yourself: the card opens by the space, its stacks exactly the engine's options; exactly the same stacks
//       light on the rival seats (own seat never), every other rival stack is dim and says why on hover; one pick on a
//       seat and one on the card take them, the counter runs 1 → 0, a resource flies for each pick, and the right
//       resources move (they keep their colors, plus the space's +1 magenta: Cory, 2026-10-19). Round II: it steals 1 × round.
//  (s2) Collect Debts: only gold, on the seats and the card; "Take all 3" previews its picks on the card's stacks while
//       pointed at, and one click takes all 3, biggest pile first (the engine's options, recorded one by one).
//  (s3) Redistribute: 1 per Magenta action already holding a minion (2 here), split freely among rivals, so the rival
//       holding less than you is offered too; "Take all 2" plans 2; picks land, the counter running 1 → 0.
//       (s3b) A rival with nothing to take is dim on the seat and on the card, saying why.
//  (e1) Escape on Kickback's card takes the placement back (the card closes, the minion comes home).
//  (h1) Hand-pick: the offered members light in the shop (no duplicate card since #14), each with its printed cost;
//       a click takes one.
//  (t1) Straggler (v0.8.9): nothing over the wheel; its spaces the engine's, lit and answering on the wheel, Stay put in
//       the docked caption; a lit space moves the minion; Escape says Stay put.
//  (s4) Kickback ("give 1 gold to…"): a gift, so it's the gift card beside the space (Cory, 2026-10-16): one face per
//       rival the engine offers, and the same rivals' seats light (Cory, 2026-10-15: as Good Deed's), each the engine's
//       answer, its gold stack lit, never your own; a click on a lit seat gives that player 1 gold.
//  (s5) Encore (Echo copies only the previous action since Cory's 2026-10-16 call, so it asks no pick on the wheel):
//       exactly the copyable spaces light on the wheel, the caption covers none of them, a lit space's hover says
//       what the copy gives, and clicking it copies (your resources match the engine's).
//  (s6) Bury: exactly the offered face-up members light in the shop; no duplicate
//       card by the space (feedback #14); clicking a lit shop card sends it.
//  (s7) Shake Down: the offered members glow on the rivals' seats; clicking one picks it.
// Starts from saved games stopped on each choice (e2e/v4/lib/steal-save.mjs).
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5390.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { stealSave, stragglerSave, PILES, STEAL_TABLE } from './lib/steal-save.mjs';
import { applyMove } from '../../src/engine/v4/index.js';
import { seedSave } from './lib/seed.mjs';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/steal';
mkdirSync(SHOTS, { recursive: true });
let server = null;
let base = process.env.V4_URL;
if (!base) {
  const free = port => new Promise(res => { const srv = createServer().once('error', () => res(false)).once('listening', () => srv.close(() => res(true))).listen(port, 'localhost'); });
  let port = 5390;
  while (!(await free(port))) port++;
  base = `http://localhost:${port}`;
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  let up = false;
  for (let k = 0; k < 120 && !up; k++) { await new Promise(r => setTimeout(r, 500)); up = await fetch(base).then(r => r.ok, () => false); }
  if (!up) { server.kill(); console.error('vite did not start'); process.exit(1); }
}

const errors = [];
const browser = await chromium.launch({ executablePath: browserPath });

// every value the counter shows and every resource flight, frame by frame
const INSTRUMENT = () => {
  window.__left = []; window.__picks = 0;
  const tick = () => {
    for (const e of document.querySelectorAll('.pick-left[data-left]')) if (e.dataset.left !== window.__left[window.__left.length - 1]) window.__left.push(e.dataset.left);
    for (const g of document.querySelectorAll('.pick-flight')) if (!g.dataset.seen) { g.dataset.seen = '1'; window.__picks += 1; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

async function open(space, ready = '.lt-wheel .gift-card', opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${space}] pageerror: ${e.message}`));
  const save = space === 'straggler' ? stragglerSave() : stealSave(space, opts);
  await seedSave(page, save); // before the app runs (lib/seed.mjs)
  await page.goto(`${base}/?intro=0`, { timeout: 90000 });
  await page.waitForSelector('[data-home="resume"]', { timeout: 60000 });
  await page.click('[data-home="resume"]');
  await page.waitForSelector(ready, { timeout: 90000 });
  await page.evaluate(INSTRUMENT);
  return { ctx, page, save };
}
const stack = (pid, r) => `.lt-seat[data-pid="${pid}"] .cs-stack[data-res="${r}"]`;
const count = (page, pid, r) => page.$eval(`${stack(pid, r)} b`, e => Number(e.textContent)).catch(() => NaN);
async function click(page, sel) {
  const el = await page.waitForSelector(sel, { timeout: 8000 });
  const b = await el.boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}
// the numbers count up (Tick): wait for them to settle on what's expected
async function expectCounts(page, tag, want) {
  let got = {};
  for (let k = 0; k < 40; k++) {
    got = {};
    for (const [pid, r] of Object.keys(want).map(k2 => k2.split(':'))) got[`${pid}:${r}`] = await count(page, pid, r);
    if (Object.entries(want).every(([k2, v]) => got[k2] === v)) return;
    await page.waitForTimeout(150);
  }
  errors.push(`(${tag}) resources after the steal: want ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
}
const lit = page => page.$$eval('.lt-seat .cs-stack.pick-on', els => els.map(e => `${e.closest('.lt-seat').dataset.pid}:${e.dataset.res}`).sort());
const expectedLit = save => save.state.pending.options.map(o => `${o.target.pid}:${o.target.res}`).sort();
const seenLeft = page => page.evaluate(() => window.__left.slice());
// how far the card sits from a space on the wheel (0: touching), in px; the eye stays where it acted
const gapToSpace = (page, key) => page.evaluate(k => {
  const c = document.querySelector('.lt-wheel .gift-card'), sp = document.querySelector(`.lt-wheel [data-slot="${k}"]`);
  if (!c || !sp) return null;
  const a = c.getBoundingClientRect(), r = sp.getBoundingClientRect();
  return Math.round(Math.max(0, r.left - a.right, a.left - r.right) + Math.max(0, r.top - a.bottom, a.top - r.bottom));
}, key);
const cardOptions = (page, sel) => page.$$eval(`.gift-card ${sel}[data-option]`, els => els.map(e => e.dataset.option).sort());
const moved = (page, m0) => page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, m0, { timeout: 8000 }).then(() => true, () => false);

try {
  // (s1) Help Yourself: take 2 (it steals 1 × round since the Magenta rework, so round II)
  {
    const { ctx, page, save } = await open('help', '.lt-wheel .gift-card', { round: 2 });
    const want = expectedLit(save);
    const got = await lit(page);
    if (JSON.stringify(got) !== JSON.stringify(want)) errors.push(`(s1) lit stacks ${got.join(' ')} ≠ the engine's options ${want.join(' ')}`);
    if (await page.$('.lt-seat[data-pid="0"] .cs-stack.pick-on')) errors.push('(s1) your own stacks light up');
    const dims = await page.$$eval('.lt-seat:not([data-pid="0"]) .cs-stack.pick-off', els => els.map(e => [e.closest('.lt-seat').dataset.pid, e.dataset.res, e.dataset.why || '']));
    if (!dims.length) errors.push('(s1) no dim stacks on the rival seats');
    for (const [pid, r, why] of dims) if (!why) errors.push(`(s1) P${Number(pid) + 1}'s ${r} is dim without a reason`);
    // the reason shows on hover
    await page.hover(stack(1, 'magenta'));
    await page.waitForTimeout(200);
    const tip = await page.$eval(stack(1, 'magenta'), e => getComputedStyle(e, '::after').content).catch(() => '');
    if (!/no magenta/.test(tip)) errors.push(`(s1) hovering P2's empty magenta says ${tip || 'nothing'}`);
    await page.screenshot({ path: `${SHOTS}/s1-lit.png` });
    // the card by the space: the same picks as the seats, its heading the count once ("· N left" only after the first
    // take, w4b #17), and near the space you took (live panel round 1: the prompt sat 420–600 px away, top centre)
    const onCard = await cardOptions(page, '.gc-stack');
    const wantIds = save.state.pending.options.map(o => o.id).sort();
    if (onCard.join() !== wantIds.join()) errors.push(`(s1) the card's stacks answer ${onCard.join(' ')}, the engine offers ${wantIds.join(' ')}`);
    const cap = await page.$eval('.gift-card', e => `${e.querySelector('.gc-title').textContent}: ${e.querySelector('.gc-what').textContent}`.replace(/\s+/g, ' ').trim());
    if (!/^Help Yourself: Take 2$/i.test(cap)) errors.push(`(s1) the card reads "${cap}"`);
    const gap = await gapToSpace(page, save.state.players[0].lastSlot.key);
    if (gap == null || gap > 40) errors.push(`(s1) the card sits ${gap}px from the space you took (want ≤ 40)`);
    if (await page.$('.prompt.choice.seat-pick')) errors.push('(s1) the steal still asks in the header too');
    const green0 = await count(page, 1, 'green');
    await click(page, stack(1, 'green'));
    await page.waitForSelector('.pick-left[data-left="1"]', { timeout: 8000 }).catch(() => errors.push('(s1) the counter never showed 1 left'));
    if (!(await page.$(`${stack(1, 'green')} .cs-took`))) errors.push("(s1) P2's green shows no −1 after the pick");
    // what's left, with the −1 beside it: never the old count and the change together (w3b #35)
    if ((await count(page, 1, 'green')) !== green0 - 1) errors.push(`(s1) P2's green reads ${await count(page, 1, 'green')} after a pick, not what's left (${green0 - 1})`);
    const cardGreen = await page.$eval('.gift-card .gc-stack[data-pid="1"][data-res="green"] .num', e => Number(e.textContent)).catch(() => NaN);
    if (cardGreen !== green0 - 1) errors.push(`(s1) the card's P2 green reads ${cardGreen} after a pick, not what's left (${green0 - 1})`);
    await page.screenshot({ path: `${SHOTS}/s1-one-picked.png` });
    // the second pick on the card itself, coin by coin
    await click(page, '.gift-card .gc-stack[data-pid="2"][data-res="gold"]');
    await page.waitForFunction(() => !document.querySelector('.gift-card'), null, { timeout: 8000 }).catch(() => errors.push('(s1) the steal never closed'));
    // stolen resources keep their colors; the space's own +1 magenta comes on top (Cory, 2026-10-19)
    const mine = PILES[0]; // what P1 held before taking the space
    await expectCounts(page, 's1', { '1:green': 3, '2:gold': 4, '0:green': mine.green + 1, '0:gold': mine.gold + 1, '0:magenta': mine.magenta + 1 });
    const left = await seenLeft(page);
    // from the first take on (never the count again at the start); the closing "0" can be missed on a loaded box
    if (left[0] !== '1' || left.includes('2')) errors.push(`(s1) the counter ran ${left.join(' → ')}, not 1 → 0 (shown from the first take)`);
    const flights = await page.evaluate(() => window.__picks);
    if (flights < 2) errors.push(`(s1) ${flights} resource flights for 2 picks`);
    // the record (when this save keeps one) holds the two picks as option ids
    const moves = await page.evaluate(() => { try { return (JSON.parse(window.patronsRecord()).moves || []).slice(-2).map(m => m[1]); } catch { return []; } });
    if (moves.length && JSON.stringify(moves) !== JSON.stringify(['take:1:green', 'take:2:gold'])) errors.push(`(s1) recorded picks ${JSON.stringify(moves)}`);
    await page.screenshot({ path: `${SHOTS}/s1-done.png` });
    await ctx.close();
  }
  // (s2) Collect Debts: take 3 gold
  {
    const { ctx, page, save } = await open('debts');
    const got = await lit(page), want = expectedLit(save);
    if (JSON.stringify(got) !== JSON.stringify(want)) errors.push(`(s2) lit stacks ${got.join(' ')} ≠ ${want.join(' ')}`);
    const why = await page.$eval(stack(1, 'green'), e => e.dataset.why || '').catch(() => '');
    if (!/only gold/.test(why)) errors.push(`(s2) P2's green says "${why}", not that Collect Debts takes only gold`);
    const cardRes = await page.$$eval('.gift-card .gc-stack', els => [...new Set(els.map(e => e.dataset.res))]);
    if (cardRes.join() !== 'gold') errors.push(`(s2) the card offers ${cardRes.join(' ')}, not gold only`);
    // "Take all 3": pointing at it marks what each stack gives up; one click takes them all, biggest pile first
    const all = await page.$('.gift-card .gc-all[data-take-all="3"]');
    if (!all) errors.push('(s2) no "Take all 3" on the card');
    else {
      await page.hover('.gift-card .gc-all');
      await page.waitForTimeout(150);
      const marks = await page.$$eval('.gift-card .gc-stack[data-plan]', els => els.map(e => `${e.dataset.pid}:${e.dataset.plan}`).sort());
      if (marks.join() !== '1:1,2:2') errors.push(`(s2) "Take all" previews ${marks.join(' ') || 'nothing'}, want 1 from P2 and 2 from P3`);
      await page.screenshot({ path: `${SHOTS}/s2-take-all.png` });
      await page.evaluate(() => { window.__clicks = 0; addEventListener('click', () => { window.__clicks++; }, true); });
      await click(page, '.gift-card .gc-all');
      await page.waitForFunction(() => !document.querySelector('.gift-card'), null, { timeout: 10000 }).catch(() => errors.push('(s2) "Take all" never finished the steal'));
      const g0 = save.state.players[0].res.gold;
      await expectCounts(page, 's2', { '1:gold': 2, '2:gold': 3, '0:gold': g0 + 3 });
      if (await page.evaluate(() => window.__clicks) !== 1) errors.push('(s2) "Take all" took more than one click');
      const moves = await page.evaluate(() => { try { return (JSON.parse(window.patronsRecord()).moves || []).slice(-3).map(m => m[1]); } catch { return []; } });
      if (moves.length && JSON.stringify(moves) !== JSON.stringify(['player:2', 'player:2', 'player:1'])) errors.push(`(s2) "Take all" recorded ${JSON.stringify(moves)}`);
      const flights = await page.evaluate(() => window.__picks);
      if (flights < 3) errors.push(`(s2) ${flights} gold flights for 3 picks`);
    }
    await ctx.close();
  }
  // (s3) Redistribute steals 1 per Magenta action already holding a minion (Cory, 2026-10-19; was "1 from each rival"),
  // split freely among rivals like every steal: with P2 on Help Yourself and P3 on Lie Low it takes 2. Every rival
  // holding something is offered (P4, poorer than you, all the same); "Take all 2" previews a plan of 2 on offered
  // stacks; picks count down 1 → 0 and land as the engine says (stolen colors kept, +1 magenta)
  {
    const occupy = { [`${STEAL_TABLE.indexOf('thieves')}-0`]: 1, [`${STEAL_TABLE.indexOf('thieves')}-2`]: 2 };
    const { ctx, page, save } = await open('redistribute', '.lt-wheel .gift-card', { occupy });
    const st = save.state;
    if (st.pending.count?.of !== 2) errors.push(`(s3) the engine asks for ${st.pending.count?.of} steals with two Magenta actions taken, want 2`);
    const owed = [...new Set(st.pending.options.map(o => o.target.pid))].sort();
    if (owed.join() !== '1,2,3') errors.push(`(s3) the engine takes from P${owed.map(x => x + 1).join(' P')}, want every rival holding something`);
    if (await page.$eval('.lt-seat[data-pid="3"] .lt-cult-seat', e => e.dataset.pick).catch(() => null) === 'off') errors.push('(s3) P4 (poorer than you, owed all the same) is dim');
    if (await page.$('.gift-card .gc-rival[data-dim]')) errors.push('(s3) a rival on the card is dim though every rival holds something');
    const cap = await page.$eval('.gift-card', e => `${e.querySelector('.gc-title').textContent}: ${e.querySelector('.gc-what').textContent}`.replace(/\s+/g, ' ').trim()).catch(() => '');
    if (!/^Redistribute: Take 2$/i.test(cap)) errors.push(`(s3) the card reads "${cap}"`);
    if (!(await page.$('.gift-card .gc-all[data-take-all="2"]'))) errors.push('(s3) no "Take all 2" on the card');
    else {
      await page.hover('.gift-card .gc-all');
      await page.waitForTimeout(150);
      const marks = await page.$$eval('.gift-card .gc-stack[data-plan]', els => els.map(e => [e.dataset.option, Number(e.dataset.plan)]));
      const offered = new Set(st.pending.options.map(o => o.id));
      if (marks.reduce((t, [, n]) => t + n, 0) !== 2 || marks.some(([id]) => !offered.has(id))) errors.push(`(s3) "Take all" previews ${JSON.stringify(marks)}, want 2 on offered stacks`);
      await page.mouse.move(4, 690);
    }
    let after = st;
    await click(page, stack(1, 'blue')); after = applyMove(after, { player: 0, option: 'take:1:blue' });
    await page.waitForSelector('.pick-left[data-left="1"]', { timeout: 8000 }).catch(() => errors.push('(s3) the counter never showed 1 left'));
    await click(page, stack(3, 'magenta')); after = applyMove(after, { player: 0, option: 'take:3:magenta' });
    await page.waitForFunction(() => !document.querySelector('.gift-card'), null, { timeout: 8000 }).catch(() => errors.push('(s3) the steal never closed'));
    const want = {};
    for (const pid of [0, 1, 3]) for (const r of ['blue', 'magenta']) want[`${pid}:${r}`] = after.players[pid].res[r];
    if (want['1:blue'] !== 1 || want['3:magenta'] !== 0) errors.push(`(s3) the engine's own steal is off: ${JSON.stringify(want)}`);
    await expectCounts(page, 's3', want);
    await ctx.close();
  }
  // (s3b) a rival with nothing to take is the one Redistribute leaves out: dim on the seat and on the card, saying why
  {
    const piles = [{ gold: 1, magenta: 0, blue: 1, green: 1 }, { gold: 3, magenta: 0, blue: 2, green: 4 }, { gold: 5, magenta: 2, blue: 0, green: 1 }, { gold: 0, magenta: 0, blue: 0, green: 0 }];
    const { ctx, page, save } = await open('redistribute', '.lt-wheel .gift-card', { piles });
    if (save.state.pending.options.some(o => o.target.pid === 3)) errors.push('(s3b) the engine offers a take from P4, who holds nothing');
    if (await page.$eval('.lt-seat[data-pid="3"] .lt-cult-seat', e => e.dataset.pick).catch(() => null) !== 'off') errors.push('(s3b) P4 (nothing to take) is not dim');
    const why4 = await page.$eval('.gift-card .gc-rival[data-pid="3"][data-dim] .gc-why', e => e.textContent).catch(() => '');
    if (!/has nothing (left )?to take/.test(why4)) errors.push(`(s3b) P4 on the card says "${why4}", not why it can't be picked`);
    await page.screenshot({ path: `${SHOTS}/s3b-nothing.png` });
    await ctx.close();
  }
  // (s4) Kickback: pick a player by their face on the gift card, or by their lit seat
  {
    const { ctx, page, save } = await open('kickback', '.lt-wheel .gift-card');
    await page.waitForSelector('.lt-wheel .gift-card[data-gift="gift"]', { timeout: 8000 }).catch(() => errors.push('(s4) no gift card for Kickback'));
    const kgap = await gapToSpace(page, save.state.players[0].lastSlot.key);
    if (kgap == null || kgap > 40) errors.push(`(s4) the Kickback card sits ${kgap}px from the space (want ≤ 40)`);
    const faces = await page.$$eval('.gift-card .gc-face:not([disabled])', els => els.map(e => e.dataset.option).sort());
    const want = save.state.pending.options.map(o => o.id).sort();
    if (faces.join() !== want.join()) errors.push(`(s4) the card's faces answer ${faces.join(' ')}, the engine offers ${want.join(' ')}`);
    const seats = await page.evaluate(() => [...document.querySelectorAll('.lt > .lt-seat[data-pid]')].map(e => {
      const b = e.querySelector('.cs-pick-seat:not(.off)'), st = e.querySelector('.cs-stack.pick-on');
      const inset = Math.max(0, ...[...getComputedStyle(e).boxShadow.matchAll(/0px 0px 0px ([\d.]+)px inset/g)].map(m => Number(m[1])));
      return { pid: Number(e.dataset.pid), seat: b ? b.dataset.option : null, stack: st ? `${st.dataset.res}:${st.dataset.option}` : null, inset };
    }));
    const offered = new Map(save.state.pending.options.map(o => [o.target.pid, o.id]));
    for (const x of seats) {
      const id = offered.get(x.pid) || null;
      if (x.seat !== id) errors.push(`(s4) P${x.pid + 1}'s seat answers ${x.seat}, the engine offers ${id}`);
      if (id && x.stack !== `gold:${id}`) errors.push(`(s4) P${x.pid + 1}'s gold stack is not lit where the gift lands (${x.stack})`);
      if (id && x.inset < 1.5) errors.push(`(s4) P${x.pid + 1}'s seat wears no lit ring (${x.inset}px)`);
    }
    // a click on the lit seat (its middle, away from the stacks) gives, the same answer as the face
    const sb = await (await page.$('.lt-seat[data-pid="3"]')).boundingBox();
    await page.mouse.click(sb.x + sb.width * 0.35, sb.y + sb.height * 0.7);
    await page.waitForFunction(() => !document.querySelector('.gift-card'), null, { timeout: 8000 }).catch(() => errors.push('(s4) the choice never closed'));
    await expectCounts(page, 's4', { '3:gold': save.state.players[3].res.gold + 1 });
    await ctx.close();
  }
  // (s5) Encore: copy a space on the wheel (was Echo, which copies only the previous action since 2026-10-16)
  {
    const { ctx, page, save } = await open('encore', '.prompt.choice.seat-pick');
    const want = save.state.pending.options.filter(o => o.target && o.target.space).map(o => o.target.space).sort();
    const got = await page.$$eval('.lt-wheel .slot.lit[data-slot]', els => els.map(e => e.dataset.slot).sort());
    if (JSON.stringify(got) !== JSON.stringify(want)) errors.push(`(s5) lit spaces ${got.join(' ')} ≠ the engine's ${want.join(' ')}`);
    const covered = await page.evaluate(() => {
      const c = document.querySelector('.prompt.choice.seat-pick').getBoundingClientRect();
      return [...document.querySelectorAll('.lt-wheel .slot.lit')].filter(e => { const r = e.getBoundingClientRect(); return r.right > c.left + 2 && r.left < c.right - 2 && r.bottom > c.top + 2 && r.top < c.bottom - 2; }).map(e => e.dataset.slot);
    });
    if (covered.length) errors.push(`(s5) the caption covers lit space(s) ${covered.join(' ')}`);
    const o = save.state.pending.options.find(x => x.target && x.target.space);
    const sel = `.lt-wheel .slot[data-slot="${o.target.space}"]`;
    await page.hover(sel);
    await page.waitForTimeout(200);
    const note = await page.$eval(sel, e => getComputedStyle(e, '::after').content).catch(() => '');
    if (!note.includes(o.label)) errors.push(`(s5) hovering ${o.target.space} says ${note || 'nothing'}, not "${o.label}"`);
    await page.screenshot({ path: `${SHOTS}/s5-echo.png` });
    const after = applyMove(save.state, { player: 0, option: o.id });
    await click(page, sel);
    await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, save.state.moves, { timeout: 8000 }).catch(() => errors.push('(s5) clicking the lit space did nothing'));
    const mine = Object.fromEntries(Object.entries(after.players[0].res).map(([r, n]) => [`0:${r}`, n]));
    await expectCounts(page, 's5', mine);
    await ctx.close();
  }
  // (s6) Bury: pick from the shop strip. The shop is the only surface for a space's shop pick since feedback #14
  // (2026-10-17: "why also have the pop up window"; the duplicate card by the space went)
  {
    const { ctx, page, save } = await open('bury', '.lt-shop .card.lit');
    const want = save.state.pending.options.filter(o => o.target && Number.isInteger(o.target.uid)).map(o => String(o.target.uid)).sort();
    const got = await page.$$eval('.lt-shop .card.lit[data-uid]', els => els.map(e => e.dataset.uid).sort());
    if (JSON.stringify(got) !== JSON.stringify(want)) errors.push(`(s6) lit shop cards ${got.join(' ')} ≠ the engine's ${want.join(' ')}`);
    if (await page.$('.gift-card[data-gift="recruit"]')) errors.push('(s6) Bury opens a duplicate card by the space (#14)');
    await page.screenshot({ path: `${SHOTS}/s6-bury.png` });
    await click(page, `.lt-shop .card.lit[data-uid="${want[0]}"]`);
    await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, save.state.moves, { timeout: 8000 }).catch(() => errors.push('(s6) clicking the lit card did nothing'));
    await ctx.close();
  }
  // (e1) Escape closes Kickback's card: the placement is taken back
  {
    // (placed by a click, so Undo is on offer as in a real turn)
    const { ctx, page, save } = await open('kickback', '.app.game[data-phase="place"]', { placed: false });
    const q = save.state.quadrants.indexOf('gold'), key = `${q}-0`;
    await click(page, `.lt-wheel .slot.lit[data-slot="${key}"]`);
    await page.waitForSelector('.lt-wheel .gift-card[data-gift="gift"]', { timeout: 8000 }).catch(() => errors.push('(e1) placing on Kickback opened no card'));
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.gift-card') && document.querySelector('.app.game').dataset.phase === 'place', null, { timeout: 8000 })
      .catch(() => errors.push('(e1) Escape did not close the Kickback card and take the placement back'));
    // Kickback is open to place on again (the minion came home)
    if (!(await page.waitForSelector(`.lt-wheel .slot.lit[data-slot="${key}"]`, { timeout: 4000 }).then(() => true, () => false))) errors.push('(e1) Kickback is not open again after Escape');
    await ctx.close();
  }
  // (h1) Hand-pick: the offered members light in the shop, the recruit surface for every free or member pick since
  // feedback #14 (2026-10-17: the duplicate card by the space went); each shows its printed cost; a click takes one
  {
    const { ctx, page, save } = await open('handpick', '.lt-shop .card.lit');
    const want = save.state.pending.options.filter(o => o.target && Number.isInteger(o.target.uid)).map(o => o.id).sort();
    const got = await page.$$eval('.lt-shop .card.lit[data-option]', els => els.map(e => e.dataset.option).sort());
    if (got.join() !== want.join()) errors.push(`(h1) the lit shop cards answer ${got.join(' ')}, the engine offers ${want.join(' ')}`);
    if (await page.$('.gift-card[data-gift="recruit"]')) errors.push('(h1) Hand-pick still opens the duplicate card by the space (#14)');
    const costs = await page.$$eval('.lt-shop .card.lit[data-uid]', els => els.map(e => [Number(e.dataset.uid), ((e.getAttribute('aria-label').match(/costs (.*)$/) || [])[1] || '').split(' + ').reduce((t, x) => t + (parseInt(x, 10) || 0), 0)]));
    const { defById } = await import('../../src/engine/v4/index.js');
    for (const [uid, c] of costs) { const d = defById(save.state.cards[uid].def); if (c !== d.s + d.w) errors.push(`(h1) ${d.name} shows cost ${c}, printed ${d.s + d.w}`); }
    await page.screenshot({ path: `${SHOTS}/h1-handpick.png` });
    // (the shop column scrolls at 1270×700: bring the card into view, as a player would)
    await page.locator(`.lt-shop .card.lit[data-option="${want[0]}"]`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await click(page, `.lt-shop .card.lit[data-option="${want[0]}"]`);
    if (!(await moved(page, save.state.moves))) errors.push('(h1) clicking a lit member in the shop did nothing');
    const rec = await page.evaluate(() => { try { return (JSON.parse(window.patronsRecord()).moves || []).slice(-1)[0]?.[1]; } catch { return null; } });
    if (rec && rec !== want[0]) errors.push(`(h1) recorded ${rec}, clicked ${want[0]}`);
    await ctx.close();
  }
  // (t1) Straggler (v0.8.9, Cory 2026-10-19: the move menu blocked the wheel): no card over the wheel; exactly the
  // engine's spaces light on the wheel and are the answer, "Stay put" sits in the docked caption; Escape stays put
  {
    const { ctx, page, save } = await open('straggler', '.prompt.choice.seat-pick.docked');
    await page.waitForSelector('.app.game:not([data-animating])', { timeout: 8000 }).catch(() => {});
    const want = save.state.pending.options.filter(o => o.target && o.target.space).map(o => o.target.space).sort();
    const lit = await page.$$eval('.lt-wheel .slot.lit[data-slot]', els => els.map(e => e.dataset.slot).sort());
    if (lit.join() !== want.join()) errors.push(`(t1) lit spaces ${lit.join(' ')} ≠ the engine's ${want.join(' ')}`);
    const answers = await page.$$eval('.lt-wheel .slot[data-option^="to:"]', els => els.map(e => e.dataset.slot).sort());
    if (answers.join() !== want.join()) errors.push(`(t1) the wheel's answers ${answers.join(' ')} ≠ the engine's ${want.join(' ')}`);
    if (await page.$('.lt-wheel .gift-card[data-gift="move"]')) errors.push('(t1) the move menu still covers the wheel');
    if (!(await page.$('.prompt.choice.seat-pick button[data-option="no"]'))) errors.push('(t1) no Stay put in the caption');
    await page.screenshot({ path: `${SHOTS}/t1-straggler.png` });
    await page.keyboard.press('Escape');
    if (!(await moved(page, save.state.moves))) errors.push('(t1) Escape did not close Straggler');
    const rec = await page.evaluate(() => { try { return (JSON.parse(window.patronsRecord()).moves || []).slice(-1)[0]?.[1]; } catch { return null; } });
    if (rec && rec !== 'no') errors.push(`(t1) Escape recorded ${rec}, not Stay put`);
    await ctx.close();
  }
  {
    // a lit space on the wheel moves the minion there (pointed at first, as a person inspects it)
    const { ctx, page, save } = await open('straggler', '.prompt.choice.seat-pick.docked');
    await page.waitForSelector('.app.game:not([data-animating])', { timeout: 8000 }).catch(() => {});
    const o = save.state.pending.options.find(x => x.target && x.target.space);
    await page.hover(`.lt-wheel .slot[data-option="${o.id}"]`);
    await page.waitForTimeout(250);
    await click(page, `.lt-wheel .slot[data-option="${o.id}"]`);
    if (!(await moved(page, save.state.moves))) errors.push('(t1) a lit space on the wheel did nothing');
    const rec = await page.evaluate(() => { try { return (JSON.parse(window.patronsRecord()).moves || []).slice(-1)[0]?.[1]; } catch { return null; } });
    if (rec && rec !== o.id) errors.push(`(t1) recorded ${rec}, clicked ${o.id}`);
    await ctx.close();
  }
  // (s7) Shake Down: a rival's member, on their seat
  {
    const { ctx, page, save } = await open('shakedown', '.prompt.choice.seat-pick');
    const lit = await page.$$eval('.cs-member.pick-on', els => els.map(e => e.dataset.uids));
    if (!lit.length) errors.push('(s7) no member glows on a rival seat');
    const btn = await page.$('.cs-member.pick-on .cs-pick-member');
    const id = btn && await btn.getAttribute('data-option');
    if (id && !save.state.pending.options.some(o => o.id === id)) errors.push(`(s7) a lit member points at ${id}, not an engine option`);
    await page.screenshot({ path: `${SHOTS}/s7-shakedown.png` });
    if (btn) await click(page, '.cs-member.pick-on .cs-pick-member');
    await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, save.state.moves, { timeout: 8000 }).catch(() => errors.push('(s7) clicking the lit member did nothing'));
    await ctx.close();
  }
} catch (e) {
  errors.push(`crashed: ${e.stack || e.message}`);
} finally {
  await browser.close();
  if (server) server.kill();
}
if (errors.length) { console.error(`board-picker gate: ${errors.length} problem(s)\n - ${errors.join('\n - ')}`); process.exit(1); }
console.log('board-picker gate: ok (Help Yourself, Collect Debts and Take all, Redistribute, Kickback and Escape, Encore, Bury, Hand-pick, Straggler, Shake Down)');
