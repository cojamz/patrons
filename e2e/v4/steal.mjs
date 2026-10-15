// E2E board-picker gate: a choice is answered on the board (src/v4/game/boardPick.js), at laptop size (1270×700).
//  (s1) Help Yourself: exactly the stacks the engine offers light up on the rival seats (own seat never), every other
//       rival stack is dim and says why on hover; clicking two lit stacks takes them, the counter runs 2 → 1 → 0, a
//       resource flies for each pick, and the right resources move (they arrive as magenta).
//  (s2) Collect Debts: only gold stacks light; three clicks on gold stacks take 3 gold from the right rivals.
//  (s3) Redistribute: the rival holding less than you is dim; picks from the richer two land.
//  (s4) Kickback ("give 1 gold to…"): a gift, so it's the gift card beside the space (Cory, 2026-10-16): one face per
//       rival the engine offers, and the same rivals' seats light (Cory, 2026-10-15: as Good Deed's), each the engine's
//       answer, its gold stack lit, never your own; a click on a lit seat gives that player 1 gold.
//  (s5) Echo: exactly the copyable spaces light on the wheel, the caption covers none of them, a lit space's hover says
//       what the copy gives, and clicking it copies (your resources match the engine's).
//  (s6) Snap Up: exactly the offered face-up members light in the shop; clicking one recruits it ("Recruit nothing"
//       stays a button by the caption).
//  (s7) Shake Down: the offered members glow on the rivals' seats; clicking one picks it.
// Starts from saved games stopped on each choice (e2e/v4/lib/steal-save.mjs).
// Server: $V4_URL if set, else its own `npx vite` on a free port from 5390.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { stealSave } from './lib/steal-save.mjs';
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
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

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

async function open(space, ready = '.prompt.choice.seat-pick') {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${space}] pageerror: ${e.message}`));
  const save = stealSave(space);
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

try {
  // (s1) Help Yourself: take 2
  {
    const { ctx, page, save } = await open('help');
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
    const cap = await page.$eval('.prompt.choice.seat-pick .pick-cap', e => e.textContent.replace(/\s+/g, ' ').trim());
    // the count once, "· N left" only after the first take (w4b #17: "take 2 · 2 left")
    if (!/^Help Yourself: take 2$/.test(cap)) errors.push(`(s1) caption reads "${cap}"`);
    const green0 = await count(page, 1, 'green');
    await click(page, stack(1, 'green'));
    await page.waitForSelector('.pick-left[data-left="1"]', { timeout: 8000 }).catch(() => errors.push('(s1) the counter never showed 1 left'));
    if (!(await page.$(`${stack(1, 'green')} .cs-took`))) errors.push("(s1) P2's green shows no −1 after the pick");
    // what's left, with the −1 beside it: never the old count and the change together (w3b #35)
    if ((await count(page, 1, 'green')) !== green0 - 1) errors.push(`(s1) P2's green reads ${await count(page, 1, 'green')} after a pick, not what's left (${green0 - 1})`);
    await page.screenshot({ path: `${SHOTS}/s1-one-picked.png` });
    await click(page, stack(2, 'gold'));
    await page.waitForFunction(() => !document.querySelector('.prompt.choice.seat-pick'), null, { timeout: 8000 }).catch(() => errors.push('(s1) the steal never closed'));
    await expectCounts(page, 's1', { '1:green': 3, '2:gold': 4, '0:magenta': 2 });
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
    for (const pid of [1, 2, 2]) { await click(page, stack(pid, 'gold')); await page.waitForTimeout(250); }
    await page.waitForFunction(() => !document.querySelector('.prompt.choice.seat-pick'), null, { timeout: 8000 }).catch(() => errors.push('(s2) the steal never closed'));
    const g0 = save.state.players[0].res.gold;
    await expectCounts(page, 's2', { '1:gold': 2, '2:gold': 3, '0:gold': g0 + 3 });
    const left = await seenLeft(page);
    if (left[0] !== '2' || left.includes('3')) errors.push(`(s2) the counter ran ${left.join(' → ')}`);
    await ctx.close();
  }
  // (s3) Redistribute: P4 holds less than you
  {
    const { ctx, page } = await open('redistribute');
    if (await page.$eval('.lt-seat[data-pid="3"] .lt-cult-seat', e => e.dataset.pick).catch(() => null) !== 'off') errors.push('(s3) P4 (poorer than you) is not dim');
    await click(page, stack(1, 'blue'));
    await page.waitForSelector('.pick-left[data-left="1"]', { timeout: 8000 }).catch(() => errors.push('(s3) the counter never showed 1 left'));
    await click(page, stack(2, 'magenta'));
    await page.waitForFunction(() => !document.querySelector('.prompt.choice.seat-pick'), null, { timeout: 8000 }).catch(() => errors.push('(s3) the steal never closed'));
    await expectCounts(page, 's3', { '1:blue': 1, '2:magenta': 1, '0:magenta': 2 });
    await ctx.close();
  }
  // (s4) Kickback: pick a player by their face on the gift card, or by their lit seat
  {
    const { ctx, page, save } = await open('kickback', '.lt-wheel .gift-card');
    await page.waitForSelector('.lt-wheel .gift-card[data-gift="gift"]', { timeout: 8000 }).catch(() => errors.push('(s4) no gift card for Kickback'));
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
  // (s5) Echo: copy a space on the wheel
  {
    const { ctx, page, save } = await open('echo');
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
  // (s6) Snap Up: recruit from the shop strip
  {
    const { ctx, page, save } = await open('snapup');
    const want = save.state.pending.options.filter(o => o.target && Number.isInteger(o.target.uid)).map(o => String(o.target.uid)).sort();
    const got = await page.$$eval('.lt-shop .card.lit[data-uid]', els => els.map(e => e.dataset.uid).sort());
    if (JSON.stringify(got) !== JSON.stringify(want)) errors.push(`(s6) lit shop cards ${got.join(' ')} ≠ the engine's ${want.join(' ')}`);
    if (!(await page.$('.prompt.choice.seat-pick .pick-rest-btn[data-option="none"]'))) errors.push('(s6) "Recruit nothing" is not a button by the caption');
    await click(page, `.lt-shop .card.lit[data-uid="${want[0]}"]`);
    await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, save.state.moves, { timeout: 8000 }).catch(() => errors.push('(s6) clicking the lit card did nothing'));
    await ctx.close();
  }
  // (s7) Shake Down: a rival's member, on their seat
  {
    const { ctx, page, save } = await open('shakedown');
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
console.log('board-picker gate: ok (Help Yourself, Collect Debts, Redistribute, Kickback, Echo, Snap Up, Shake Down)');
