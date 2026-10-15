// E2E dialogs gate (dialogs pod, 2026-10-15), at laptop size (1270×700):
//  (p1) Paying: the coins lifted off your stacks pay the engine's price (memberPrice), shown once (stacks + Pay, no
//       second row), the printed cost reads as on the card, the default way
//       is already in (Pay names it), a stack click swaps a coin in (Pay moves to a legal way with one more of that
//       color) and the coins visibly move, and Enter pays.
//  (p2) A follower buy uses the same sheet: the lifted coins add up to what the tier costs.
//  (p3) Only one way to pay: no sheet, it pays at once, and the coins fly from your stack.
//  (g1) Good Deed, two steps on the board: your stacks light (no chips for the mouse), the caption sits under the
//       headline, never over the wheel; a color lifts, the rivals' seats light; a seat click gives (the engine's id).
//  (w1) Even Swap, two steps: your members light; one lifts and the rivals' members it pairs with light; a click swaps.
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
  // (g1) Good Deed: a color, then the rival who gets it
  {
    const save = comboSave('gooddeed');
    const { ctx, page } = await open('g1', save, '.seat-pick.docked');
    const cap = await page.$eval('.seat-pick.docked .pick-cap', e => e.textContent.replace(/\s+/g, ' ').trim());
    if (!/^Good Deed: give 2$/.test(cap)) errors.push(`(g1) the caption reads "${cap}"`);
    const how = await page.$eval('.lt-prompt .pick-how', e => e.textContent).catch(() => '');
    if (!/pick a color, then who gets it/i.test(how)) errors.push(`(g1) the line under it reads "${how}"`);
    const docked = await page.evaluate(() => {
      const c = document.querySelector('.seat-pick.docked').getBoundingClientRect(), w = document.querySelector('.lt-wheel .stage, .lt-wheel svg, .lt-wheel').getBoundingClientRect();
      return { inPrompt: !!document.querySelector('.lt-prompt .seat-pick.docked'), overlap: c.bottom > w.top + 4 && c.top < w.bottom && c.right > w.left && c.left < w.right };
    });
    if (!docked.inPrompt) errors.push('(g1) the caption is not docked in the prompt');
    const chips = await page.$$eval('.pick-key', els => els.filter(e => e.getBoundingClientRect().width > 2).length);
    if (chips) errors.push(`(g1) ${chips} list chips show for the mouse`);
    const lit = await page.$$eval('.lt-seat[data-pid="0"] .cs-stack.pick-on', els => els.map(e => e.dataset.res).sort());
    if (lit.join() !== [...save.state.resources].sort().join()) errors.push(`(g1) your lit stacks ${lit.join(' ')}`);
    if (await page.$('.lt-seat:not([data-pid="0"]) .cs-pick-seat:not(.off)')) errors.push('(g1) a rival seat is lit before a color is picked');
    await page.screenshot({ path: `${SHOTS}/g1-step1.png` });
    await click(page, '.lt-seat[data-pid="0"] .cs-stack[data-res="red"]');
    await page.waitForSelector('.lt-seat[data-pid="0"] .cs-stack.pick-chosen[data-res="red"]', { timeout: 4000 }).catch(() => errors.push('(g1) the picked color does not stay lifted'));
    const seats = await page.$$eval('.lt-seat .cs-pick-seat:not(.off)', els => els.map(e => e.closest('.lt-seat').dataset.pid).sort());
    if (seats.join() !== '1,2,3') errors.push(`(g1) lit seats after the color: ${seats.join(' ')}`);
    await page.screenshot({ path: `${SHOTS}/g1-step2.png` });
    const before = save.state.players[2].res.red;
    await page.evaluate(() => { window.__flights = 0; const t = () => { for (const g of document.querySelectorAll('.pick-flight')) if (!g.dataset.seen) { g.dataset.seen = '1'; window.__flights++; } requestAnimationFrame(t); }; requestAnimationFrame(t); });
    await click(page, '.lt-seat[data-pid="2"] .cs-pick-seat');
    await page.waitForFunction(m => Number(document.querySelector('.app.game').dataset.moves) > m, save.state.moves, { timeout: 6000 }).catch(() => errors.push('(g1) clicking the seat gave nothing'));
    const rec = await lastMove(page);
    if (rec && rec !== 'give:2:red') errors.push(`(g1) recorded ${rec}, not give:2:red`);
    if (!(await page.evaluate(() => window.__flights))) errors.push('(g1) no coins flew to the rival');
    let got = NaN;
    for (let k = 0; k < 30 && got !== before + 2; k++) { got = await page.$eval('.lt-seat[data-pid="2"] .cs-stack[data-res="red"] b', e => Number(e.textContent)).catch(() => NaN); await page.waitForTimeout(100); }
    if (got !== before + 2) errors.push(`(g1) P3 holds ${got} red, want ${before + 2}`);
    await ctx.close();
  }
  // (w1) Even Swap: yours, then theirs
  {
    const save = swapSave('evenswap');
    const st = save.state;
    const { ctx, page } = await open('w1', save, '.seat-pick.docked');
    const cap = await page.$eval('.seat-pick.docked .pick-cap', e => e.textContent.replace(/\s+/g, ' ').trim());
    if (!/^Even Swap: pick yours · then theirs$/.test(cap)) errors.push(`(w1) the caption reads "${cap}"`);
    if (await page.$('.lt-seat:not([data-pid="0"]) .cs-member.pick-on')) errors.push('(w1) a rival member is lit before yours is picked');
    const mine = await page.$$eval('.lt-seat[data-pid="0"] .cs-member.pick-on', els => els.length);
    if (!mine) errors.push('(w1) none of your members is lit');
    await page.screenshot({ path: `${SHOTS}/w1-step1.png` });
    const btn = await page.$('.lt-seat[data-pid="0"] .cs-member.pick-on .cs-pick-member');
    const a = Number((await btn.getAttribute('data-option')).split(':')[1]);
    await click(page, '.lt-seat[data-pid="0"] .cs-member.pick-on .cs-pick-member');
    await page.waitForSelector('.lt-seat[data-pid="0"] .cs-member.pick-chosen', { timeout: 4000 }).catch(() => errors.push('(w1) your picked member does not stay lifted'));
    const capB = await page.$eval('.seat-pick.docked .pick-cap', e => e.textContent.replace(/\s+/g, ' ').trim());
    if (!capB.includes(`give ${cardDef(st, a).name}`)) errors.push(`(w1) step two reads "${capB}"`);
    const want = st.pending.options.filter(o => o.value[0] === a).map(o => o.id).sort();
    const lit = await page.$$eval('.lt-seat:not([data-pid="0"]) .cs-member.pick-on .cs-pick-member', els => els.map(e => e.dataset.option).sort());
    if (lit.join() !== want.join()) errors.push(`(w1) lit rival members ${lit.join(' ')} ≠ the engine's pairs ${want.join(' ')}`);
    await page.screenshot({ path: `${SHOTS}/w1-step2.png` });
    await click(page, '.lt-seat:not([data-pid="0"]) .cs-member.pick-on .cs-pick-member');
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
  // (a1) Wave-2 tester A: a member's hover says what a click will do ("Pays 2● 2●" at once, or "Choose how to pay"),
  //      and an instant buy flies its coins and closes the hover
  {
    const save = paySave({ res: { gold: 2, red: 0, blue: 0, green: 2 } });
    const st = save.state;
    st.queue[0] = { t: 'buy', p: 0 }; // back to the buy step: the card is clicked from the shop
    const { resume } = await import('../../src/engine/v4/core.js');
    resume(st);
    const uid = st.shop.find(u => st.cards[u].def === 'gold.prospector');
    const { ctx, page } = await open('a1', save, `.lt-shop .card[data-uid="${uid}"]`);
    await page.hover(`.lt-shop .card[data-uid="${uid}"]`);
    const line = await page.waitForSelector('[data-pays]', { timeout: 3000 }).then(e => e.innerText(), () => '');
    if (!/^Pays\s/.test(line)) errors.push(`(a1) the hover of a one-way card says "${line}", not "Pays …"`);
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
console.log('dialogs gate: ok (pay sheet, follower buy, single way, Good Deed, Even Swap, keyboard list, Snap Up pay, Talent Scout tray, Your Call, Release, Double Agent)');
