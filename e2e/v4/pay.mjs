// E2E dialogs gate (dialogs pod, 2026-10-15), at laptop size (1270×700):
//  (p1) Paying: the sockets are the engine's price (memberPrice), the printed cost reads as on the card, the default way
//       is already in (Pay names it), a stack click swaps a coin in (Pay moves to a legal way with one more of that
//       color) and the coins visibly move, and Enter pays.
//  (p2) A follower buy uses the same sheet: as many sockets as the tier costs.
//  (p3) Only one way to pay: no sheet, it pays at once, and the coins fly from your stack.
//  (g1) Good Deed, two steps on the board: your stacks light (no chips for the mouse), the caption sits under the
//       headline, never over the wheel; a color lifts, the rivals' seats light; a seat click gives (the engine's id).
//  (w1) Even Swap, two steps: your members light; one lifts and the rivals' members it pairs with light; a click swaps.
//  (k1) The keyboard list: absent for the mouse; Tab from the caption opens it with every pick.
// Saves: e2e/v4/lib/dialog-save.mjs. Server: $V4_URL if set, else its own `npx vite` on a free port from 5390.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { paySave, swapSave, comboSave } from './lib/dialog-save.mjs';
import { stealSave } from './lib/steal-save.mjs';
import { memberPrice, TIERS, cardDef } from '../../src/engine/v4/index.js';
import { costParts } from '../../src/v4/format.js';

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
  await page.goto(`${base}/?intro=0`, { timeout: 90000 });
  await page.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), save);
  await page.reload({ timeout: 90000 });
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
    const sockets = await page.$$eval('.dialog.pay [data-socket]', els => els.map(e => e.dataset.socket));
    if (sockets.length !== price.total) errors.push(`(p1) ${sockets.length} sockets for a price of ${price.total}`);
    if (sockets.filter(s => s !== 'any').length !== price.colored) errors.push(`(p1) ${sockets.filter(s => s !== 'any').length} colored sockets, the engine asks ${price.colored} ${price.color}`);
    const printed = costParts(cardDef(st, st.pending.uid), res).map(c => `${c.n}${c.color}`).join(' ');
    const shown = await page.$eval('[data-pay-cost]', e => e.dataset.payCost);
    if (shown !== printed) errors.push(`(p1) the cost reads "${shown}", the card prints "${printed}"`);
    const ways = st.pending.options.filter(o => o.kind === 'pay');
    const def = ways.find(o => o.default);
    if (await page.$eval('.pay-go', e => e.dataset.option) !== def.id) errors.push('(p1) Pay does not start on the suggested way');
    const coins = await page.$$eval('.dialog.pay [data-pay-coin]', els => els.length);
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
    const n = await page.$$eval('.dialog.pay [data-socket]', els => els.length);
    const want = TIERS.find(t => t.key === 'mid').cost;
    if (n !== want) errors.push(`(p2) ${n} sockets for a ${want}-cost follower buy`);
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
    await page.goto(`${base}/?intro=0`, { timeout: 90000 });
    await page.evaluate(v => localStorage.setItem('patrons.v4.local', JSON.stringify(v)), save);
    await page.reload({ timeout: 90000 });
    await page.waitForSelector('[data-home="resume"]', { timeout: 60000 });
    await page.evaluate(() => { window.__sheet = 0; window.__payPieces = 0; const t = () => { if (document.querySelector('.dialog.pay')) window.__sheet++; for (const g of document.querySelectorAll('.piece-flight.pay')) if (!g.dataset.seen) { g.dataset.seen = '1'; window.__payPieces++; } requestAnimationFrame(t); }; requestAnimationFrame(t); });
    await page.click('[data-home="resume"]');
    await page.waitForFunction(m => Number(document.querySelector('.app.game')?.dataset.moves) > m, save.state.moves, { timeout: 10000 }).catch(() => errors.push('(p3) a single way to pay was not paid'));
    await page.waitForTimeout(400);
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
} catch (e) {
  errors.push(`crashed: ${e.stack || e.message}`);
} finally {
  await browser.close();
  if (server) server.kill();
}
if (errors.length) { console.error(`dialogs gate: ${errors.length} problem(s)\n - ${errors.join('\n - ')}`); process.exit(1); }
console.log('dialogs gate: ok (pay sheet, follower buy, single way, Good Deed, Even Swap, keyboard list)');
