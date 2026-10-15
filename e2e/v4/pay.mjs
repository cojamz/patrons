// E2E dialogs gate (dialogs pod, 2026-10-15), at laptop size (1270×700):
//  (p1) Paying: the coins lifted off your stacks pay the engine's price (memberPrice), shown once (stacks + Pay, no
//       second row), the printed cost reads as on the card, the default way
//       is already in (Pay names it), a stack click swaps a coin in (Pay moves to a legal way with one more of that
//       color) and the coins visibly move, and Enter pays.
//  (p2) A follower buy uses the same sheet: the lifted coins add up to what the tier costs.
//  (p3) Only one way to pay: no sheet, it pays at once, and the coins fly from your stack.
//  (g1) Good Deed on the gift card (Cory, 2026-10-16: the two-step pick on the seats was "very bad/confusing"): a small
//       card beside the space just taken, headed "Give 2 to a rival"; the table's colors are its lit first row, the
//       rivals' faces wait quiet under them (no chips, nothing lit on the seats); a color is plainly picked, a click on
//       another switches it, then the faces light and a face click gives (the engine's id), the coins flying there.
//  (w1) Even Swap on the same card: your members are the first row; one picked, the rivals' members it pairs with light
//       (each opens its own card when pointed at: w3a A3); a click swaps.
//  (k1) The keyboard list: absent for the mouse; Tab from the caption opens it with every pick.
//  Wave-2 tester B: (s8) Snap Up pays through the sheet; (t1) Talent Scout's top 5 as cards; (y1) Your Call in marks at
//  the space; (r1) Release from your member's card, no header dropdown; (d1) Double Agent's forced swap explained.
// Saves: e2e/v4/lib/dialog-save.mjs. Server: $V4_URL if set, else its own `npx vite` on a free port from 5390.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { paySave, swapSave, comboSave, momentSave } from './lib/dialog-save.mjs';
import { stealSave } from './lib/steal-save.mjs';
import { memberPrice, TIERS, cardDef } from '../../src/engine/v4/index.js';
import { costParts } from '../../src/v4/format.js';
import { seedSave } from './lib/seed.mjs';

const SHOTS = (process.env.V4_SHOTS || '/tmp/patrons-shots/v4') + '/pay';
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

async function open(tag, save, ready) {
  const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[${tag}] pageerror: ${e.message}`));
  await seedSave(page, save); // before the app runs (lib/seed.mjs)
  await page.goto(`${base}/?intro=0`, { timeout: 90000 });
  await page.waitForSelector('[data-home="resume"]', { timeout: 60000 });
  await page.click('[data-home="resume"]');
  await page.waitForSelector(ready, { timeout: 60000 });
  await page.mouse.move(640, 695);
  await page.waitForTimeout(300);
  return { ctx, page };
}
const moves = page => page.$eval('.app.game', e => Number(e.dataset.moves));
const lastMove = page => page.evaluate(() => { try { return (JSON.parse(window.patronsRecord()).moves || []).slice(-1).map(m => m[1])[0]; } catch { return null; } });
async function click(page, sel) {
  const el = await page.waitForSelector(sel, { timeout: 8000 });
  const b = await el.boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}
const vec = (res, id) => Object.fromEntries(id.slice(4).split('-').map((n, i) => [res[i], Number(n)]));

try {
  // (p1) a member: Prospector, 2 gold + 2 any, with several ways to pay
  {
    const save = paySave();
    const st = save.state, p = st.players[0], res = st.resources;
    const { ctx, page } = await open('p1', save, '.dialog.pay');
    const price = memberPrice(st, p, st.pending.uid);
    const lifted = await page.$$eval('.dialog.pay .ps-out .ps-coin', els => els.length);
    if (lifted !== price.total) errors.push(`(p1) ${lifted} coins lifted for a price of ${price.total}`);
    const liftedColor = await page.$$eval(`.dialog.pay [data-stack="${price.color}"] .ps-out .ps-coin`, els => els.length);
    if (price.color && liftedColor < price.colored) errors.push(`(p1) ${liftedColor} ${price.color} lifted, the engine asks ${price.colored}`);
    if (await page.$('.dialog.pay [data-socket], .dialog.pay .pay-sockets')) errors.push('(p1) the payment shows a second row of coins');
    const printed = costParts(cardDef(st, st.pending.uid), res).map(c => `${c.n}${c.color}`).join(' ');
    const shown = await page.$eval('[data-pay-cost]', e => e.dataset.payCost);
    if (shown !== printed) errors.push(`(p1) the cost reads "${shown}", the card prints "${printed}"`);
    const ways = st.pending.options.filter(o => o.kind === 'pay');
    const def = ways.find(o => o.default);
    if (await page.$eval('.pay-go', e => e.dataset.option) !== def.id) errors.push('(p1) Pay does not start on the suggested way');
    const coins = await page.$$eval('.dialog.pay .ps-out .ps-coin', els => els.length);
    if (coins !== res.reduce((n, r) => n + def.spend[r], 0)) errors.push(`(p1) ${coins} coins in the cost for the suggested ${def.label}`);
    if (!(await page.evaluate(() => document.querySelector('.dialog.pay').contains(document.activeElement)))) errors.push('(p1) the pay sheet does not hold focus');
    await page.screenshot({ path: `${SHOTS}/p1-sheet.png` });
    // a stack click: one more of that color goes in, a coin moves
    const r = res.find(c => p.res[c] > def.spend[c] && ways.some(o => o.spend[c] > def.spend[c]));
    await page.evaluate(() => { window.__payAnims = 0; const t = () => { window.__payAnims = Math.max(window.__payAnims, document.querySelectorAll('.dialog.pay [data-coin]').length && document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.dialog.pay')).length); if (document.querySelector('.dialog.pay')) requestAnimationFrame(t); }; requestAnimationFrame(t); });
    await click(page, `[data-pay-add="${r}"]`);
    await page.waitForTimeout(120);
    const now = await page.$eval('.pay-go', e => e.dataset.option);
    if (!ways.some(o => o.id === now) || vec(res, now)[r] !== def.spend[r] + 1) errors.push(`(p1) clicking ${r} left Pay on ${now}`);
    if (!(await page.evaluate(() => window.__payAnims))) errors.push('(p1) no coin moved when a stack was clicked');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/p1-swapped.png` });
    const m0 = await moves(page);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('.dialog.pay'), null, { timeout: 4000 }).catch(() => errors.push('(p1) Enter did not pay'));
    await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, m0, { timeout: 4000 }).catch(() => {});
    const rec = await lastMove(page);
    if (rec && rec !== now) errors.push(`(p1) paid ${rec}, the sheet showed ${now}`);
    await ctx.close();
  }
  // (p2) a follower buy: 4 → 3
  {
    const save = paySave({ tier: 'mid', res: { gold: 2, red: 3, blue: 1, green: 2 } });
    const { ctx, page } = await open('p2', save, '.dialog.pay');
    const n = await page.$$eval('.dialog.pay .ps-out .ps-coin', els => els.length);
    const want = TIERS.find(t => t.key === 'mid').cost;
    if (n !== want) errors.push(`(p2) ${n} coins lifted for a ${want}-cost follower buy`);
    await page.screenshot({ path: `${SHOTS}/p2-followers.png` });
    await ctx.close();
  }
  // (p3) one way to pay: straight through, coins flying
  {
    const save = paySave({ res: { gold: 2, red: 0, blue: 0, green: 2 } });
    if (save.state.pending.options.filter(o => o.kind === 'pay').length !== 1) errors.push('(p3) the save has more than one way to pay');
    const ctx = await browser.newContext({ viewport: { width: 1270, height: 700 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`[p3] pageerror: ${e.message}`));
    await seedSave(page, save); // before the app runs (lib/seed.mjs)
    await page.goto(`${base}/?intro=0`, { timeout: 90000 });
    await page.waitForSelector('[data-home="resume"]', { timeout: 60000 });
    await page.evaluate(() => { window.__sheet = 0; window.__payPieces = 0; const t = () => { if (document.querySelector('.dialog.pay')) window.__sheet++; for (const g of document.querySelectorAll('.piece-flight.pay')) if (!g.dataset.seen) { g.dataset.seen = '1'; window.__payPieces++; } requestAnimationFrame(t); }; requestAnimationFrame(t); });
    await page.click('[data-home="resume"]');
    await page.waitForFunction(m => Number(document.querySelector('.app.game')?.dataset.moves) > m, save.state.moves, { timeout: 10000 }).catch(() => errors.push('(p3) a single way to pay was not paid'));
    // the director plays the payment as a beat of its chain (the card lifts first), so wait for the coins themselves
    await page.waitForFunction(() => window.__payPieces >= 4, null, { timeout: 3000 }).catch(() => {});
    if (await page.evaluate(() => window.__sheet)) errors.push('(p3) the pay sheet showed for a single way to pay');
    const flown = await page.evaluate(() => window.__payPieces);
    if (flown < 4) errors.push(`(p3) ${flown} coins flew for a 4-coin payment`);
    await ctx.close();
  }
  // (g1) Good Deed: a color, then the rival who gets it, on the gift card beside the space
  {
    const save = comboSave('gooddeed');
    const slot = save.state.players[0].lastSlot && save.state.players[0].lastSlot.key;
    const { ctx, page } = await open('g1', save, '.lt-wheel .gift-card[data-gift="give"]');
    // let the card settle beside the space (GameScreen places it after it renders)
    await page.waitForTimeout(300);
    const head = await page.$eval('.gift-card .gc-what', e => e.textContent.replace(/\s+/g, ' ').trim());
    if (head !== 'Give 2 to a rival') errors.push(`(g1) the card's heading reads "${head}"`);
    const title = await page.$eval('.gift-card .gc-title', e => e.textContent.trim()).catch(() => '');
    if (!/^good deed$/i.test(title)) errors.push(`(g1) the card names "${title}", not Good Deed`);
    // beside the space just taken: the card's nearest edge within 40px of the space, never on the seats or in the header
    const where = await page.evaluate(key => {
      const c = document.querySelector('.gift-card').getBoundingClientRect();
      const s = key && document.querySelector(`.lt-wheel [data-slot="${key}"]`);
      const r = s && s.getBoundingClientRect();
      const gap = r ? Math.max(0, r.left - c.right, c.left - r.right) + Math.max(0, r.top - c.bottom, c.top - r.bottom) : null;
      return { gap, inWheel: !!document.querySelector('.lt-wheel > .gift-card'), placed: document.querySelector('.gift-card').classList.contains('at-space') };
    }, slot);
    if (!where.inWheel) errors.push('(g1) the gift card is not on the wheel');
    if (!where.placed || where.gap == null || where.gap > 40) errors.push(`(g1) the gift card is not beside the space just taken (${slot}: ${where.gap == null ? 'not found' : `${Math.round(where.gap)}px away`})`);
    // nothing picks on the seats, and no grid of combination chips
    if (await page.$('.lt-seat .cs-stack.pick-on, .lt-seat .cs-pick-seat, .seat-pick.docked')) errors.push('(g1) the seats or the header still take the pick');
    const chips = await page.$$eval('.pick-key, .prompt.choice .opts .btn', els => els.filter(e => e.getBoundingClientRect().width > 2).length);
    if (chips) errors.push(`(g1) ${chips} chips show`);
    const firstRow = await page.$$eval('.gift-card .gc-row[data-row="1"][data-live] .gc-dot:not([disabled])', els => els.map(e => e.dataset.res));
    if (firstRow.join() !== save.state.resources.join()) errors.push(`(g1) the lit colors are ${firstRow.join(' ')}, want the table's ${save.state.resources.join(' ')}`);
    const facesQuiet = await page.$$eval('.gift-card .gc-row[data-row="2"] .gc-face', els => els.map(e => [e.dataset.pid, e.disabled]));
    if (facesQuiet.map(f => f[0]).sort().join() !== '1,2,3' || facesQuiet.some(f => !f[1])) errors.push(`(g1) before a color, the faces read ${JSON.stringify(facesQuiet)} (want P2–P4, waiting)`);
    await page.screenshot({ path: `${SHOTS}/g1-step1.png` });
    const box0 = await page.$eval('.gift-card', e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
    // a color is picked plainly, and a click on another switches it
    await click(page, '.gift-card .gc-dot[data-res="yellow"]');
    await page.waitForSelector('.gift-card .gc-dot.chosen[data-res="yellow"][aria-pressed="true"]', { timeout: 4000 }).catch(() => errors.push('(g1) the picked color does not show as picked'));
    await click(page, '.gift-card .gc-dot[data-res="red"]');
    await page.waitForSelector('.gift-card .gc-dot.chosen[data-res="red"]', { timeout: 4000 }).catch(() => errors.push('(g1) a click on another color does not switch the pick'));
    if (await page.$$eval('.gift-card .gc-dot.chosen', els => els.length) !== 1) errors.push('(g1) more than one color shows as picked');
    const head2 = await page.$eval('.gift-card .gc-what', e => e.textContent.replace(/\s+/g, ' ').trim());
    if (!/^Give 2\s*to a rival$/.test(head2) || !(await page.$('.gift-card .gc-what .pip'))) errors.push(`(g1) after the color the heading reads "${head2}" (want the dot in it)`);
    const faces = await page.$$eval('.gift-card .gc-row[data-row="2"][data-live] .gc-face:not([disabled])', els => els.map(e => [e.dataset.pid, e.dataset.option]));
    if (faces.map(f => f[0]).sort().join() !== '1,2,3') errors.push(`(g1) lit faces after the color: ${faces.map(f => f[0]).join(' ')}`);
    if (faces.some(([pid, id]) => id !== `give:${pid}:red`)) errors.push(`(g1) the faces answer ${faces.map(f => f[1]).join(' ')}, not the engine's give:<pid>:red`);
    const box1 = await page.$eval('.gift-card', e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
    if (Math.abs(box1[0] - box0[0]) > 2 || Math.abs(box1[1] - box0[1]) > 2) errors.push(`(g1) the card changes size between steps (${box0.map(Math.round)} → ${box1.map(Math.round)})`);
    await page.screenshot({ path: `${SHOTS}/g1-step2.png` });
    const before = save.state.players[2].res.red;
    await page.evaluate(() => { window.__flights = 0; const t = () => { for (const g of document.querySelectorAll('.pick-flight')) if (!g.dataset.seen) { g.dataset.seen = '1'; window.__flights++; } requestAnimationFrame(t); }; requestAnimationFrame(t); });
    await click(page, '.gift-card .gc-face[data-pid="2"]');
    await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, save.state.moves, { timeout: 6000 }).catch(() => errors.push('(g1) clicking the face gave nothing'));
    const rec = await lastMove(page);
    if (rec && rec !== 'give:2:red') errors.push(`(g1) recorded ${rec}, not give:2:red`);
    if (!(await page.evaluate(() => window.__flights))) errors.push('(g1) no coins flew to the rival');
    let got = NaN;
    for (let k = 0; k < 30 && got !== before + 2; k++) { got = await page.$eval('.lt-seat[data-pid="2"] .cs-stack[data-res="red"] b', e => Number(e.textContent)).catch(() => NaN); await page.waitForTimeout(100); }
    if (got !== before + 2) errors.push(`(g1) P3 holds ${got} red, want ${before + 2}`);
    if (await page.$('.gift-card')) errors.push('(g1) the gift card stays up after the gift');
    await page.screenshot({ path: `${SHOTS}/g1-given.png` });
    await ctx.close();
  }
  // (w1) Even Swap: yours, then theirs, on the same card
  {
    const save = swapSave('evenswap');
    const st = save.state;
    const { ctx, page } = await open('w1', save, '.lt-wheel .gift-card[data-gift="trade"]');
    const head = await page.$eval('.gift-card .gc-what', e => e.textContent.replace(/\s+/g, ' ').trim());
    if (head !== 'Swap a member with a rival') errors.push(`(w1) the card's heading reads "${head}"`);
    if (await page.$('.lt-seat .cs-member.pick-on')) errors.push('(w1) members light on the seats');
    if (await page.$('.gift-card .gc-row[data-row="2"] .gc-member:not([disabled])')) errors.push('(w1) a rival member is live before yours is picked');
    const mine = await page.$$eval('.gift-card .gc-row[data-row="1"] .gc-member:not([disabled])', els => els.map(e => Number(e.dataset.uid)));
    const engineMine = [...new Set(st.pending.options.map(o => o.value[0]))];
    if (mine.slice().sort().join() !== engineMine.slice().sort().join()) errors.push(`(w1) your members on the card ${mine.join(' ')} ≠ the engine's ${engineMine.join(' ')}`);
    await page.screenshot({ path: `${SHOTS}/w1-step1.png` });
    const a = mine[0];
    await click(page, `.gift-card .gc-row[data-row="1"] .gc-member[data-uid="${a}"]`);
    await page.waitForSelector(`.gift-card .gc-member.chosen[data-uid="${a}"]`, { timeout: 4000 }).catch(() => errors.push('(w1) your picked member does not show as picked'));
    const headB = await page.$eval('.gift-card .gc-what', e => e.textContent.replace(/\s+/g, ' ').trim());
    if (!headB.includes(cardDef(st, a).name)) errors.push(`(w1) step two reads "${headB}"`);
    const want = st.pending.options.filter(o => o.value[0] === a).map(o => o.id).sort();
    const lit = await page.$$eval('.gift-card .gc-row[data-row="2"] .gc-member:not([disabled])', els => els.map(e => e.dataset.option).sort());
    if (lit.join() !== want.join()) errors.push(`(w1) live rival members ${lit.join(' ')} ≠ the engine's pairs ${want.join(' ')}`);
    await page.mouse.move(4, 690); await page.waitForTimeout(200);
    await page.screenshot({ path: `${SHOTS}/w1-step2.png` });
    // w3a A3 (blocker): a live member opens its own card when pointed at (name, cost, whose)
    {
      const t = page.locator('.gift-card .gc-row[data-row="2"] .gc-member:not([disabled])').first();
      const bb = await t.boundingBox();
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(500);
      const want1 = await t.getAttribute('data-uid');
      const shown = await page.evaluate(() => document.querySelector('[data-hover-layer][data-open="1"] [data-card-hover]')?.dataset.cardHover || null);
      if (shown !== want1) errors.push(`(w1) pointing at a live rival member opens ${shown ? `card ${shown}` : 'no card'}, not its own (${want1}): a blind swap (w3a A3)`);
      await page.mouse.move(4, 690); await page.waitForTimeout(200);
    }
    await click(page, '.gift-card .gc-row[data-row="2"] .gc-member:not([disabled])');
    await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, st.moves, { timeout: 6000 }).catch(() => errors.push('(w1) clicking their member did not swap'));
    const rec = await lastMove(page);
    if (rec && !want.includes(rec)) errors.push(`(w1) recorded ${rec}`);
    await ctx.close();
  }
  // (k1) the keyboard list: only for the keyboard
  {
    const save = stealSave('help');
    const { ctx, page } = await open('k1', save, '.seat-pick.docked');
    if (await page.$('.pick-key')) errors.push('(k1) the list is in the page before any Tab');
    await page.focus('.seat-pick.docked');
    let opened = false;
    for (let k = 0; k < 6 && !opened; k++) { await page.keyboard.press('Tab'); opened = !!(await page.$('.pick-keys .pick-key')); }
    if (!opened) errors.push('(k1) Tab never opened the list');
    else {
      const n = await page.$$eval('.pick-keys .pick-key', els => els.length);
      const want = save.state.pending.options.filter(o => o.target).length;
      if (n !== want) errors.push(`(k1) ${n} list picks for ${want} options`);
      await page.screenshot({ path: `${SHOTS}/k1-list.png` });
      await page.keyboard.press('Tab');
      const m0 = await moves(page);
      await page.keyboard.press('Enter');
      await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, m0, { timeout: 4000 }).catch(() => errors.push('(k1) Enter on a list pick did nothing'));
    }
    await ctx.close();
  }
  // (s8) Snap Up's payment uses the same sheet: the lifted coins pay the price it's paid under (any colors), Enter pays
  {
    const save = momentSave('snappay');
    const st = save.state, w = st.pending.options[0];
    const { ctx, page } = await open('s8', save, '.dialog.pay');
    const n = await page.$$eval('.dialog.pay .ps-out .ps-coin', els => els.length);
    if (n !== memberPrice(st, st.players[0], w.uid, w.how).total) errors.push(`(s8) ${n} coins lifted for Snap Up's price ${memberPrice(st, st.players[0], w.uid, w.how).total}`);
    if (await page.$('.prompt.choice .opts')) errors.push('(s8) Snap Up still shows a list of ways to pay');
    await page.screenshot({ path: `${SHOTS}/s8-snapup-pay.png` });
    const want = await page.$eval('.pay-go', e => e.dataset.option);
    await page.keyboard.press('Enter');
    await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, st.moves, { timeout: 5000 }).catch(() => errors.push('(s8) Enter did not pay'));
    const rec = await lastMove(page);
    if (rec && rec !== want) errors.push(`(s8) paid ${rec}, the sheet showed ${want}`);
    await ctx.close();
  }
  // (t1) Talent Scout: the top 5 of the pile as cards in the strip, the ones you can pay for lit; a click picks
  {
    const save = momentSave('scout');
    const st = save.state;
    const { ctx, page } = await open('t1', save, '.lt-shop-cards[data-tray="pile"]');
    const shown = await page.$$eval('.lt-shop .lt-card[data-uid]', els => els.map(e => e.dataset.uid));
    if (shown.join() !== st.pile.slice(0, 5).join()) errors.push(`(t1) the tray shows ${shown.join(' ')}, the top 5 are ${st.pile.slice(0, 5).join(' ')}`);
    const lit = await page.$$eval('.lt-shop .lt-card.lit[data-uid]', els => els.map(e => e.dataset.uid).sort());
    const want = st.pending.options.filter(o => o.kind === 'card').map(o => String(o.value)).sort();
    if (lit.join() !== want.join()) errors.push(`(t1) lit ${lit.join(' ')} ≠ the engine's ${want.join(' ')}`);
    if (await page.$$eval('.lt-shop .lt-card.recede[data-uid]', els => els.length) !== 5 - want.length) errors.push('(t1) the ones you can’t pay for don’t recede');
    if (/magenta|any\b/.test(await page.$eval('.lt-shop .lt-cards', e => e.innerText))) errors.push('(t1) a cost is written in words');
    await page.screenshot({ path: `${SHOTS}/t1-scout-tray.png` });
    await click(page, `.lt-shop .lt-card.lit[data-uid="${want[0]}"]`);
    await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, st.moves, { timeout: 5000 }).catch(() => errors.push('(t1) clicking a lit card did nothing'));
    await ctx.close();
  }
  // (y1) Your Call: big tiles in marks (no color words), at the space you just took
  {
    const save = momentSave('yourcall');
    const st = save.state;
    const { ctx, page } = await open('y1', save, '.prompt.choice.plain .opts.big');
    const words = await page.$eval('.prompt.choice.plain .opts', e => e.innerText);
    if (/white|follower/i.test(words)) errors.push(`(y1) the options read "${words.replace(/\s+/g, ' ')}"`);
    const marks = await page.$$eval('.prompt.choice.plain .opts .mark-amt', els => els.length);
    if (marks < 4) errors.push(`(y1) ${marks} marks on Your Call's options`);
    const near = await page.evaluate(key => {
      const c = document.querySelector('.prompt.choice.plain').getBoundingClientRect(), sl = document.querySelector(`.lt-wheel [data-slot="${key}"]`).getBoundingClientRect();
      const dx = Math.max(0, sl.left - c.right, c.left - sl.right), dy = Math.max(0, sl.top - c.bottom, c.top - sl.bottom);
      return Math.round(Math.hypot(dx, dy));
    }, st.players[0].lastSlot.key);
    if (near > 40) errors.push(`(y1) the question sits ${near}px from the space you took`);
    await page.screenshot({ path: `${SHOTS}/y1-yourcall.png` });
    // (y3) round III's four answers: one small card, its tiles in one row, beside the space, never over the wheel's middle
    {
      const save3 = momentSave('yourcall3');
      const { ctx: c3, page: p3 } = await open('y3', save3, '.prompt.choice.plain .opts.big');
      const g = await p3.evaluate(key => {
        const c = document.querySelector('.prompt.choice.plain').getBoundingClientRect(), sl = document.querySelector(`.lt-wheel [data-slot="${key}"]`).getBoundingClientRect();
        const w = (document.querySelector('.lt-wheel .stage') || document.querySelector('.lt-wheel')).getBoundingClientRect();
        const tops = new Set([...document.querySelectorAll('.prompt.choice.plain .opts.big .btn')].map(b => Math.round(b.getBoundingClientRect().top)));
        const dx = Math.max(0, sl.left - c.right, c.left - sl.right), dy = Math.max(0, sl.top - c.bottom, c.top - sl.bottom);
        const cx = w.left + w.width / 2, cy = w.top + w.height / 2;
        return { near: Math.round(Math.hypot(dx, dy)), rows: tops.size, n: document.querySelectorAll('.prompt.choice.plain .opts.big .btn').length, width: Math.round(c.width),
          overCentre: c.left < cx && c.right > cx && c.top < cy && c.bottom > cy };
      }, save3.state.players[0].lastSlot.key);
      if (g.n !== 4) errors.push(`(y3) round III's Your Call shows ${g.n} tiles`);
      if (g.rows > 1 || g.width > 470) errors.push(`(y3) the tiles make a ${g.width}px card in ${g.rows} rows, not one small row`);
      if (g.near > 40) errors.push(`(y3) the question sits ${g.near}px from the space you took`);
      if (g.overCentre) errors.push('(y3) the question covers the wheel\'s centre');
      await p3.screenshot({ path: `${SHOTS}/y3-yourcall.png` });
      await c3.close();
    }
    await click(page, '.prompt.choice.plain .opts .btn[data-option="amount:2"]');
    await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, st.moves, { timeout: 5000 }).catch(() => errors.push('(y1) a tile did nothing'));
    await ctx.close();
  }
  // (r1) Release on the seat: your member's card offers "Release: +N ●"; no header dropdown
  {
    const save = momentSave('release');
    const st = save.state;
    const { ctx, page } = await open('r1', save, '.lt[data-phase="buy"][data-yours="1"]');
    if (await page.$('.lt-prompt .rel-toggle, .lt-prompt .release-row')) errors.push('(r1) the header still has a Release dropdown');
    const o = st.pending.options.find(x => x.kind === 'release');
    await page.hover(`.lt-seat.mine .cs-member[data-uids~="${o.uid}"] .fig`);
    const btn = await page.waitForSelector(`[data-release][data-option="${o.id}"]`, { timeout: 3000 }).catch(() => null);
    if (!btn) errors.push('(r1) the member’s card offers no Release');
    else {
      if (!(await btn.$('.pip'))) errors.push('(r1) the refund is not a dot');
      const t = await btn.innerText();
      if (!new RegExp(`\\+${o.refund}`).test(t) || /red|blue|green|magenta/.test(t)) errors.push(`(r1) the button reads "${t}"`);
      await page.screenshot({ path: `${SHOTS}/r1-release.png` });
      await btn.click();
      await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, st.moves, { timeout: 5000 }).catch(() => errors.push('(r1) Release did nothing'));
      const rec = await lastMove(page);
      if (rec && rec !== o.id) errors.push(`(r1) recorded ${rec}`);
    }
    await ctx.close();
  }
  // (d1) Double Agent's forced swap: asked on the board, its rule under the headline, its figure marked as asking
  {
    const save = momentSave('doubleagent');
    const { ctx, page } = await open('d1', save, '.seat-pick.docked');
    const how = await page.$eval('.lt-prompt .pick-how', e => e.textContent).catch(() => '');
    if (!/When recruited/.test(how)) errors.push(`(d1) the line under the headline reads "${how}"`);
    if (!(await page.$('.lt-seat.mine .cs-member.pick-asker'))) errors.push('(d1) your Double Agent is not marked as the one asking');
    const lit = await page.$$eval('.lt-seat:not(.mine) .cs-member.pick-on', els => els.length);
    if (!lit) errors.push('(d1) no rival member is lit');
    await page.screenshot({ path: `${SHOTS}/d1-double-agent.png` });
    await ctx.close();
  }
  // (h1) w3a #14: Hustler's long question gives way to what to do ("Hustler: pick a color") and where to click, whole
  {
    const save = paySave({ def: 'gold.hustler' });
    const { applyMove } = await import('../../src/engine/v4/index.js');
    const way = save.state.pending.options.find(o => o.default) || save.state.pending.options.find(o => o.kind === 'pay');
    save.state = applyMove(save.state, { player: 0, option: way.id });
    const { ctx, page } = await open('h1', save, '.seat-pick.docked');
    const got = await page.evaluate(() => {
      const sub = document.querySelector('.lt-prompt .pick-how');
      return { cap: document.querySelector('.seat-pick.docked .pick-cap').textContent.replace(/\s+/g, ' ').trim(), how: sub ? sub.textContent : '', cut: sub ? sub.scrollWidth > sub.clientWidth + 1 : true };
    });
    if (got.cap !== 'Hustler: pick a color') errors.push(`(h1) the caption reads "${got.cap}"`);
    if (!/^Click one of your lit stacks/.test(got.how) || got.cut) errors.push(`(h1) the line under it reads "${got.how}"${got.cut ? ' (cut)' : ''}`);
    await ctx.close();
  }
  // (a1) Wave-2 tester A: an instant buy flies its coins and closes the hover. The hover says the cost and nothing else
  //      about paying (Cory, 03:40: cut "You pay"; info.mjs (q) holds it too)
  {
    const save = paySave({ res: { gold: 2, red: 0, blue: 0, green: 2 } });
    const st = save.state;
    st.queue[0] = { t: 'buy', p: 0 }; // back to the buy step: the card is clicked from the shop
    const { resume } = await import('../../src/engine/v4/core.js');
    resume(st);
    const uid = st.shop.find(u => st.cards[u].def === 'gold.prospector');
    const { ctx, page } = await open('a1', save, `.lt-shop .card[data-uid="${uid}"]`);
    await page.hover(`.lt-shop .card[data-uid="${uid}"]`);
    await page.waitForSelector(`[data-hover-layer][data-open="1"] [data-card-hover="${uid}"]`, { timeout: 3000 }).catch(() => errors.push('(a1) the card opened no hover'));
    const said = await page.evaluate(() => (document.querySelector('[data-hover-layer][data-open="1"]')?.innerText.match(/You pay|^Pays |Choose how to pay/m) || [])[0]);
    if (said) errors.push(`(a1) the hover says "${said}" (Cory: the cost and nothing else about payment)`);
    await page.evaluate(() => { window.__a1 = 0; const t = () => { for (const g of document.querySelectorAll('.piece-flight.pay')) if (!g.dataset.a1) { g.dataset.a1 = '1'; window.__a1++; } requestAnimationFrame(t); }; requestAnimationFrame(t); });
    const box = await (await page.$(`.lt-shop .card[data-uid="${uid}"]`)).boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, st.moves, { timeout: 5000 }).catch(() => errors.push('(a1) the one-way card did not buy at once'));
    if (await page.$('.dialog.pay')) errors.push('(a1) a one-way card opened the pay sheet');
    if (!(await page.waitForFunction(() => window.__a1 > 0, null, { timeout: 2500 }).then(() => true, () => false))) errors.push('(a1) no coins flew on the instant buy');
    if (await page.$('[data-hover-layer][data-open="1"]')) errors.push('(a1) the hover stayed open after the buy');
    await ctx.close();
  }
} catch (e) {
  errors.push(`crashed: ${e.stack || e.message}`);
} finally {
  await browser.close();
  if (server) server.kill();
}
if (errors.length) { console.error(`dialogs gate: ${errors.length} problem(s)\n - ${errors.join('\n - ')}`); process.exit(1); }
console.log('dialogs gate: ok (pay sheet, follower buy, single way, Good Deed, Even Swap, keyboard list, Snap Up pay, Talent Scout tray, Your Call, Release, Double Agent, Hustler)');
